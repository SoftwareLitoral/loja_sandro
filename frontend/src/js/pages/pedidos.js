import { api } from '../api.js';
import { store } from '../store.js';
import { mountLayout } from '../layout.js';
import { toast, emptyState } from '../ui.js';
import { formatBRL, formatDate, STATUS_LABELS, PAYMENT_LABELS } from '../format.js';

const container = document.getElementById('orders');
const pagination = document.getElementById('pagination');
const statusFilter = document.getElementById('status-filter');

if (!store.isLoggedIn()) {
  window.location.href = '/src/pages/login.html?returnTo=%2Fsrc%2Fpages%2Fpedidos.html';
}

function orderTemplate(order) {
  const status = STATUS_LABELS[order.status] ?? { label: order.status, className: 'bg-stone-200 text-stone-600' };
  const preview = order.items.slice(0, 3);

  return `
    <a href="/src/pages/pedido.html?id=${order.id}" class="card block p-5 transition hover:border-brand-300 hover:shadow-md">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="font-semibold text-stone-900">Pedido ${order.orderNumber}</p>
          <p class="text-xs text-stone-500">${formatDate(order.createdAt)} • ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="badge ${status.className}">${status.label}</span>
          <span class="font-bold text-stone-900">${formatBRL(order.totalCents)}</span>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-2">
        ${preview
          .map((item) => `<img src="${item.image ?? ''}" alt="${item.name}" class="h-12 w-12 rounded-lg object-cover" />`)
          .join('')}
        <span class="text-sm text-stone-500">
          ${order.items.length} item(ns) • ${order.address.city}/${order.address.state}
        </span>
      </div>
    </a>
  `;
}

async function loadOrders(page = 1) {
  container.innerHTML = '<p class="text-sm text-stone-500">Carregando...</p>';
  try {
    const status = statusFilter.value;
    const query = new URLSearchParams({ page: String(page), limit: '10' });
    if (status) query.set('status', status);

    const response = await api.get(`/orders?${query}`);
    const { data, pagination: pageInfo } = response;

    container.innerHTML = data.length
      ? data.map(orderTemplate).join('')
      : emptyState(
          'Voce ainda nao tem pedidos',
          'Quando voce finalizar uma compra, ela aparecera aqui.',
          '<a href="/src/pages/produtos.html" class="btn-primary mt-2">Comecar a comprar</a>',
        );

    renderPagination(pageInfo);
  } catch (error) {
    toast(error.message, 'error');
  }
}

function renderPagination(page) {
  if (page.totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const button = (label, pageNumber, disabled = false, active = false) => `
    <button data-page="${pageNumber}" ${disabled ? 'disabled' : ''}
      class="btn-outline !px-3 !py-2 ${active ? '!border-brand-600 !bg-brand-600 !text-white' : ''}">${label}</button>`;

  let html = button('←', page.page - 1, !page.hasPrev);
  for (let i = 1; i <= page.totalPages; i += 1) html += button(i, i, false, i === page.page);
  html += button('→', page.page + 1, !page.hasNext);
  pagination.innerHTML = html;

  pagination.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => loadOrders(Number(btn.dataset.page)));
  });
}

statusFilter.addEventListener('change', () => loadOrders(1));

mountLayout({ activePath: '/src/pages/pedidos.html' });
loadOrders(1);
