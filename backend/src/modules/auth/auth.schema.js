import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter ao menos 3 caracteres.').max(120),
  email: z.string().trim().toLowerCase().email('E-mail invalido.'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s()-]{8,20}$/, 'Telefone invalido.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  address: z
    .object({
      recipient: z.string().trim().min(3, 'Nome do destinatario e obrigatorio.'),
      street: z.string().trim().min(3, 'Rua e obrigatoria.'),
      number: z.string().trim().min(1, 'Numero e obrigatorio.'),
      complement: z.string().trim().optional().or(z.literal('')),
      district: z.string().trim().min(2, 'Bairro e obrigatorio.'),
      city: z.string().trim().min(2, 'Cidade e obrigatoria.'),
      state: z.string().trim().length(2, 'UF deve ter 2 letras.'),
      zipCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP invalido.'),
      label: z.string().trim().optional(),
      isDefault: z.boolean().optional(),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail invalido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter ao menos 3 caracteres.').optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s()-]{8,20}$/, 'Telefone invalido.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z.string().min(6, 'A nova senha deve ter ao menos 6 caracteres.'),
});
