import { z } from 'zod';

export const createGroceryListSchema = z.object({
  shopId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
});

export const updateGroceryListSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const upsertGroceryListItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().positive().max(100000),
});

export const updateGroceryListItemSchema = z.object({
  quantity: z.number().int().positive().max(100000),
});

export type CreateGroceryListInput = z.infer<typeof createGroceryListSchema>;
export type UpdateGroceryListInput = z.infer<typeof updateGroceryListSchema>;
export type UpsertGroceryListItemInput = z.infer<typeof upsertGroceryListItemSchema>;
export type UpdateGroceryListItemInput = z.infer<typeof updateGroceryListItemSchema>;
