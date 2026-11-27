import { z } from 'zod';

export const createShopSchema = z.object({
  name: z.string().trim().min(2).max(150),
  address: z.string().trim().min(5).max(300),
  phone: z.string().trim().max(30).optional(),
});

export const updateShopSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    address: z.string().trim().min(5).max(300).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one shop field is required');

export const assignStaffSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
