import { formatBRL } from './format.js';

const toastRoot = () => document.getElementById('toast-root');

export function toast(message, type = 'info') {
  const root = toastRoot();
  if (!root) return;

  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-stone-200 bg-white text-stone-700',
  };
  const icons = { success: '✓', error: '!', info: 'i' };

  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg transition-all duration-300 translate-y-2 opacity-0 ${styles[type] ?? styles.info}`;
  el.innerHTML = `
    <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold">${icons[type] ?? 'i'}</span>
    <span class="flex-1">${message}</span>
  `;
  root.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    el.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/** Card de produto reutilizado nas listagens. */
export function productCard(product) {
  const discount =
    product.compareAtCents && product.compareAtCents > product.priceCents
      ? Math.round(((product.compareAtCents - product.priceCents) / product.compareAtCents) * 100)
      : 0;

  return `
    <a href="/src/pages/produto.html?id=${product.id}" class="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div class="relative aspect-4/3 overflow-hidden bg-stone-100">
        <img src="${product.mainImage ?? ''}" alt="${product.name}" loading="lazy"
             class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ${discount > 0 ? `<span class="badge absolute left-3 top-3 bg-brand-600 text-white">-${discount}%</span>` : ''}
        ${product.stock <= 0 ? '<span class="badge absolute right-3 top-3 bg-stone-800 text-white">Esgotado</span>' : ''}
      </div>
      <div class="p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-brand-600">${product.category?.name ?? ''}</p>
        <h3 class="mt-1 line-clamp-2 font-semibold text-stone-900">${product.name}</h3>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-lg font-bold text-stone-900">${formatBRL(product.priceCents)}</span>
          ${discount > 0 ? `<span class="text-sm text-stone-400 line-through">${formatBRL(product.compareAtCents)}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

export function skeletonGrid(count = 8) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="card overflow-hidden">
        <div class="aspect-4/3 animate-pulse bg-stone-200"></div>
        <div class="space-y-2 p-4">
          <div class="h-3 w-1/3 animate-pulse rounded bg-stone-200"></div>
          <div class="h-4 w-4/5 animate-pulse rounded bg-stone-200"></div>
          <div class="h-5 w-1/3 animate-pulse rounded bg-stone-200"></div>
        </div>
      </div>`,
    )
    .join('');
}

export function emptyState(title, description, action = '') {
  return `
    <div class="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div class="text-5xl">🛍️</div>
      <h3 class="text-lg font-semibold text-stone-900">${title}</h3>
      <p class="max-w-md text-sm text-stone-500">${description}</p>
      ${action}
    </div>
  `;
}

export function setLoading(container, loading) {
  if (!container) return;
  if (loading) {
    container.dataset.original = container.innerHTML;
    container.innerHTML = `<div class="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">${skeletonGrid(8)}</div>`;
  } else if (container.dataset.original) {
    container.innerHTML = container.dataset.original;
    delete container.dataset.original;
  }
}
