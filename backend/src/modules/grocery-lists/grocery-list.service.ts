import { ShopStatus } from '../../generated/prisma/index.js';
import { getPrisma } from '../../lib/db.js';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '../../lib/errors.js';
import type {
  CreateGroceryListInput,
  UpdateGroceryListInput,
  UpsertGroceryListItemInput,
  UpdateGroceryListItemInput,
} from './grocery-list.schemas.js';

function decimalToCents(value: string | number): number {
  const text = typeof value === 'string' ? value : value.toFixed(2);
  const [whole = '0', fraction = '0'] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

function centsToDecimal(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${String(Math.floor(absolute / 100))}.${fraction}`;
}

export function calculateEstimate(
  items: { quantity: number; product: { price: string | number } }[],
): string {
  const cents = items.reduce(
    (total, item) => total + decimalToCents(item.product.price) * item.quantity,
    0,
  );
  return centsToDecimal(cents);
}

async function requireApprovedShop(shopId: string) {
  const shop = await getPrisma().shop.findFirst({
    where: { id: shopId, status: ShopStatus.APPROVED },
  });
  if (!shop) throw new NotFoundError('Approved shop not found');
  return shop;
}

async function requireOwnedList(customerId: string, listId: string) {
  const list = await getPrisma().groceryList.findFirst({
    where: { id: listId, customerId },
  });
  if (!list) throw new NotFoundError('Grocery list not found');
  return list;
}

export async function createGroceryList(customerId: string, input: CreateGroceryListInput) {
  await requireApprovedShop(input.shopId);
  try {
    return await getPrisma().groceryList.create({
      data: { customerId, shopId: input.shopId, name: input.name },
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('A grocery list with this name already exists for the shop');
    }
    throw error;
  }
}

export async function listGroceryLists(customerId: string) {
  const lists = await getPrisma().groceryList.findMany({
    where: { customerId },
    include: {
      shop: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { id: true, name: true, price: true, unit: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return lists.map((list) => ({
    ...list,
    estimatedTotal: calculateEstimate(
      list.items.map((item) => ({
        quantity: item.quantity,
        product: { price: item.product.price.toString() },
      })),
    ),
  }));
}

export async function getGroceryList(customerId: string, listId: string) {
  await requireOwnedList(customerId, listId);
  const list = await getPrisma().groceryList.findUnique({
    where: { id: listId },
    include: {
      shop: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { id: true, name: true, price: true, unit: true } } },
        orderBy: { product: { name: 'asc' } },
      },
    },
  });
  if (!list) throw new NotFoundError('Grocery list not found');
  return {
    ...list,
    estimatedTotal: calculateEstimate(
      list.items.map((item) => ({
        quantity: item.quantity,
        product: { price: item.product.price.toString() },
      })),
    ),
  };
}

export async function updateGroceryList(
  customerId: string,
  listId: string,
  input: UpdateGroceryListInput,
) {
  const list = await requireOwnedList(customerId, listId);
  try {
    return await getPrisma().groceryList.update({
      where: { id: listId },
      data: { name: input.name },
      include: { shop: { select: { id: true, name: true } } },
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictError(
        `A grocery list with this name already exists for the shop ${list.shopId}`,
      );
    }
    throw error;
  }
}

export async function deleteGroceryList(customerId: string, listId: string) {
  await requireOwnedList(customerId, listId);
  await getPrisma().groceryList.delete({ where: { id: listId } });
}

export async function upsertGroceryListItem(
  customerId: string,
  listId: string,
  input: UpsertGroceryListItemInput,
) {
  const list = await requireOwnedList(customerId, listId);
  const product = await getPrisma().product.findFirst({
    where: { id: input.productId, shopId: list.shopId, isAvailable: true },
  });
  if (!product) {
    throw new UnprocessableEntityError('Product must belong to the list shop and be available');
  }
  return getPrisma().groceryListItem.upsert({
    where: {
      groceryListId_productId: { groceryListId: listId, productId: input.productId },
    },
    create: { groceryListId: listId, productId: input.productId, quantity: input.quantity },
    update: { quantity: input.quantity },
  });
}

export async function updateGroceryListItem(
  customerId: string,
  listId: string,
  itemId: string,
  input: UpdateGroceryListItemInput,
) {
  await requireOwnedList(customerId, listId);
  const item = await getPrisma().groceryListItem.findFirst({
    where: { id: itemId, groceryListId: listId },
  });
  if (!item) throw new NotFoundError('Grocery list item not found');
  return getPrisma().groceryListItem.update({
    where: { id: itemId },
    data: { quantity: input.quantity },
  });
}

export async function deleteGroceryListItem(customerId: string, listId: string, itemId: string) {
  await requireOwnedList(customerId, listId);
  const item = await getPrisma().groceryListItem.findFirst({
    where: { id: itemId, groceryListId: listId },
  });
  if (!item) throw new NotFoundError('Grocery list item not found');
  await getPrisma().groceryListItem.delete({ where: { id: itemId } });
}
