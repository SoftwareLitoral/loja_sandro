import { z } from 'zod';

export const listProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z
    .enum(['relevance', 'price_asc', 'price_desc', 'newest', 'name_asc', 'name_desc'])
    .default('relevance'),
});

export const productIdSchema = z.object({
  id: z.string().min(1, 'Informe o id do produto.'),
});


const productFields = {
  name: z.string().trim().min(2, 'Informe o nome do produto.').max(150),
  description: z.string().trim().min(5, 'Informe a descrição do produto.'),
  shortDescription: z.string().trim().max(255).optional().or(z.literal('')),
  price: z.coerce.number().finite().positive('O preço deve ser maior que zero.'),
  compareAtPrice: z.coerce.number().finite().positive().optional().nullable(),
  stock: z.coerce.number().int().min(0, 'O estoque não pode ser negativo.'),
  categoryId: z.string().trim().min(1, 'Selecione uma categoria.'),
  imageUrl: z.union([
    z.string().trim().url('Informe uma URL de imagem válida.'),
    z.literal(''),
  ]).optional(),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
};

export const createProductSchema = z.object(productFields);

export const updateProductSchema = z.object({
  name: productFields.name.optional(),
  description: productFields.description.optional(),
  shortDescription: productFields.shortDescription,
  price: productFields.price.optional(),
  compareAtPrice: productFields.compareAtPrice,
  stock: productFields.stock.optional(),
  categoryId: productFields.categoryId.optional(),
  imageUrl: productFields.imageUrl,
  featured: productFields.featured,
  active: productFields.active,
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Informe pelo menos um campo para atualizar.',
});
