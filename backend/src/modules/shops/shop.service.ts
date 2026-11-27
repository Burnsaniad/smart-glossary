import { ShopStatus, UserRole, UserStatus } from '../../generated/prisma/index.js';
import { getPrisma } from '../../lib/db.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../lib/errors.js';
import type { AssignStaffInput, CreateShopInput, UpdateShopInput } from './shop.schemas.js';

export async function registerShop(ownerId: string, input: CreateShopInput) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const owner = await tx.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundError('Authenticated user not found');
    }
    if (owner.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Inactive users cannot register shops');
    }
    if (owner.role === UserRole.ADMIN) {
      throw new ForbiddenError('Administrators cannot register shops');
    }

    const shop = await tx.shop.create({
      data: {
        ownerId,
        name: input.name,
        address: input.address,
        ...(input.phone !== undefined && { phone: input.phone }),
        status: ShopStatus.PENDING,
      },
    });

    if (owner.role !== UserRole.SHOP_OWNER) {
      await tx.user.update({
        where: { id: ownerId },
        data: { role: UserRole.SHOP_OWNER },
      });
    }

    return shop;
  });
}

export async function listApprovedShops() {
  return getPrisma().shop.findMany({
    where: { status: ShopStatus.APPROVED },
    orderBy: { name: 'asc' },
  });
}

export async function getShop(shopId: string) {
  const shop = await getPrisma().shop.findFirst({
    where: { id: shopId, status: ShopStatus.APPROVED },
  });
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }
  return shop;
}

export async function updateShop(ownerId: string, shopId: string, input: UpdateShopInput) {
  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ownerId: true },
  });
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }
  if (shop.ownerId !== ownerId) {
    throw new ForbiddenError('You do not own this shop');
  }

  return prisma.shop.update({
    where: { id: shopId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.phone !== undefined && { phone: input.phone }),
    },
  });
}

export async function approveShop(adminId: string, shopId: string) {
  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }
  if (shop.status === ShopStatus.APPROVED) {
    throw new ConflictError('Shop is already approved');
  }

  return prisma.shop.update({
    where: { id: shopId },
    data: {
      status: ShopStatus.APPROVED,
      approvedById: adminId,
      approvedAt: new Date(),
    },
  });
}

export async function rejectShop(adminId: string, shopId: string) {
  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }
  if (shop.status === ShopStatus.REJECTED) {
    throw new ConflictError('Shop is already rejected');
  }

  return prisma.shop.update({
    where: { id: shopId },
    data: {
      status: ShopStatus.REJECTED,
      approvedById: adminId,
      approvedAt: null,
    },
  });
}

export async function listPendingShops() {
  return getPrisma().shop.findMany({
    where: { status: ShopStatus.PENDING },
    orderBy: { createdAt: 'asc' },
  });
}

export async function assignStaff(ownerId: string, shopId: string, input: AssignStaffInput) {
  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ownerId: true },
  });
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }
  if (shop.ownerId !== ownerId) {
    throw new ForbiddenError('You do not own this shop');
  }

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { shopMembership: true },
  });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw new UnprocessableEntityError('Only active users can be assigned as staff');
  }
  if (user.role === UserRole.ADMIN || user.role === UserRole.SHOP_OWNER) {
    throw new UnprocessableEntityError('This user cannot be assigned as shop staff');
  }
  if (user.shopMembership) {
    throw new ConflictError('User is already assigned to a shop');
  }

  return prisma.$transaction(async (tx) => {
    const membership = await tx.shopStaff.create({
      data: { shopId, userId: user.id },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { role: UserRole.SHOP_STAFF },
    });
    return membership;
  });
}

export async function removeStaff(ownerId: string, shopId: string, staffUserId: string) {
  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ownerId: true },
  });
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }
  if (shop.ownerId !== ownerId) {
    throw new ForbiddenError('You do not own this shop');
  }

  const membership = await prisma.shopStaff.findUnique({
    where: { userId: staffUserId },
  });
  if (membership?.shopId !== shopId) {
    throw new NotFoundError('Staff membership not found');
  }

  return prisma.$transaction(async (tx) => {
    await tx.shopStaff.delete({ where: { userId: staffUserId } });
    await tx.user.update({
      where: { id: staffUserId },
      data: { role: UserRole.CUSTOMER },
    });
  });
}

export async function listStaff(ownerId: string, shopId: string) {
  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ownerId: true },
  });
  if (!shop) {
    throw new NotFoundError('Shop not found');
  }
  if (shop.ownerId !== ownerId) {
    throw new ForbiddenError('You do not own this shop');
  }

  return prisma.shopStaff.findMany({
    where: { shopId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, status: true, role: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
}
