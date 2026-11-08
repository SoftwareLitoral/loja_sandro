import { z } from 'zod';

export const addressSchema = z.object({
  recipient: z.string().trim().min(3, 'Nome do destinatario e obrigatorio.'),
  street: z.string().trim().min(3, 'Rua e obrigatoria.'),
  number: z.string().trim().min(1, 'Numero e obrigatorio.'),
  complement: z.string().trim().optional().or(z.literal('')),
  district: z.string().trim().min(2, 'Bairro e obrigatorio.'),
  city: z.string().trim().min(2, 'Cidade e obrigatoria.'),
  state: z.string().trim().length(2, 'UF deve ter 2 letras.').toUpperCase(),
  zipCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP invalido.'),
});

export const createOrderSchema = z.object({
  addressId: z.string().optional(),
  address: addressSchema.optional(),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'BOLETO', 'CASH_ON_DELIVERY']),
  shippingMethod: z.enum(['STANDARD', 'EXPRESS', 'PICKUP']).default('STANDARD'),
  notes: z.string().trim().max(500).optional(),
}).refine((data) => data.addressId || data.address, {
  message: 'Informe o endereco de entrega.',
  path: ['addressId'],
});

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum([
      'PENDING_PAYMENT',
      'PAID',
      'CONFIRMED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ])
    .optional(),
});
