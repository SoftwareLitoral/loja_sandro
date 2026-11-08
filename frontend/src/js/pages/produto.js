import { api } from '../api.js';
import { mountLayout, refreshCartBadge } from '../layout.js';
import { productCard, toast, skeletonGrid } from '../ui.js';
import { formatBRL } from '../format.js';

const container = document.getElementById('product');
const related = document.getElementById('related');
const productId = new URLSearchParams(window.location.search).get('id');

function productTemplate(product) {
  const discount =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round(((product.compareAtCents - product.priceCents) / product.compareAtCents) * 100)
      : 0;
  const outOfStock = product.stock <= 0;

  return `
    <div class="grid gap-10 lg:grid-cols-2">
      <div class="overflow-hidden rounded-3xl border border-stone-200 bg-white">
        <img src="${product.mainImage ?? ''}" alt="${product.name}" class="aspect-square w-full object-cover" />
      </div>

      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-brand-600">${product.category?.name ?? ''}</p>
        <h1 class="mt-2 text-3xl font-bold text-stone-900">${product.name}</h1>

        <div class="mt-5 flex items-baseline gap-3">
          <span class="text-3xl font-black text-stone-900">${formatBRL(product.priceCents)}</span>
          ${discount > 0 ? `<span class="text-lg text-stone-400 line-through">${formatBRL(product.compareAtCents)}</span>` : ''}
          ${discount > 0 ? `<span class="badge bg-brand-100 text-brand-700">-${discount}%</span>` : ''}
        </div>

        <p class="mt-2 text-sm ${outOfStock ? 'text-red-500' : 'text-emerald-600'}">
          ${outOfStock ? 'Produto esgotado' : `${product.stock} unidade(s) em estoque`}
        </p>

        <p class="mt-6 leading-relaxed text-stone-600">${product.description}</p>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <div class="flex items-center rounded-xl border border-stone-300">
            <button id="minus" class="px-4 py-2.5 text-lg text-stone-600 hover:bg-stone-100">-</button>
            <input id="quantity" type="number" value="1" min="1" max="${Math.max(product.stock, 1)}"
                   class="w-14 border-0 bg-transparent text-center text-sm font-semibold focus:outline-none" />
            <button id="plus" class="px-4 py-2.5 text-lg text-stone-600 hover:bg-stone-100">+</button>
          </div>

          <button id="add-to-cart" class="btn-primary flex-1 sm:flex-none sm:px-10" ${outOfStock ? 'disabled' : ''}>
            ${outOfStock ? 'Indisponivel' : 'Adicionar ao carrinho'}
          </button>
          <button id="buy-now" class="btn-dark" ${outOfStock ? 'disabled' : ''}>Comprar agora</button>
        </div>

        <ul class="mt-8 space-y-2 border-t border-stone-200 pt-6 text-sm text-stone-600">
          <li class="flex items-center gap-2"><span>🚚</span> Frete gratis em compras acima de R$ 199</li>
          <li class="flex items-center gap-2"><span>↩️</span> Troca em ate 30 dias corridos</li>
          <li class="flex items-center gap-2"><span>🔒</span> Pagamento seguro via PIX, cartao ou boleto</li>
        </ul>
      </div>
    </div>
  `;
}

async function loadProduct() {
  if (!productId) {
    container.innerHTML = '<p class="text-stone-500">Produto nao encontrado.</p>';
    return;
  }

  container.innerHTML = `<div class="grid gap-10 lg:grid-cols-2">
    <div class="aspect-square animate-pulse rounded-3xl bg-stone-200"></div>
    <div class="space-y-4">
      <div class="h-4 w-1/4 animate-pulse rounded bg-stone-200"></div>
      <div class="h-9 w-3/4 animate-pulse rounded bg-stone-200"></div>
      <div class="h-8 w-1/3 animate-pulse rounded bg-stone-200"></div>
      <div class="h-24 w-full animate-pulse rounded bg-stone-200"></div>
    </div>
  </div>`;

  try {
    const product = await api.get(`/products/${productId}`);
    container.innerHTML = productTemplate(product);
    document.getElementById('breadcrumb').textContent = product.name;
    document.title = `${product.name} | Loja do Sandro`;

    const quantityInput = document.getElementById('quantity');
    const plus = document.getElementById('plus');
    const minus = document.getElementById('minus');

    plus.addEventListener('click', () => {
      quantityInput.value = Math.min(Number(quantityInput.value) + 1, product.stock);
    });
    minus.addEventListener('click', () => {
      quantityInput.value = Math.max(Number(quantityInput.value) - 1, 1);
    });

    const addToCart = async () => {
      const quantity = Number(quantityInput.value);
      try {
        await api.post('/cart/items', { productId: product.id, quantity });
        toast('Produto adicionado ao carrinho!', 'success');
        await refreshCartBadge();
      } catch (error) {
        toast(error.message, 'error');
      }
    };

    document.getElementById('add-to-cart').addEventListener('click', addToCart);

    document.getElementById('buy-now').addEventListener('click', () => {
      window.location.href = '/src/pages/carrinho.html';
    });


    loadRelated(product.categoryId, product.id);
  } catch (error) {
    container.innerHTML = `<p class="text-red-500">${error.message}</p>`;
  }
}

async function loadRelated(categoryId, excludeId) {
  related.innerHTML = skeletonGrid(4);
  try {
    const { data } = await api.get(`/products?category=${categoryId}&limit=4`);
    const filtered = data.filter((p) => p.id !== excludeId).slice(0, 4);
    related.innerHTML = filtered.length
      ? filtered.map(productCard).join('')
      : '<p class="text-sm text-stone-500">Nenhum produto relacionado.</p>';
  } catch {
    related.innerHTML = '';
  }
}

mountLayout({ activePath: '/src/pages/produtos.html' });
loadProduct();
