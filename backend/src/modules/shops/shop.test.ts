import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShopStatus, UserRole, UserStatus } from '../../generated/prisma/index.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import {
  approveShop,
  assignStaff,
  registerShop,
  rejectShop,
  removeStaff,
  updateShop,
} from './shop.service.js';

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  shopFindUnique: vi.fn(),
  shopFindFirst: vi.fn(),
  shopFindMany: vi.fn(),
  shopCreate: vi.fn(),
  shopUpdate: vi.fn(),
  staffFindUnique: vi.fn(),
  staffFindMany: vi.fn(),
  staffCreate: vi.fn(),
  staffDelete: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../lib/db.js', () => ({
  getPrisma: () => {
    const prisma = {
      user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
      shop: {
        findUnique: mocks.shopFindUnique,
        findFirst: mocks.shopFindFirst,
        findMany: mocks.shopFindMany,
        create: mocks.shopCreate,
        update: mocks.shopUpdate,
      },
      shopStaff: {
        findUnique: mocks.staffFindUnique,
        findMany: mocks.staffFindMany,
        create: mocks.staffCreate,
        delete: mocks.staffDelete,
      },
      $transaction: mocks.transaction,
    };
    return prisma;
  },
}));

describe('shop management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
      const tx = {
        user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
        shop: { create: mocks.shopCreate },
        shopStaff: { create: mocks.staffCreate, delete: mocks.staffDelete },
      };
      return callback(tx);
    });
  });

  it('registers a pending shop and promotes a customer to shop owner', async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: 'customer-1',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
    mocks.shopCreate.mockResolvedValue({
      id: 'shop-1',
      ownerId: 'customer-1',
      status: ShopStatus.PENDING,
      name: 'Fresh Market',
      address: '12 Main Road',
    });

    const shop = await registerShop('customer-1', {
      name: 'Fresh Market',
      address: '12 Main Road',
    });

    expect(shop.status).toBe(ShopStatus.PENDING);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      data: { role: UserRole.SHOP_OWNER },
    });
  });

  it('rejects shop updates from a non-owner', async () => {
    mocks.shopFindUnique.mockResolvedValue({ ownerId: 'owner-1' });

    await expect(
      updateShop('another-user', 'shop-1', { name: 'Renamed Shop' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('approves and rejects shops with admin metadata', async () => {
    mocks.shopFindUnique
      .mockResolvedValueOnce({ id: 'shop-1', status: ShopStatus.PENDING })
      .mockResolvedValueOnce({ id: 'shop-2', status: ShopStatus.PENDING });
    mocks.shopUpdate
      .mockResolvedValueOnce({ id: 'shop-1', status: ShopStatus.APPROVED })
      .mockResolvedValueOnce({ id: 'shop-2', status: ShopStatus.REJECTED });

    await expect(approveShop('admin-1', 'shop-1')).resolves.toMatchObject({
      status: ShopStatus.APPROVED,
    });
    await expect(rejectShop('admin-1', 'shop-2')).resolves.toMatchObject({
      status: ShopStatus.REJECTED,
    });
  });

  it('rejects duplicate approval', async () => {
    mocks.shopFindUnique.mockResolvedValue({ id: 'shop-1', status: ShopStatus.APPROVED });
    await expect(approveShop('admin-1', 'shop-1')).rejects.toBeInstanceOf(ConflictError);
  });

  it('assigns an active customer as staff and sets the staff role', async () => {
    mocks.shopFindUnique.mockResolvedValue({ ownerId: 'owner-1' });
    mocks.userFindUnique.mockResolvedValue({
      id: 'staff-1',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      shopMembership: null,
    });
    mocks.staffCreate.mockResolvedValue({
      id: 'membership-1',
      shopId: 'shop-1',
      userId: 'staff-1',
    });

    const membership = await assignStaff('owner-1', 'shop-1', { email: 'staff@example.com' });

    expect(membership.userId).toBe('staff-1');
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'staff-1' },
      data: { role: UserRole.SHOP_STAFF },
    });
  });

  it('rejects a user already assigned to a shop', async () => {
    mocks.shopFindUnique.mockResolvedValue({ ownerId: 'owner-1' });
    mocks.userFindUnique.mockResolvedValue({
      id: 'staff-1',
      role: UserRole.SHOP_STAFF,
      status: UserStatus.ACTIVE,
      shopMembership: { id: 'membership-1', shopId: 'shop-2' },
    });

    await expect(
      assignStaff('owner-1', 'shop-1', { email: 'staff@example.com' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('removes only the staff membership from the owner shop', async () => {
    mocks.shopFindUnique.mockResolvedValue({ ownerId: 'owner-1' });
    mocks.staffFindUnique.mockResolvedValue({ shopId: 'shop-1', userId: 'staff-1' });

    await removeStaff('owner-1', 'shop-1', 'staff-1');

    expect(mocks.staffDelete).toHaveBeenCalledWith({ where: { userId: 'staff-1' } });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'staff-1' },
      data: { role: UserRole.CUSTOMER },
    });
  });

  it('rejects removal of a membership in another shop', async () => {
    mocks.shopFindUnique.mockResolvedValue({ ownerId: 'owner-1' });
    mocks.staffFindUnique.mockResolvedValue({ shopId: 'shop-2', userId: 'staff-1' });

    await expect(removeStaff('owner-1', 'shop-1', 'staff-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
