import { z } from 'zod';

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  recipient: z.string().trim().min(3, 'Nome do destinatario e obrigatorio.'),
  street: z.string().trim().min(3, 'Rua e obrigatoria.'),
  number: z.string().trim().min(1, 'Numero e obrigatorio.'),
  complement: z.string().trim().max(120).optional().or(z.literal('')),
  district: z.string().trim().min(2, 'Bairro e obrigatorio.'),
  city: z.string().trim().min(2, 'Cidade e obrigatoria.'),
  state: z.string().trim().length(2, 'UF deve ter 2 letras.').toUpperCase(),
  zipCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP invalido.'),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressSchema.partial();
