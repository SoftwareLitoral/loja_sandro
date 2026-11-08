import { api } from '../api.js';
import { mountLayout, refreshCartBadge } from '../layout.js';
import { toast, emptyState } from '../ui.js';
import { formatBRL } from '../format.js';

const itemsContainer = document.getElementById('cart-items');
const summaryContainer = document.getElementById('cart-summary');
const content = document.getElementById('cart-content');

function itemTemplate(item) {
  return `
    <div class="card flex gap-4 p-4" data-product-id="${item.productId}">
      <a href="/src/pages/produto.html?id=${item.productId}" class="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        <img src="${item.image ?? ''}" alt="${item.name}" class="h-full w-full object-cover" />
      </a>

      <div class="flex flex-1 flex-col justify-between">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-stone-400">${item.category ?? ''}</p>
            <a href="/src/pages/produto.html?id=${item.productId}" class="font-semibold text-stone-900 hover:text-brand-600">${item.name}</a>
            <p class="mt-1 text-sm text-stone-500">${formatBRL(item.unitPriceCents)} cada</p>
          </div>
          <p class="font-bold text-stone-900">${formatBRL(item.lineTotalCents)}</p>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center rounded-lg border border-stone-300">
            <button class="qty-decrease px-3 py-1.5 text-stone-600 hover:bg-stone-100">-</button>
            <span class="qty-value w-10 text-center text-sm font-semibold">${item.quantity}</span>
            <button class="qty-increase px-3 py-1.5 text-stone-600 hover:bg-stone-100">+</button>
          </div>
          <button class="remove-item text-sm font-medium text-red-500 hover:text-red-700">Remover</button>
        </div>
      </div>
    </div>
  `;
}

function summaryTemplate(cart) {
  const freeShipping = cart.subtotalCents >= 19900;
  return `
    <h2 class="text-lg font-bold text-stone-900">Resumo do pedido</h2>

    <dl class="mt-5 space-y-3 text-sm">
      <div class="flex justify-between"><dt class="text-stone-500">Subtotal</dt><dd class="font-medium text-stone-900">${formatBRL(cart.subtotalCents)}</dd></div>
      <div class="flex justify-between"><dt class="text-stone-500">Frete estimado</dt><dd class="font-medium text-stone-900">${cart.shippingCents === 0 ? 'Gratis' : formatBRL(cart.shippingCents)}</dd></div>
      <div class="flex justify-between border-t border-stone-200 pt-3 text-base">
        <dt class="font-semibold text-stone-900">Total</dt>
        <dd class="font-bold text-stone-900">${formatBRL(cart.totalCents)}</dd>
      </div>
    </dl>

    ${freeShipping ? '' : `<p class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Faltam ${formatBRL(19900 - cart.subtotalCents)} para o frete gratis.</p>`}

    <a href="/src/pages/checkout.html" class="btn-primary mt-6 w-full">Finalizar compra</a>
    <a href="/src/pages/produtos.html" class="btn-ghost mt-2 w-full">Continuar comprando</a>
    <button id="clear-cart" class="btn-ghost mt-1 w-full text-sm text-red-500">Esvaziar carrinho</button>
  `;
}

async function loadCart() {
  try {
    const cart = await api.get('/cart');

    if (!cart.items.length) {
      content.classList.remove('lg:grid-cols-[1fr_360px]');
      content.innerHTML = '';
      itemsContainer.innerHTML = emptyState(
        'Seu carrinho esta vazio',
        'Que tal comecar por uma camiseta ou uma boneca artesanal?',
        '<a href="/src/pages/produtos.html" class="btn-primary mt-2">Ver produtos</a>',
      );
      summaryContainer.remove();
      return;
    }

    content.classList.add('lg:grid-cols-[1fr_360px]');
    itemsContainer.innerHTML = cart.items.map(itemTemplate).join('');
    summaryContainer.innerHTML = summaryTemplate(cart);
    bindEvents();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function bindEvents() {
  itemsContainer.querySelectorAll('[data-product-id]').forEach((row) => {
    const productId = row.dataset.productId;
    const valueEl = row.querySelector('.qty-value');
    const current = Number(valueEl.textContent);

    row.querySelector('.qty-increase')?.addEventListener('click', () => updateQty(productId, current + 1));
    row.querySelector('.qty-decrease')?.addEventListener('click', () => updateQty(productId, current - 1));
    row.querySelector('.remove-item')?.addEventListener('click', () => removeItem(productId));
  });

  document.getElementById('clear-cart')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;

    if (!confirm('Deseja realmente esvaziar o carrinho?')) return;

    button.disabled = true;
    button.textContent = 'Esvaziando...';

    try {
      await api.del('/cart');

      await refreshCartBadge();
      toast('Carrinho esvaziado com sucesso!', 'success');

      await loadCart();
    } catch (error) {
      toast(error.message || 'Não foi possível esvaziar o carrinho.', 'error');
      button.disabled = false;
      button.textContent = 'Esvaziar carrinho';
    }
  });

}

async function updateQty(productId, quantity) {
  try {
    if (quantity <= 0) {
      await api.del(`/cart/items/${productId}`);
    } else {
      await api.patch(`/cart/items/${productId}`, { quantity });
    }
    await loadCart();
    await refreshCartBadge();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function removeItem(productId) {
  try {
    await api.del(`/cart/items/${productId}`);
    toast('Item removido.', 'info');
    await loadCart();
    await refreshCartBadge();
  } catch (error) {
    toast(error.message, 'error');
  }
}

mountLayout({ activePath: '/src/pages/carrinho.html' });
loadCart();
