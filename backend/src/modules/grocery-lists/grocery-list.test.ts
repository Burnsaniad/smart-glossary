import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError, UnprocessableEntityError } from '../../lib/errors.js';
import {
  calculateEstimate,
  createGroceryList,
  upsertGroceryListItem,
} from './grocery-list.service.js';

const mocks = vi.hoisted(() => ({
  shopFindFirst: vi.fn(),
  groceryListCreate: vi.fn(),
  groceryListFindFirst: vi.fn(),
  groceryListItemUpsert: vi.fn(),
  productFindFirst: vi.fn(),
}));

vi.mock('../../lib/db.js', () => ({
  getPrisma: () => ({
    shop: { findFirst: mocks.shopFindFirst },
    groceryList: {
      create: mocks.groceryListCreate,
      findFirst: mocks.groceryListFindFirst,
    },
    groceryListItem: { upsert: mocks.groceryListItemUpsert },
    product: { findFirst: mocks.productFindFirst },
  }),
}));

describe('grocery lists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates estimates with decimal-safe cents', () => {
    expect(
      calculateEstimate([
        { quantity: 2, product: { price: '1.25' } },
        { quantity: 3, product: { price: '4.50' } },
      ]),
    ).toBe('16.00');
  });

  it('creates a list only for an approved shop', async () => {
    mocks.shopFindFirst.mockResolvedValue({ id: 'shop-1', status: 'APPROVED' });
    mocks.groceryListCreate.mockResolvedValue({
      id: 'list-1',
      customerId: 'customer-1',
      shopId: 'shop-1',
      name: 'Weekly',
    });

    await expect(
      createGroceryList('customer-1', { shopId: 'shop-1', name: 'Weekly' }),
    ).resolves.toMatchObject({ shopId: 'shop-1' });
  });

  it('rejects list creation for an unknown or unapproved shop', async () => {
    mocks.shopFindFirst.mockResolvedValue(null);

    await expect(
      createGroceryList('customer-1', { shopId: 'shop-1', name: 'Weekly' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('adds only available products from the list shop', async () => {
    mocks.groceryListFindFirst.mockResolvedValue({
      id: 'list-1',
      customerId: 'customer-1',
      shopId: 'shop-1',
    });
    mocks.productFindFirst.mockResolvedValue(null);

    await expect(
      upsertGroceryListItem('customer-1', 'list-1', {
        productId: 'product-from-shop-2',
        quantity: 2,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });
});
