import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { calculateShipping } from '../../utils/shipping.js';

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
};

/** Localiza (ou cria) o carrinho do usuario autenticado. */
async function getUserCart(userId) {
  const existing = await prisma.cart.findFirst({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

/** Localiza (ou cria) o carrinho do visitante via token. */
async function getGuestCart(token) {
  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token } });
    if (existing) return existing;
  }
  return prisma.cart.create({ data: { token: token || undefined } });
}

/** Resolve o carrinho de acordo com a sessao (logado > visitante). */
export async function resolveCart(req) {
  if (req.user) return getUserCart(req.user.id);
  const token = req.headers['x-cart-token'] || req.query.cartToken;
  return getGuestCart(typeof token === 'string' ? token : undefined);
}

export function serializeCart(cart, shippingMethod = 'STANDARD') {
  const items = cart.items.map((item) => {
    const product = item.product;
    const lineTotal = product.priceCents * item.quantity;
    return {
      id: item.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? null,
      category: product.category?.name ?? null,
      unitPriceCents: product.priceCents,
      compareAtCents: product.compareAtCents,
      quantity: item.quantity,
      stock: product.stock,
      lineTotalCents: lineTotal,
      active: product.active,
    };
  });

  const subtotalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
  const shippingCents = calculateShipping(subtotalCents, shippingMethod);
  const totalCents = subtotalCents + shippingCents;

  return {
    id: cart.id,
    token: cart.token,
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotalCents,
    shippingCents,
    discountCents: 0,
    totalCents,
    shippingMethod,
  };
}

export async function getCart(req) {
  const cart = await prisma.cart.findUnique({ where: { id: (await resolveCart(req)).id }, include: cartInclude });
  return serializeCart(cart);
}

export async function addItem(req, { productId, quantity }) {
  const cart = await resolveCart(req);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || !product.active) throw HttpError.notFound('Produto nao encontrado.');
  if (product.stock <= 0) throw HttpError.badRequest('Produto sem estoque no momento.');

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const desired = (existing?.quantity ?? 0) + quantity;
  if (desired > product.stock) {
    throw HttpError.badRequest(`Estoque insuficiente. Disponivel: ${product.stock}.`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity: desired },
  });

  const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
  return serializeCart(updated);
}

export async function updateItem(req, productId, quantity) {
  const cart = await resolveCart(req);
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
    include: { product: true },
  });
  if (!item) throw HttpError.notFound('Item nao encontrado no carrinho.');

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    if (quantity > item.product.stock) {
      throw HttpError.badRequest(`Estoque insuficiente. Disponivel: ${item.product.stock}.`);
    }
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }

  const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
  return serializeCart(updated);
}

export async function removeItem(req, productId) {
  const cart = await resolveCart(req);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
  return serializeCart(updated);
}

export async function clearCart(req) {
  const cart = await resolveCart(req);

  // Remove todos os produtos do carrinho atual.
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  // Busca novamente o carrinho, incluindo a lista atualizada de itens.
  const updated = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });

  if (!updated) {
    throw HttpError.notFound('Carrinho nao encontrado.');
  }

  return serializeCart(updated);
}

/** Mescla o carrinho de visitante no carrinho do cliente apos o login. */
export async function mergeGuestCart(userId, guestToken) {
  if (!guestToken) return null;

  const guestCart = await prisma.cart.findUnique({ where: { token: guestToken } });
  if (!guestCart) return null;

  const userCart = await getUserCart(userId);

  const guestItems = await prisma.cartItem.findMany({ where: { cartId: guestCart.id } });
  for (const guestItem of guestItems) {
    const product = await prisma.product.findUnique({ where: { id: guestItem.productId } });
    if (!product || !product.active) continue;

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: userCart.id, productId: guestItem.productId } },
    });

    const desired = (existing?.quantity ?? 0) + guestItem.quantity;
    const quantity = Math.min(desired, product.stock);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: userCart.id, productId: guestItem.productId } },
      create: { cartId: userCart.id, productId: guestItem.productId, quantity },
      update: { quantity },
    });
  }

  await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
  await prisma.cart.delete({ where: { id: guestCart.id } }).catch(() => {});

  const merged = await prisma.cart.findUnique({ where: { id: userCart.id }, include: cartInclude });
  return serializeCart(merged);
}
