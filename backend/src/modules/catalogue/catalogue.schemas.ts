import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullable().optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one category field is required');

const priceSchema = z
  .union([
    z.number().nonnegative(),
    z
      .string()
      .trim()
      .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'Invalid price'),
  ])
  .transform((value, ctx) => {
    if (typeof value === 'number') {
      const decimalPlaces = value.toString().split('.')[1]?.length ?? 0;
      if (decimalPlaces > 2) {
        ctx.addIssue({ code: 'custom', message: 'Price must have at most two decimal places' });
        return z.NEVER;
      }
    }
    const price = typeof value === 'number' ? value.toFixed(2) : value;
    const decimal = price.includes('.') ? price : `${price}.00`;
    const [whole, fraction = ''] = decimal.split('.');
    if (
      whole === undefined ||
      whole.length > 10 ||
      Number(`${whole}.${fraction.padEnd(2, '0')}`) < 0
    ) {
      ctx.addIssue({ code: 'custom', message: 'Price is out of range' });
      return z.NEVER;
    }
    return `${whole}.${fraction.padEnd(2, '0')}`;
  });

export const createProductSchema = z.object({
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).nullable().optional(),
  price: priceSchema,
  unit: z.string().trim().min(1).max(30),
  isAvailable: z.boolean().optional(),
});

export const updateProductSchema = z
  .object({
    categoryId: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    price: priceSchema.optional(),
    unit: z.string().trim().min(1).max(30).optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one product field is required');

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
