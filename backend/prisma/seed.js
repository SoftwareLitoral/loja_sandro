import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Camisetas',
    slug: 'camisetas',
    description: 'Camisetas de algodao com estampas exclusivas.',
    products: [
      {
        name: 'Camiseta Sandro Logo Preto',
        description:
          'Camiseta 100% algodao penteado, malha 30.1, modelagem unissex e estampa em silk screen. Lavagem a maquina.',
        priceCents: 7990,
        compareAtCents: 9990,
        stock: 25,
        featured: true,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
      },
      {
        name: 'Camiseta Oversized Areia',
        description:
          'Camiseta oversized com gola careca e caimento amplo. Produzida em malha pesada de alta durabilidade.',
        priceCents: 8990,
        compareAtCents: null,
        stock: 18,
        featured: false,
        images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800'],
      },
      {
        name: 'Camiseta listrada Manga Longa',
        description:
          'Camiseta listrada de manga longa em algodão com elastano. Confortavel para o dia a dia.',
        priceCents: 9490,
        compareAtCents: 11990,
        stock: 12,
        featured: true,
        images: ['https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800'],
      },
    ],
  },
  {
    name: 'Moletons',
    slug: 'moletons',
    description: 'Moletons e blusas de frio para o inverno.',
    products: [
      {
        name: 'Moletom Canguru Sandro',
        description:
          'Moletom com capuz, bolso canguru e interior flanelado. Punho e barra em ribana canelada.',
        priceCents: 18990,
        compareAtCents: 22990,
        stock: 15,
        featured: true,
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
      },
      {
        name: 'Moletom Zip Verde',
        description:
          'Moletom com zíper full, gola alta e dois bolsos frontais. Perfeito para o inverno paulistano.',
        priceCents: 20990,
        compareAtCents: null,
        stock: 9,
        featured: false,
        images: ['https://images.unsplash.com/photo-1614495039153-9ea5b4b6a1b1?w=800'],
      },
    ],
  },
  {
    name: 'Bonecas',
    slug: 'bonecas',
    description: 'Bonecas artesanais feitas a mao, com acabamento exclusivo.',
    products: [
      {
        name: 'Boneca Artesanal Sandy',
        description:
          'Boneca artesanal em tecido de algodao, com olhos pintados e cabelo em fio de lã. Cada peça e unica.',
        priceCents: 14990,
        compareAtCents: 17990,
        stock: 6,
        featured: true,
        images: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800'],
      },
      {
        name: 'Boneca Costureira',
        description:
          'Boneca em uma empresa com kit de costura. Ideal para_presentear quem ama artesanato.',
        priceCents: 13990,
        compareAtCents: null,
        stock: 4,
        featured: false,
        images: ['https://images.unsplash.com/photo-1615486364264-fd064a6a4a1f?w=800'],
      },
    ],
  },
  {
    name: 'Acessorios',
    slug: 'acessorios',
    description: 'Acessorios que completam o look.',
    products: [
      {
        name: 'Bone Snap Hat Preta',
        description:
          'Bone hat classica com fecho em metal e borda bordada. Ajustavel.',
        priceCents: 6490,
        compareAtCents: null,
        stock: 30,
        featured: true,
        images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'],
      },
      {
        name: 'Mochila Sandro Roll',
        description:
          'Mochila urbana em lona impermeavel com compartimento para notebook de 15 polegadas.',
        priceCents: 17990,
        compareAtCents: 21990,
        stock: 14,
        featured: false,
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
      },
      {
        name: 'Caneca Sandro & Cia',
        description: 'Caneca de ceramica 325ml com estampa exclusiva. Pode ir ao micro-ondas.',
        priceCents: 4490,
        compareAtCents: 5490,
        stock: 40,
        featured: false,
        images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800'],
      },
    ],
  },
];

async function main() {
  console.log('Populando o banco de dados...');

  // Usuario de teste
  const passwordHash = await bcrypt.hash('aluno', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'cliente@lojadosandro.com' },
    update: {},
    create: {
      name: 'Cliente Loja do Sandro',
      email: 'cliente@lojadosandro.com',
      phone: '(11) 98888-0000',
      passwordHash,
      addresses: {
        create: {
          label: 'Casa',
          recipient: 'Cliente Loja do Sandro',
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 42',
          district: 'Centro',
          city: 'Sao Paulo',
          state: 'SP',
          zipCode: '01001-000',
          isDefault: true,
        },
      },
    },
  });
  console.log(`Usuario de teste: cliente@lojadosandro.com / aluno (${customer.id})`);

  for (const category of categories) {
    const { products, ...categoryData } = category;
    const savedCategory = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: { name: categoryData.name, description: categoryData.description },
      create: categoryData,
    });

    for (const product of products) {
      const slug = product.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { images, ...productData } = product;
      await prisma.product.upsert({
        where: { slug },
        update: { ...productData, categoryId: savedCategory.id },
        create: {
          ...productData,
          slug,
          shortDescription: product.description.slice(0, 120),
          categoryId: savedCategory.id,
          images: {
            create: images.map((url, index) => ({
              url,
              alt: product.name,
              position: index,
            })),
          },
        },
      });
    }
  }

  console.log('Seed concluido.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
