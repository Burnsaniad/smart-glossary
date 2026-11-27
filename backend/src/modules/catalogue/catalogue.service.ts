import { ShopStatus, UserRole } from '../../generated/prisma/index.js';
import { getPrisma } from '../../lib/db.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../lib/errors.js';
import type {
  CreateCategoryInput,
  CreateProductInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from './catalogue.schemas.js';

async function requireShopForCustomer(shopId: string) {
  const shop = await getPrisma().shop.findFirst({
    where: { id: shopId, status: ShopStatus.APPROVED },
  });
  if (!shop) {
    throw new NotFoundError('Approved shop not found');
  }
  return shop;
}

export async function listPublicCategories(shopId: string) {
  await requireShopForCustomer(shopId);
  return getPrisma().category.findMany({
    where: { shopId },
    orderBy: { name: 'asc' },
  });
}

export async function listPublicProducts(shopId: string) {
  await requireShopForCustomer(shopId);
  return getPrisma().product.findMany({
    where: { shopId, isAvailable: true },
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  });
}

export async function getPublicProduct(shopId: string, productId: string) {
  await requireShopForCustomer(shopId);
  const product = await getPrisma().product.findFirst({
    where: { id: productId, shopId, isAvailable: true },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) {
    throw new NotFoundError('Available product not found');
  }
  return product;
}

export async function createCategory(shopId: string, input: CreateCategoryInput) {
  try {
    return await getPrisma().category.create({
      data: {
        shopId,
        name: input.name,
        ...(input.description !== undefined && { description: input.description }),
      },
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('A category with this name already exists in the shop');
    }
    throw error;
  }
}

export async function listShopCategories(shopId: string) {
  return getPrisma().category.findMany({
    where: { shopId },
    orderBy: { name: 'asc' },
  });
}

export async function updateCategory(
  shopId: string,
  categoryId: string,
  input: UpdateCategoryInput,
) {
  const prisma = getPrisma();
  const category = await prisma.category.findFirst({
    where: { id: categoryId, shopId },
  });
  if (!category) {
    throw new NotFoundError('Category not found in this shop');
  }

  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('A category with this name already exists in the shop');
    }
    throw error;
  }
}

export async function deleteCategory(shopId: string, categoryId: string) {
  const prisma = getPrisma();
  const category = await prisma.category.findFirst({
    where: { id: categoryId, shopId },
  });
  if (!category) {
    throw new NotFoundError('Category not found in this shop');
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      throw new ConflictError('Category cannot be deleted while it contains products');
    }
    throw error;
  }
}

export async function createProduct(shopId: string, input: CreateProductInput) {
  const prisma = getPrisma();
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, shopId },
  });
  if (!category) {
    throw new UnprocessableEntityError('Category must belong to this shop');
  }

  try {
    return await prisma.product.create({
      data: {
        shopId,
        categoryId: input.categoryId,
        name: input.name,
        ...(input.description !== undefined && { description: input.description }),
        price: input.price,
        unit: input.unit,
        ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
      },
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('A product with this name already exists in the shop');
    }
    throw error;
  }
}

export async function listShopProducts(shopId: string) {
  return getPrisma().product.findMany({
    where: { shopId },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function updateProduct(
  shopId: string,
  productId: string,
  role: UserRole,
  input: UpdateProductInput,
) {
  if (
    role !== UserRole.SHOP_OWNER &&
    (input.price !== undefined || input.isAvailable !== undefined)
  ) {
    throw new ForbiddenError('Only the shop owner can change price or availability');
  }

  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
  });
  if (!product) {
    throw new NotFoundError('Product not found in this shop');
  }

  if (input.categoryId !== undefined) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, shopId },
    });
    if (!category) {
      throw new UnprocessableEntityError('Category must belong to this shop');
    }
  }

  try {
    return await prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.unit !== undefined && { unit: input.unit }),
        ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
      },
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('A product with this name already exists in the shop');
    }
    throw error;
  }
}

export async function deleteProduct(shopId: string, productId: string) {
  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
  });
  if (!product) {
    throw new NotFoundError('Product not found in this shop');
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      throw new ConflictError(
        'Product cannot be deleted because it is referenced by existing records',
      );
    }
    throw error;
  }
}
