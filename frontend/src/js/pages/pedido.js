import { api } from '../api.js';
import { store } from '../store.js';
import { mountLayout } from '../layout.js';
import { toast } from '../ui.js';
import { formatBRL, formatDateTime, formatCep, STATUS_LABELS, PAYMENT_LABELS, SHIPPING_LABELS } from '../format.js';

const container = document.getElementById('order');
const orderId = new URLSearchParams(window.location.search).get('id');

if (!store.isLoggedIn()) {
  window.location.href = `/src/pages/login.html?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

function timeline(status) {
  const steps = [
    { key: 'PENDING_PAYMENT', label: 'Pedido criado' },
    { key: 'PAID', label: 'Pagamento aprovado' },
    { key: 'CONFIRMED', label: 'Pedido confirmado' },
    { key: 'SHIPPED', label: 'Enviado' },
    { key: 'DELIVERED', label: 'Entregue' },
  ];
  const order = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const currentIndex = order.indexOf(status);
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return `<div class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Pedido cancelado.</div>`;
  }

  return `
    <ol class="mt-5 grid gap-3 sm:grid-cols-5">
      ${steps
        .map((step, index) => {
          const done = index <= currentIndex;
          return `
          <li class="rounded-xl border p-3 ${done ? 'border-brand-200 bg-brand-50' : 'border-stone-200 bg-white'}">
            <span class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-brand-600 text-white' : 'bg-stone-200 text-stone-500'}">
              ${index + 1}
            </span>
            <p class="mt-2 text-xs font-medium ${done ? 'text-brand-800' : 'text-stone-400'}">${step.label}</p>
          </li>`;
        })
        .join('')}
    </ol>
  `;
}

function orderTemplate(order) {
  const status = STATUS_LABELS[order.status] ?? { label: order.status, className: 'bg-stone-200 text-stone-600' };
  const canPay = order.paymentStatus !== 'PAID' && !['CANCELLED', 'REFUNDED', 'DELIVERED'].includes(order.status);
  const canCancel = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(order.status);

  return `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-stone-900">Pedido ${order.orderNumber}</h1>
        <p class="text-sm text-stone-500">Realizado em ${formatDateTime(order.createdAt)}</p>
      </div>
      <span class="badge ${status.className}">${status.label}</span>
    </div>

    ${timeline(order.status)}

    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div class="space-y-6">
        <section class="card p-6">
          <h2 class="text-lg font-bold text-stone-900">Itens do pedido</h2>
          <ul class="mt-4 divide-y divide-stone-100">
            ${order.items
              .map(
                (item) => `
              <li class="flex items-center gap-4 py-3">
                <img src="${item.image ?? ''}" alt="${item.name}" class="h-16 w-16 rounded-xl object-cover" />
                <div class="flex-1">
                  <p class="font-medium text-stone-900">${item.name}</p>
                  <p class="text-sm text-stone-500">${item.quantity} x ${formatBRL(item.unitPriceCents)}</p>
                </div>
                <p class="font-semibold text-stone-900">${formatBRL(item.totalCents)}</p>
              </li>`,
              )
              .join('')}
          </ul>

          <dl class="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <div class="flex justify-between"><dt class="text-stone-500">Subtotal</dt><dd class="font-medium">${formatBRL(order.subtotalCents)}</dd></div>
            <div class="flex justify-between"><dt class="text-stone-500">${SHIPPING_LABELS[order.shippingMethod] ?? 'Frete'}</dt><dd class="font-medium">${order.shippingCents === 0 ? 'Gratis' : formatBRL(order.shippingCents)}</dd></div>
            <div class="flex justify-between border-t border-stone-200 pt-2 text-base">
              <dt class="font-semibold text-stone-900">Total</dt>
              <dd class="font-bold text-stone-900">${formatBRL(order.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <section class="card p-6">
          <h2 class="text-lg font-bold text-stone-900">Endereco de entrega</h2>
          <p class="mt-3 text-sm leading-relaxed text-stone-600">
            ${order.address.recipient}<br />
            ${order.address.street}, ${order.address.number}${order.address.complement ? ` - ${order.address.complement}` : ''}<br />
            ${order.address.district} - ${order.address.city}/${order.address.state}<br />
            CEP ${formatCep(order.address.zipCode)}
          </p>
          ${order.notes ? `<p class="mt-3 rounded-lg bg-stone-50 p-3 text-sm text-stone-600"><strong>Observacoes:</strong> ${order.notes}</p>` : ''}
        </section>
      </div>

      <aside class="space-y-4">
        <section class="card p-6">
          <h2 class="text-lg font-bold text-stone-900">Pagamento</h2>
          <p class="mt-3 text-sm text-stone-600">
            Forma: <strong>${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</strong><br />
            Situacao: <strong>${order.paymentStatus === 'PAID' ? 'Pago' : 'Aguardando pagamento'}</strong>
          </p>

          ${canPay ? '<button id="pay-order" class="btn-primary mt-5 w-full">Pagar agora (simulacao)</button>' : ''}
          ${canCancel ? '<button id="cancel-order" class="btn-danger mt-2 w-full">Cancelar pedido</button>' : ''}
        </section>

        <a href="/src/pages/produtos.html" class="btn-outline w-full">Continuar comprando</a>
      </aside>
    </div>
  `;
}

async function loadOrder() {
  if (!orderId) {
    container.innerHTML = '<p class="text-stone-500">Pedido nao encontrado.</p>';
    return;
  }

  try {
    const order = await api.get(`/orders/${orderId}`);
    container.innerHTML = orderTemplate(order);

    document.getElementById('pay-order')?.addEventListener('click', async () => {
      try {
        await api.post(`/orders/${order.id}/pay`);
        toast('Pagamento aprovado!', 'success');
        loadOrder();
      } catch (error) {
        toast(error.message, 'error');
      }
    });

    document.getElementById('cancel-order')?.addEventListener('click', async () => {
      if (!confirm('Deseja cancelar este pedido?')) return;
      try {
        await api.post(`/orders/${order.id}/cancel`);
        toast('Pedido cancelado.', 'info');
        loadOrder();
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  } catch (error) {
    container.innerHTML = `<p class="text-red-500">${error.message}</p>`;
  }
}

mountLayout({ activePath: '/src/pages/pedidos.html' });
loadOrder();
