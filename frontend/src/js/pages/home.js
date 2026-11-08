import { api } from '../api.js';
import { mountLayout } from '../layout.js';
import { productCard, setLoading, toast } from '../ui.js';

const CATEGORY_ICONS = {
  Camisetas: '👕',
  Moletons: '🧥',
  Bonecas: '🧸',
  Acessorios: '🧢',
};

async function loadCategories() {
  const container = document.getElementById('categories');
  try {
    const { data } = await api.get('/categories');
    container.innerHTML = data
      .map(
        (category) => `
        <a href="/src/pages/produtos.html?category=${category.slug}"
           class="group card flex flex-col items-center gap-2 p-6 text-center transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg">
          <span class="text-4xl transition group-hover:scale-110">${CATEGORY_ICONS[category.name] ?? '🛍️'}</span>
          <span class="font-semibold text-stone-900">${category.name}</span>
          <span class="text-xs text-stone-400">${category.productCount} produtos</span>
        </a>`,
      )
      .join('');
  } catch (error) {
    container.innerHTML = `<p class="text-sm text-red-500">${error.message}</p>`;
  }
}

async function loadFeatured() {
  const container = document.getElementById('featured');
  setLoading(container, true);
  try {
    const { data } = await api.get('/products/featured?limit=8');
    container.innerHTML = data.map(productCard).join('');
  } catch (error) {
    container.innerHTML = `<p class="text-sm text-red-500">${error.message}</p>`;
    toast(error.message, 'error');
  } finally {
    setLoading(container, false);
  }
}

mountLayout({ activePath: '/index.html' });
loadCategories();
loadFeatured();
