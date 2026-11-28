import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().positive().max(100000),
});

export const placeOrderSchema = z
  .object({
    shopId: z.string().trim().min(1),
    items: z.array(orderItemSchema).min(1).optional(),
    sourceGroceryListId: z.string().trim().min(1).optional(),
    sourceListChoice: z.enum(['KEEP', 'CLEAR']).optional(),
  })
  .refine(
    (value) =>
      value.sourceGroceryListId !== undefined ||
      (value.items !== undefined && value.items.length > 0),
    'Provide catalogue items or a source grocery list',
  )
  .refine(
    (value) =>
      value.sourceGroceryListId === undefined ||
      value.sourceListChoice === 'KEEP' ||
      value.sourceListChoice === 'CLEAR',
    'A source grocery-list keep-or-clear choice is required',
  )
  .refine(
    (value) =>
      value.items === undefined ||
      new Set(value.items.map((item) => item.productId)).size === value.items.length,
    'Duplicate products are not allowed',
  );

export const updateOrderItemsSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1)
    .refine(
      (items) => new Set(items.map((item) => item.productId)).size === items.length,
      'Duplicate products are not allowed',
    ),
});

export const changeRequestSchema = z.object({
  orderItemIds: z.array(z.string().trim().min(1)).min(1),
  reason: z.string().trim().min(1).max(500).optional(),
});

export const changeResponseSchema = z.object({
  responseNote: z.string().trim().max(500).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type UpdateOrderItemsInput = z.infer<typeof updateOrderItemsSchema>;
export type CreateChangeRequestInput = z.infer<typeof changeRequestSchema>;
export type ChangeResponseInput = z.infer<typeof changeResponseSchema>;
