
import { prisma } from '../../db/prisma.js';

function gerarSlug(nome) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          products: { where: { active: true } },
        },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    productCount: c._count.products,
  }));
}

export async function getCategoryBySlug(slug) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function createCategory(data) {
  const name = data.name?.trim();
  const description = data.description?.trim() || null;

  if (!name || name.length < 2) {
    throw new Error('Informe um nome de categoria com pelo menos 2 caracteres.');
  }

  const baseSlug = gerarSlug(name);

  if (!baseSlug) {
    throw new Error('Não foi possível gerar um identificador para essa categoria.');
  }

  const existente = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: name } },
        { slug: baseSlug },
      ],
    },
  });

  if (existente) {
    throw new Error('Já existe uma categoria com esse nome ou identificador.');
  }

  return prisma.category.create({
    data: {
      name,
      slug: baseSlug,
      description,
    },
  });
}
