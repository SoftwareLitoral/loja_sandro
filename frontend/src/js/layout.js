import { store } from './store.js';
import { api } from './api.js';

const NAV = [
  { href: '/index.html', label: 'Inicio' },
  { href: '/src/pages/produtos.html', label: 'Produtos' },
  { href: '/src/pages/pedidos.html', label: 'Meus pedidos' },
];

function headerTemplate() {
  const user = store.getUser();
    const adminButton =
    user?.role === 'ADMIN'
      ? `<a href="/src/pages/admin-produtos.html"
           class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90">
           Cadastrar produtos
         </a>`
      : '';	
  const accountLink = user
    ? `<a href="/src/pages/conta.html" class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
         <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">${user.name.charAt(0).toUpperCase()}</span>
         <span class="hidden sm:inline">${user.name.split(' ')[0]}</span>
       </a>`
    : `<a href="/src/pages/login.html" class="btn-outline !px-4 !py-2">Entrar</a>`;

  return `
    <header class="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between gap-4">
        <a href="/index.html" class="flex items-center gap-2">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">S</span>
          <span class="font-display text-lg font-bold text-stone-900">Loja do <span class="text-brand-600">Sandro</span></span>
        </a>

        <nav class="hidden items-center gap-1 md:flex">
          ${NAV.map(
            (item) =>
              `<a href="${item.href}" class="rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">${item.label}</a>`,
          ).join('')}
        </nav>

        <div class="flex items-center gap-2">
          <form id="header-search" class="hidden lg:block">
            <input type="search" name="q" placeholder="Buscar produtos..."
                   class="input !w-56 !py-2" />
          </form>
          <a href="/src/pages/carrinho.html" class="relative flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100" aria-label="Carrinho">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <span id="cart-badge" class="absolute -right-1 -top-1 hidden min-w-5 rounded-full bg-brand-600 px-1.5 text-center text-[11px] font-bold leading-5 text-white">0</span>
          </a>
          ${adminButton}
           ${accountLink}
           ${user ? '<button id="logout-btn" class="btn-ghost !px-3 !py-2 text-sm">Sair</button>' : ''}
        </div>
      </div>
    </header>
  `;
}

function footerTemplate() {
  return `
    <footer class="mt-20 border-t border-stone-200 bg-white">
      <div class="container-page grid gap-10 py-14 md:grid-cols-4">
        <div class="md:col-span-2">
          <div class="flex items-center gap-2">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">S</span>
            <span class="font-display text-lg font-bold text-stone-900">Loja do <span class="text-brand-600">Sandro</span></span>
          </div>
          <p class="mt-4 max-w-sm text-sm text-stone-500">
            Produtos selecionados com cuidado, do vestibaario as bonecas artesanais.
            Entrega para todo o Brasil e pagamento facilitado.
          </p>
        </div>
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wide text-stone-900">Loja</h4>
          <ul class="mt-4 space-y-2 text-sm text-stone-500">
            <li><a href="/src/pages/produtos.html" class="hover:text-brand-600">Todos os produtos</a></li>
            <li><a href="/src/pages/carrinho.html" class="hover:text-brand-600">Carrinho</a></li>
            <li><a href="/src/pages/pedidos.html" class="hover:text-brand-600">Meus pedidos</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wide text-stone-900">Atendimento</h4>
          <ul class="mt-4 space-y-2 text-sm text-stone-500">
            <li>seg a sex, 9h as 18h</li>
            <li>contato@lojadosandro.com</li>
            <li>(11) 90000-0000</li>
            <li>Frete gratis acima de R$ 199</li>
          </ul>
        </div>
      </div>
      <div class="border-t border-stone-200 py-5 text-center text-xs text-stone-400">
        &copy; ${new Date().getFullYear()} Loja do Sandro. Todos os direitos reservados.
      </div>
    </footer>
  `;
}

/** Injeta cabecalho/rodape nas paginas e ativa busca + logout. */
export async function mountLayout({ activePath = '' } = {}) {
  const header = document.getElementById('app-header');
  const footer = document.getElementById('app-footer');

  if (header) {
    header.innerHTML = headerTemplate();
    const nav = header.querySelector('nav');
    if (nav && activePath) {
      nav.querySelectorAll('a').forEach((link) => {
        if (link.getAttribute('href') === activePath) {
          link.classList.add('bg-stone-100', 'text-stone-900');
        }
      });
    }

    const searchForm = header.querySelector('#header-search');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const term = new FormData(searchForm).get('q')?.toString().trim();
      if (term) window.location.href = `/src/pages/produtos.html?search=${encodeURIComponent(term)}`;
    });

    header.querySelector('#logout-btn')?.addEventListener('click', () => {
      store.logout();
      window.location.href = '/index.html';
    });
  }

  if (footer) footer.innerHTML = footerTemplate();

  await refreshCartBadge();
}

/** Atualiza o contador do carrinho no cabecalho. */
export async function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  try {
    const cart = await api.get('/cart');
    if (cart.itemCount > 0) {
      badge.textContent = cart.itemCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch {
    badge.classList.add('hidden');
  }
}
