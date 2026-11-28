import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OrderChangeStatus,
  OrderStatus,
  ShopStatus,
  UserRole,
  UserStatus,
} from '../../generated/prisma/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../lib/errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  acceptOrder,
  approveChangeRequest,
  cancelOrder,
  declineChangeRequest,
  placeOrder,
  startPreparation,
  updateOrderItems,
} from './order.service.js';

const mocks = vi.hoisted(() => ({
  shopFindFirst: vi.fn(),
  shopFindUnique: vi.fn(),
  staffFindUnique: vi.fn(),
  productFindMany: vi.fn(),
  groceryListFindFirst: vi.fn(),
  groceryListItemDeleteMany: vi.fn(),
  orderCreate: vi.fn(),
  orderFindFirst: vi.fn(),
  orderFindUnique: vi.fn(),
  orderUpdate: vi.fn(),
  orderItemDeleteMany: vi.fn(),
  orderItemCreateMany: vi.fn(),
  orderItemFindMany: vi.fn(),
  changeFindUnique: vi.fn(),
  changeFindFirst: vi.fn(),
  changeCreate: vi.fn(),
  changeUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../lib/db.js', () => ({
  getPrisma: () => {
    const prisma = {
      shop: { findFirst: mocks.shopFindFirst, findUnique: mocks.shopFindUnique },
      shopStaff: { findUnique: mocks.staffFindUnique },
      product: { findMany: mocks.productFindMany },
      groceryList: { findFirst: mocks.groceryListFindFirst },
      groceryListItem: { deleteMany: mocks.groceryListItemDeleteMany },
      customerOrder: {
        create: mocks.orderCreate,
        findFirst: mocks.orderFindFirst,
        findUnique: mocks.orderFindUnique,
        update: mocks.orderUpdate,
      },
      orderItem: {
        deleteMany: mocks.orderItemDeleteMany,
        createMany: mocks.orderItemCreateMany,
        findMany: mocks.orderItemFindMany,
      },
      orderChangeRequest: {
        findUnique: mocks.changeFindUnique,
        findFirst: mocks.changeFindFirst,
        create: mocks.changeCreate,
        update: mocks.changeUpdate,
      },
      $transaction: mocks.transaction,
    };
    return prisma;
  },
}));

const staffUser = {
  id: 'staff-1',
  name: 'Staff',
  email: 'staff@example.com',
  role: UserRole.SHOP_STAFF,
  status: UserStatus.ACTIVE,
} satisfies AuthenticatedUser;

describe('order lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
      const tx = {
        shop: { findFirst: mocks.shopFindFirst, findUnique: mocks.shopFindUnique },
        shopStaff: { findUnique: mocks.staffFindUnique },
        product: { findMany: mocks.productFindMany },
        groceryList: { findFirst: mocks.groceryListFindFirst },
        groceryListItem: { deleteMany: mocks.groceryListItemDeleteMany },
        customerOrder: {
          create: mocks.orderCreate,
          findFirst: mocks.orderFindFirst,
          findUnique: mocks.orderFindUnique,
          update: mocks.orderUpdate,
        },
        orderItem: {
          deleteMany: mocks.orderItemDeleteMany,
          createMany: mocks.orderItemCreateMany,
          findMany: mocks.orderItemFindMany,
        },
        orderChangeRequest: {
          findFirst: mocks.changeFindFirst,
          create: mocks.changeCreate,
          update: mocks.changeUpdate,
        },
      };
      return callback(tx);
    });
  });

  it('places an order with authoritative prices and snapshots', async () => {
    mocks.shopFindFirst.mockResolvedValue({ id: 'shop-1', status: ShopStatus.APPROVED });
    mocks.productFindMany.mockResolvedValue([
      { id: 'product-1', name: 'Apple', price: { toString: () => '2.50' } },
    ]);
    mocks.orderCreate.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.PENDING,
      subtotal: '5.00',
      total: '5.00',
    });

    await expect(
      placeOrder('customer-1', {
        shopId: 'shop-1',
        items: [{ productId: 'product-1', quantity: 2 }],
      }),
    ).resolves.toMatchObject({ id: 'order-1', status: OrderStatus.PENDING });

    expect(mocks.orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: '5.00',
          total: '5.00',
          items: {
            create: [
              expect.objectContaining({
                productNameSnapshot: 'Apple',
                unitPriceSnapshot: '2.50',
                lineTotal: '5.00',
              }),
            ],
          },
        }),
      }),
    );
  });

  it('rejects unavailable or wrong-shop products', async () => {
    mocks.shopFindFirst.mockResolvedValue({ id: 'shop-1', status: ShopStatus.APPROVED });
    mocks.productFindMany.mockResolvedValue([]);

    await expect(
      placeOrder('customer-1', {
        shopId: 'shop-1',
        items: [{ productId: 'product-2', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('clears a shop-specific source grocery list only when requested', async () => {
    mocks.shopFindFirst.mockResolvedValue({ id: 'shop-1', status: ShopStatus.APPROVED });
    mocks.groceryListFindFirst.mockResolvedValue({
      id: 'list-1',
      customerId: 'customer-1',
      shopId: 'shop-1',
      items: [{ productId: 'product-1', quantity: 2 }],
    });
    mocks.productFindMany.mockResolvedValue([
      { id: 'product-1', name: 'Apple', price: { toString: () => '2.50' } },
    ]);
    mocks.orderCreate.mockResolvedValue({ id: 'order-1', status: OrderStatus.PENDING });

    await placeOrder('customer-1', {
      shopId: 'shop-1',
      sourceGroceryListId: 'list-1',
      sourceListChoice: 'CLEAR',
    });

    expect(mocks.groceryListItemDeleteMany).toHaveBeenCalledWith({
      where: { groceryListId: 'list-1' },
    });
  });

  it('allows customer item updates only before preparation starts', async () => {
    mocks.orderFindFirst.mockResolvedValue({
      id: 'order-1',
      customerId: 'customer-1',
      shopId: 'shop-1',
      status: OrderStatus.PREPARING,
    });

    await expect(
      updateOrderItems('customer-1', 'order-1', {
        items: [{ productId: 'product-1', quantity: 2 }],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('cancels only pending or accepted orders', async () => {
    mocks.orderFindFirst.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.PREPARING,
    });

    await expect(cancelOrder('customer-1', 'order-1')).rejects.toBeInstanceOf(ConflictError);
  });

  it('accepts and starts preparation through explicit transitions', async () => {
    mocks.staffFindUnique.mockResolvedValue({ shopId: 'shop-1' });
    mocks.shopFindUnique.mockResolvedValue({
      id: 'shop-1',
      ownerId: 'owner-1',
      status: ShopStatus.APPROVED,
    });
    mocks.orderFindFirst
      .mockResolvedValueOnce({ id: 'order-1', shopId: 'shop-1', status: OrderStatus.PENDING })
      .mockResolvedValueOnce({ id: 'order-1', shopId: 'shop-1', status: OrderStatus.ACCEPTED });
    mocks.orderUpdate
      .mockResolvedValueOnce({ id: 'order-1', status: OrderStatus.ACCEPTED })
      .mockResolvedValueOnce({ id: 'order-1', status: OrderStatus.PREPARING });

    await expect(acceptOrder(staffUser, 'shop-1', 'order-1')).resolves.toMatchObject({
      status: OrderStatus.ACCEPTED,
    });
    await expect(startPreparation(staffUser, 'shop-1', 'order-1')).resolves.toMatchObject({
      status: OrderStatus.PREPARING,
    });
  });

  it('rejects shop actions from a wrong shop', async () => {
    mocks.staffFindUnique.mockResolvedValue({ shopId: 'shop-2' });

    await expect(acceptOrder(staffUser, 'shop-1', 'order-1')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('approves removal and recalculates the order total', async () => {
    mocks.changeFindUnique.mockResolvedValue({
      id: 'change-1',
      orderId: 'order-1',
      status: OrderChangeStatus.PENDING,
      order: { id: 'order-1', customerId: 'customer-1', status: OrderStatus.PREPARING },
      items: [
        {
          id: 'change-item-1',
          action: 'REMOVE',
          orderItemId: 'order-item-1',
        },
      ],
    });
    mocks.orderItemFindMany.mockResolvedValue([
      { id: 'order-item-2', unitPriceSnapshot: { toString: () => '3.00' }, quantity: 2 },
    ]);
    mocks.orderUpdate.mockResolvedValue({ id: 'order-1', status: OrderStatus.PREPARING });
    mocks.orderFindUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.PREPARING,
    });

    await expect(
      approveChangeRequest('customer-1', 'change-1', { responseNote: 'Approved' }),
    ).resolves.toMatchObject({ id: 'order-1', status: OrderStatus.PREPARING });

    expect(mocks.orderItemDeleteMany).toHaveBeenCalled();
    expect(mocks.orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { subtotal: '6.00', total: '6.00' },
      }),
    );
  });

  it('declines a change by cancelling the order, with no automatic timeout', async () => {
    mocks.changeFindUnique.mockResolvedValue({
      id: 'change-1',
      orderId: 'order-1',
      status: OrderChangeStatus.PENDING,
      order: { id: 'order-1', customerId: 'customer-1', status: OrderStatus.PREPARING },
      items: [],
    });
    mocks.orderUpdate.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.CANCELLED,
    });

    await expect(
      declineChangeRequest('customer-1', 'change-1', { responseNote: 'Decline' }),
    ).resolves.toMatchObject({ resolution: 'CANCELLED' });
  });

  it('does not allow a customer to resolve another customer change', async () => {
    mocks.changeFindUnique.mockResolvedValue({
      id: 'change-1',
      orderId: 'order-1',
      status: OrderChangeStatus.PENDING,
      order: { id: 'order-1', customerId: 'customer-2', status: OrderStatus.PREPARING },
      items: [],
    });

    await expect(approveChangeRequest('customer-1', 'change-1', {})).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('does not find a change for an unknown request', async () => {
    mocks.changeFindUnique.mockResolvedValue(null);

    await expect(approveChangeRequest('customer-1', 'missing', {})).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
