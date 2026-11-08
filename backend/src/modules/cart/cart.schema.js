import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().min(1, 'Informe o produto.'),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
});

export const mergeSchema = z.object({
  guestToken: z.string().min(8).optional(),
});
