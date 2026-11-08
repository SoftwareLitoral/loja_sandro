import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { calculateShipping } from '../../utils/shipping.js';

const orderInclude = {
  items: true,
  user: { select: { id: true, name: true, email: true } },
};

export const serializeOrder = (order) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  shippingMethod: order.shippingMethod,
  subtotalCents: order.subtotalCents,
  shippingCents: order.shippingCents,
  discountCents: order.discountCents,
  totalCents: order.totalCents,
  address: {
    recipient: order.recipient,
    street: order.street,
    number: order.number,
    complement: order.complement,
    district: order.district,
    city: order.city,
    state: order.state,
    zipCode: order.zipCode,
  },
  notes: order.notes,
  items: order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.productName,
    slug: item.productSlug,
    image: item.imageUrl,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
    totalCents: item.totalCents,
  })),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

/** Gera um numero de pedido legivel e unico. */
function generateOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LDS-${stamp}-${random}`;
}

async function resolveAddress(userId, { addressId, address }) {
  if (addressId) {
    const saved = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!saved) throw HttpError.notFound('Endereco nao encontrado.');
    return saved;
  }
  if (address) {
    return prisma.address.create({
      data: {
        ...address,
        userId,
        complement: address.complement || null,
        zipCode: address.zipCode.replace(/\D/g, '').length === 8
          ? address.zipCode.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2')
          : address.zipCode,
        label: 'Endereco do pedido',
      },
    });
  }
  throw HttpError.badRequest('Informe o endereco de entrega.');
}

export async function createOrder(userId, payload) {
  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: { include: { product: { include: { images: { take: 1, orderBy: { position: 'asc' } } } } } } },
  });

  if (!cart || cart.items.length === 0) {
    throw HttpError.badRequest('Seu carrinho esta vazio.');
  }

  const address = await resolveAddress(userId, payload);

  const items = cart.items.map((item) => ({
    productId: item.productId,
    productName: item.product.name,
    productSlug: item.product.slug,
    imageUrl: item.product.images[0]?.url ?? null,
    unitPriceCents: item.product.priceCents,
    quantity: item.quantity,
    totalCents: item.product.priceCents * item.quantity,
  }));

  const subtotalCents = items.reduce((sum, i) => sum + i.totalCents, 0);
  const shippingCents = calculateShipping(subtotalCents, payload.shippingMethod);
  const totalCents = subtotalCents + shippingCents;

  // Transacao: valida estoque, cria pedido, baixa estoque e limpa o carrinho.
  const order = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.active) {
        throw HttpError.badRequest(`O produto "${item.productName}" nao esta mais disponivel.`);
      }
      if (product.stock < item.quantity) {
        throw HttpError.badRequest(
          `Estoque insuficiente para "${item.productName}". Disponivel: ${product.stock}.`,
        );
      }
    }

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        paymentMethod: payload.paymentMethod,
        shippingMethod: payload.shippingMethod,
        subtotalCents,
        shippingCents,
        discountCents: 0,
        totalCents,
        recipient: address.recipient,
        street: address.street,
        number: address.number,
        complement: address.complement,
        district: address.district,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        notes: payload.notes ?? null,
        items: { create: items },
      },
      include: orderInclude,
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return serializeOrder(order);
}

export async function listOrders(userId, { page, limit, status }) {
  const where = { userId, ...(status ? { status } : {}) };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: orders.map(serializeOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getOrder(userId, id) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
  if (!order) throw HttpError.notFound('Pedido nao encontrado.');
  return serializeOrder(order);
}

/** Simula a confirmacao do pagamento (integracao com gateway fica fora do escopo). */
export async function payOrder(userId, id) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
  if (!order) throw HttpError.notFound('Pedido nao encontrado.');
  if (order.paymentStatus === 'PAID') throw HttpError.conflict('Este pedido ja esta pago.');
  if (order.status === 'CANCELLED') throw HttpError.badRequest('Pedido cancelado.');

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
    include: orderInclude,
  });

  return serializeOrder(updated);
}

/** Cancela o pedido e devolve o estoque. */
export async function cancelOrder(userId, id) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
  if (!order) throw HttpError.notFound('Pedido nao encontrado.');
  if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
    throw HttpError.badRequest('Este pedido nao pode mais ser cancelado.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    return tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : 'FAILED',
      },
      include: orderInclude,
    });
  });

  return serializeOrder(updated);
}
