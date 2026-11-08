import { api } from '../api.js';
import { mountLayout } from '../layout.js';
import { productCard, setLoading, toast, emptyState } from '../ui.js';

const form = document.getElementById('filters');
const container = document.getElementById('products');
const countLabel = document.getElementById('result-count');
const pagination = document.getElementById('pagination');
const activeFilters = document.getElementById('active-filters');

const params = new URLSearchParams(window.location.search);

function currentFilters() {
  const data = new FormData(form);
  const filters = {
    page: Number(params.get('page') ?? 1),
    limit: 12,
    sort: data.get('sort') || 'relevance',
  };
  const search = (data.get('search') || '').toString().trim();
  if (search) filters.search = search;
  const category = (data.get('category') || '').toString();
  if (category) filters.category = category;
  const minPrice = data.get('minPrice');
  const maxPrice = data.get('maxPrice');
  if (minPrice) filters.minPrice = minPrice;
  if (maxPrice) filters.maxPrice = maxPrice;
  if (data.get('featured')) filters.featured = 'true';
  return filters;
}

function describeFilters(filters) {
  const parts = [];
  if (filters.search) parts.push(`"${filters.search}"`);
  if (filters.category) parts.push(filters.category);
  if (filters.featured) parts.push('destaques');
  if (filters.minPrice || filters.maxPrice) {
    parts.push(`R$ ${filters.minPrice ?? 0} - R$ ${filters.maxPrice ?? '∞'}`);
  }
  return parts.length ? parts.join(' • ') : 'sem filtros';
}

async function loadProducts() {
  const filters = currentFilters();
  setLoading(container, true);
  pagination.innerHTML = '';
  activeFilters.textContent = describeFilters(filters);

  try {
    const query = new URLSearchParams(
      Object.entries(filters).map(([k, v]) => [k, String(v)]),
    ).toString();
    const response = await api.get(`/products?${query}`);

    const { data, pagination: page } = response;
    countLabel.textContent = `${page.total} produto(s) encontrado(s)`;

    container.innerHTML = data.length
      ? data.map(productCard).join('')
      : emptyState(
          'Nenhum produto encontrado',
          'Tente ajustar os filtros ou buscar por outro termo.',
          '<a href="/src/pages/produtos.html" class="btn-primary mt-2">Ver todos os produtos</a>',
        );

    renderPagination(page);
  } catch (error) {
    container.innerHTML = emptyState('Erro ao carregar produtos', error.message);
    toast(error.message, 'error');
  } finally {
    setLoading(container, false);
  }
}

function renderPagination(page) {
  if (page.totalPages <= 1) return;

  const button = (label, pageNumber, disabled = false, active = false) => `
    <button data-page="${pageNumber}" ${disabled ? 'disabled' : ''}
      class="btn-outline !px-3 !py-2 ${active ? '!border-brand-600 !bg-brand-600 !text-white' : ''}">${label}</button>`;

  let html = button('←', page.page - 1, !page.hasPrev);
  for (let i = 1; i <= page.totalPages; i += 1) {
    html += button(i, i, false, i === page.page);
  }
  html += button('→', page.page + 1, !page.hasNext);
  pagination.innerHTML = html;

  pagination.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      params.set('page', btn.dataset.page);
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
      loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function loadCategories() {
  try {
    const { data } = await api.get('/categories');
    const select = document.getElementById('category');
    data.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.slug;
      option.textContent = category.name;
      select.appendChild(option);
    });
    if (params.get('category')) select.value = params.get('category');
  } catch {
    /* silencioso */
  }
}

/** Preenche o formulario com os parametros da URL. */
function prefillFromUrl() {
  const search = params.get('search');
  if (search) form.elements.search.value = search;
  const category = params.get('category');
  if (category) form.elements.category.value = category;
  const sort = params.get('sort');
  if (sort) form.elements.sort.value = sort;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  params.set('page', '1');
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  loadProducts();
});

form.addEventListener('reset', () => {
  setTimeout(() => {
    params.delete('category');
    params.delete('search');
    params.set('page', '1');
    window.history.replaceState({}, '', window.location.pathname);
    loadProducts();
  }, 0);
});

mountLayout({ activePath: '/src/pages/produtos.html' });
prefillFromUrl();
loadCategories();
loadProducts();
