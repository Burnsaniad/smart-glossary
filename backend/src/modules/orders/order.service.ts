import {
  OrderChangeAction,
  OrderChangeStatus,
  OrderStatus,
  ShopStatus,
  UserRole,
} from '../../generated/prisma/index.js';
import { getPrisma } from '../../lib/db.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../lib/errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type {
  ChangeResponseInput,
  CreateChangeRequestInput,
  PlaceOrderInput,
  UpdateOrderItemsInput,
} from './order.schemas.js';

const orderInclude = {
  items: {
    include: { product: { select: { id: true, name: true, isAvailable: true } } },
  },
  shop: { select: { id: true, name: true, status: true } },
  changeRequests: {
    include: { items: true },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

function decimalToCents(value: string | number): number {
  const text = typeof value === 'string' ? value : value.toFixed(2);
  const [whole = '0', fraction = '0'] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

function centsToDecimal(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  return `${sign}${String(Math.floor(absolute / 100))}.${String(absolute % 100).padStart(2, '0')}`;
}

async function requireShopAccess(user: AuthenticatedUser, shopId: string) {
  const prisma = getPrisma();
  if (user.role === UserRole.SHOP_OWNER) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, ownerId: true, status: true },
    });
    if (shop?.ownerId !== user.id) {
      throw new ForbiddenError('You do not have owner access to this shop');
    }
    return shop;
  }
  if (user.role === UserRole.SHOP_STAFF) {
    const membership = await prisma.shopStaff.findUnique({
      where: { userId: user.id },
      select: { shopId: true },
    });
    if (membership?.shopId !== shopId) {
      throw new ForbiddenError('You do not have staff access to this shop');
    }
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, ownerId: true, status: true },
    });
    if (!shop) throw new NotFoundError('Shop not found');
    return shop;
  }
  throw new ForbiddenError('Shop role required');
}

function mergeQuantities(items: { productId: string; quantity: number }[]) {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

export async function placeOrder(customerId: string, input: PlaceOrderInput) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const shop = await tx.shop.findFirst({
      where: { id: input.shopId, status: ShopStatus.APPROVED },
    });
    if (!shop) throw new NotFoundError('Approved shop not found');

    let requestedItems = input.items ? [...input.items] : [];

    if (input.sourceGroceryListId) {
      const sourceList = await tx.groceryList.findFirst({
        where: { id: input.sourceGroceryListId, customerId, shopId: input.shopId },
        include: { items: { select: { productId: true, quantity: true } } },
      });
      if (!sourceList) {
        throw new NotFoundError('Shop-specific grocery list not found');
      }
      if (sourceList.items.length === 0) {
        throw new UnprocessableEntityError('Grocery list has no items');
      }
      requestedItems = mergeQuantities([...requestedItems, ...sourceList.items]);
    } else {
      requestedItems = mergeQuantities(requestedItems);
    }

    if (requestedItems.length === 0) {
      throw new UnprocessableEntityError('At least one order item is required');
    }

    const products = await tx.product.findMany({
      where: {
        id: { in: requestedItems.map((item) => item.productId) },
        shopId: input.shopId,
        isAvailable: true,
      },
    });
    if (products.length !== requestedItems.length) {
      throw new UnprocessableEntityError('Every product must belong to the shop and be available');
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    let totalCents = 0;
    const orderItems = requestedItems.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) throw new UnprocessableEntityError('Product not found');
      const unitPriceCents = decimalToCents(product.price.toString());
      totalCents += unitPriceCents * item.quantity;
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: centsToDecimal(unitPriceCents),
        quantity: item.quantity,
        lineTotal: centsToDecimal(unitPriceCents * item.quantity),
      };
    });

    const total = centsToDecimal(totalCents);
    const order = await tx.customerOrder.create({
      data: {
        customerId,
        shopId: input.shopId,
        ...(input.sourceGroceryListId !== undefined && {
          sourceGroceryListId: input.sourceGroceryListId,
        }),
        ...(input.sourceListChoice !== undefined && {
          sourceListChoice: input.sourceListChoice,
        }),
        status: OrderStatus.PENDING,
        subtotal: total,
        total,
        items: { create: orderItems },
      },
      include: orderInclude,
    });

    if (input.sourceGroceryListId && input.sourceListChoice === 'CLEAR') {
      await tx.groceryListItem.deleteMany({
        where: { groceryListId: input.sourceGroceryListId },
      });
    }

    return order;
  });
}

export async function listCustomerOrders(customerId: string) {
  return getPrisma().customerOrder.findMany({
    where: { customerId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCustomerOrder(customerId: string, orderId: string) {
  const order = await getPrisma().customerOrder.findFirst({
    where: { id: orderId, customerId },
    include: orderInclude,
  });
  if (!order) throw new NotFoundError('Order not found');
  return order;
}

export async function updateOrderItems(
  customerId: string,
  orderId: string,
  input: UpdateOrderItemsInput,
) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const order = await tx.customerOrder.findFirst({
      where: { id: orderId, customerId },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ACCEPTED) {
      throw new ConflictError('The order cannot be modified after preparation starts');
    }

    const products = await tx.product.findMany({
      where: {
        id: { in: input.items.map((item) => item.productId) },
        shopId: order.shopId,
        isAvailable: true,
      },
    });
    if (products.length !== input.items.length) {
      throw new UnprocessableEntityError(
        'Every product must belong to the order shop and be available',
      );
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    let totalCents = 0;
    const replacementItems = input.items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) throw new UnprocessableEntityError('Product not found');
      const unitPriceCents = decimalToCents(product.price.toString());
      const lineTotalCents = unitPriceCents * item.quantity;
      totalCents += lineTotalCents;
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: centsToDecimal(unitPriceCents),
        quantity: item.quantity,
        lineTotal: centsToDecimal(lineTotalCents),
      };
    });

    const total = centsToDecimal(totalCents);
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.orderItem.createMany({ data: replacementItems.map((item) => ({ orderId, ...item })) });
    await tx.customerOrder.update({
      where: { id: orderId },
      data: { subtotal: total, total },
    });

    return tx.customerOrder.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
  });
}

export async function cancelOrder(customerId: string, orderId: string) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const order = await tx.customerOrder.findFirst({
      where: { id: orderId, customerId },
    });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ACCEPTED) {
      throw new ConflictError('The order cannot be cancelled after preparation starts');
    }
    return tx.customerOrder.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      include: orderInclude,
    });
  });
}

export async function listShopOrders(user: AuthenticatedUser, shopId: string) {
  await requireShopAccess(user, shopId);
  return getPrisma().customerOrder.findMany({
    where: { shopId },
    include: orderInclude,
    orderBy: { createdAt: 'asc' },
  });
}

export async function getShopOrder(user: AuthenticatedUser, shopId: string, orderId: string) {
  await requireShopAccess(user, shopId);
  const order = await getPrisma().customerOrder.findFirst({
    where: { id: orderId, shopId },
    include: orderInclude,
  });
  if (!order) throw new NotFoundError('Order not found in this shop');
  return order;
}

async function transitionShopOrder(
  user: AuthenticatedUser,
  shopId: string,
  orderId: string,
  expectedStatus: OrderStatus,
  update: {
    status: OrderStatus;
    acceptedAt?: Date;
    preparationStartedAt?: Date;
    readyAt?: Date;
  },
) {
  await requireShopAccess(user, shopId);
  const prisma = getPrisma();
  const order = await prisma.customerOrder.findFirst({
    where: { id: orderId, shopId },
  });
  if (!order) throw new NotFoundError('Order not found in this shop');
  if (order.status !== expectedStatus) {
    throw new ConflictError(`Expected order status ${expectedStatus}, found ${order.status}`);
  }
  return prisma.customerOrder.update({
    where: { id: orderId },
    data: update,
    include: orderInclude,
  });
}

export async function acceptOrder(user: AuthenticatedUser, shopId: string, orderId: string) {
  return transitionShopOrder(user, shopId, orderId, OrderStatus.PENDING, {
    status: OrderStatus.ACCEPTED,
    acceptedAt: new Date(),
  });
}

export async function rejectOrder(user: AuthenticatedUser, shopId: string, orderId: string) {
  return transitionShopOrder(user, shopId, orderId, OrderStatus.PENDING, {
    status: OrderStatus.REJECTED,
  });
}

export async function startPreparation(user: AuthenticatedUser, shopId: string, orderId: string) {
  return transitionShopOrder(user, shopId, orderId, OrderStatus.ACCEPTED, {
    status: OrderStatus.PREPARING,
    preparationStartedAt: new Date(),
  });
}

export async function markReady(user: AuthenticatedUser, shopId: string, orderId: string) {
  await requireShopAccess(user, shopId);
  const prisma = getPrisma();
  const order = await prisma.customerOrder.findFirst({
    where: { id: orderId, shopId },
  });
  if (!order) throw new NotFoundError('Order not found in this shop');
  if (order.status !== OrderStatus.PREPARING) {
    throw new ConflictError(`Cannot mark order ready from status ${order.status}`);
  }
  const pendingChange = await prisma.orderChangeRequest.findFirst({
    where: { orderId, status: OrderChangeStatus.PENDING },
  });
  if (pendingChange) {
    throw new ConflictError('The order has a pending customer change request');
  }
  return prisma.customerOrder.update({
    where: { id: orderId },
    data: { status: OrderStatus.READY_FOR_PICKUP, readyAt: new Date() },
    include: orderInclude,
  });
}

export async function createChangeRequest(
  user: AuthenticatedUser,
  shopId: string,
  orderId: string,
  input: CreateChangeRequestInput,
) {
  await requireShopAccess(user, shopId);
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const order = await tx.customerOrder.findFirst({
      where: { id: orderId, shopId, status: OrderStatus.PREPARING },
      include: { items: true },
    });
    if (!order) throw new ConflictError('Only preparing orders can receive change requests');

    const pending = await tx.orderChangeRequest.findFirst({
      where: { orderId, status: OrderChangeStatus.PENDING },
    });
    if (pending) throw new ConflictError('A change request is already awaiting customer response');

    const uniqueIds = new Set(input.orderItemIds);
    if (uniqueIds.size !== input.orderItemIds.length) {
      throw new UnprocessableEntityError('Duplicate order items are not allowed');
    }

    const affectedItems = order.items.filter((item) => uniqueIds.has(item.id));
    if (affectedItems.length !== uniqueIds.size) {
      throw new NotFoundError('One or more order items were not found');
    }

    return tx.orderChangeRequest.create({
      data: {
        orderId,
        requestedById: user.id,
        status: OrderChangeStatus.PENDING,
        ...(input.reason !== undefined && { reason: input.reason }),
        expiresAt: null,
        items: {
          create: affectedItems.map((item) => ({
            orderItemId: item.id,
            productId: item.productId,
            action: OrderChangeAction.REMOVE,
            currentQuantity: item.quantity,
            proposedQuantity: 0,
          })),
        },
      },
      include: { items: true },
    });
  });
}

async function requirePendingChange(customerId: string, changeId: string) {
  const prisma = getPrisma();
  const change = await prisma.orderChangeRequest.findUnique({
    where: { id: changeId },
    include: {
      order: true,
      items: true,
    },
  });
  if (!change) throw new NotFoundError('Change request not found');
  if (change.order.customerId !== customerId) {
    throw new ForbiddenError('This change request belongs to another customer');
  }
  if (change.status !== OrderChangeStatus.PENDING) {
    throw new ConflictError('This change request has already been resolved');
  }
  if (change.order.status !== OrderStatus.PREPARING) {
    throw new ConflictError('The order is no longer awaiting this change');
  }
  return change;
}

export async function approveChangeRequest(
  customerId: string,
  changeId: string,
  input: ChangeResponseInput,
) {
  const prisma = getPrisma();
  const change = await requirePendingChange(customerId, changeId);

  return prisma.$transaction(async (tx) => {
    const removalIds = change.items
      .filter((item) => item.action === OrderChangeAction.REMOVE)
      .map((item) => item.orderItemId)
      .filter((id): id is string => id !== null);

    await tx.orderItem.deleteMany({
      where: { id: { in: removalIds }, orderId: change.orderId },
    });

    const remainingItems = await tx.orderItem.findMany({
      where: { orderId: change.orderId },
    });
    const totalCents = remainingItems.reduce(
      (total, item) => total + decimalToCents(item.unitPriceSnapshot.toString()) * item.quantity,
      0,
    );
    const total = centsToDecimal(totalCents);

    await tx.customerOrder.update({
      where: { id: change.orderId },
      data: { subtotal: total, total },
    });
    await tx.orderChangeRequest.update({
      where: { id: changeId },
      data: {
        status: OrderChangeStatus.APPROVED,
        ...(input.responseNote !== undefined && { responseNote: input.responseNote }),
        respondedAt: new Date(),
      },
    });

    return tx.customerOrder.findUnique({
      where: { id: change.orderId },
      include: orderInclude,
    });
  });
}

export async function declineChangeRequest(
  customerId: string,
  changeId: string,
  input: ChangeResponseInput,
) {
  const prisma = getPrisma();
  const change = await requirePendingChange(customerId, changeId);

  return prisma.$transaction(async (tx) => {
    await tx.orderChangeRequest.update({
      where: { id: changeId },
      data: {
        status: OrderChangeStatus.REJECTED,
        ...(input.responseNote !== undefined && { responseNote: input.responseNote }),
        respondedAt: new Date(),
      },
    });
    const order = await tx.customerOrder.update({
      where: { id: change.orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      include: orderInclude,
    });
    return { order, resolution: 'CANCELLED' as const };
  });
}
