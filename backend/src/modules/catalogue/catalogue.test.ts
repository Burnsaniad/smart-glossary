import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShopStatus, UserRole } from '../../generated/prisma/index.js';
import { ForbiddenError, NotFoundError, UnprocessableEntityError } from '../../lib/errors.js';
import {
  createCategory,
  createProduct,
  getPublicProduct,
  updateProduct,
} from './catalogue.service.js';

const mocks = vi.hoisted(() => ({
  shopFindFirst: vi.fn(),
  categoryFindFirst: vi.fn(),
  categoryCreate: vi.fn(),
  categoryFindMany: vi.fn(),
  productFindFirst: vi.fn(),
  productFindMany: vi.fn(),
  productCreate: vi.fn(),
  productUpdate: vi.fn(),
}));

vi.mock('../../lib/db.js', () => ({
  getPrisma: () => ({
    shop: { findFirst: mocks.shopFindFirst },
    category: {
      findFirst: mocks.categoryFindFirst,
      findMany: mocks.categoryFindMany,
      create: mocks.categoryCreate,
    },
    product: {
      findFirst: mocks.productFindFirst,
      findMany: mocks.productFindMany,
      create: mocks.productCreate,
      update: mocks.productUpdate,
    },
  }),
}));

describe('catalogue management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a category for a shop', async () => {
    mocks.categoryCreate.mockResolvedValue({
      id: 'category-1',
      shopId: 'shop-1',
      name: 'Fruit',
    });

    await expect(
      createCategory('shop-1', { name: 'Fruit', description: 'Fresh fruit' }),
    ).resolves.toMatchObject({ id: 'category-1' });
  });

  it('rejects a product category from another shop', async () => {
    mocks.categoryFindFirst.mockResolvedValue(null);

    await expect(
      createProduct('shop-1', {
        categoryId: 'category-2',
        name: 'Apple',
        price: '2.50',
        unit: 'kg',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('creates a product in a matching category', async () => {
    mocks.categoryFindFirst.mockResolvedValue({ id: 'category-1', shopId: 'shop-1' });
    mocks.productCreate.mockResolvedValue({
      id: 'product-1',
      shopId: 'shop-1',
      categoryId: 'category-1',
      name: 'Apple',
      price: '2.50',
      unit: 'kg',
    });

    await expect(
      createProduct('shop-1', {
        categoryId: 'category-1',
        name: 'Apple',
        price: '2.50',
        unit: 'kg',
      }),
    ).resolves.toMatchObject({ name: 'Apple' });
  });

  it('allows only owners to change price or availability', async () => {
    await expect(
      updateProduct('shop-1', 'product-1', UserRole.SHOP_STAFF, { price: '3.00' }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      updateProduct('shop-1', 'product-1', UserRole.SHOP_STAFF, { isAvailable: false }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows an owner to update price and availability', async () => {
    mocks.productFindFirst.mockResolvedValue({
      id: 'product-1',
      shopId: 'shop-1',
      name: 'Apple',
    });
    mocks.productUpdate.mockResolvedValue({
      id: 'product-1',
      price: '3.00',
      isAvailable: false,
    });

    await expect(
      updateProduct('shop-1', 'product-1', UserRole.SHOP_OWNER, {
        price: '3.00',
        isAvailable: false,
      }),
    ).resolves.toMatchObject({ price: '3.00', isAvailable: false });
  });

  it('exposes only available products from approved shops', async () => {
    mocks.shopFindFirst.mockResolvedValue({
      id: 'shop-1',
      status: ShopStatus.APPROVED,
    });
    mocks.productFindFirst.mockResolvedValue({
      id: 'product-1',
      shopId: 'shop-1',
      isAvailable: true,
    });

    await expect(getPublicProduct('shop-1', 'product-1')).resolves.toMatchObject({
      id: 'product-1',
    });
  });

  it('rejects public products for unknown or unapproved shops', async () => {
    mocks.shopFindFirst.mockResolvedValue(null);

    await expect(getPublicProduct('shop-1', 'product-1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
