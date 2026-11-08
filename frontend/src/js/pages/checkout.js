import { api } from '../api.js';
import { store } from '../store.js';
import { mountLayout, refreshCartBadge } from '../layout.js';
import { toast } from '../ui.js';
import { formatBRL, onlyDigits, formatCep, SHIPPING_LABELS, PAYMENT_LABELS } from '../format.js';

const state = {
  addresses: [],
  selectedAddressId: null,
  newAddress: null,
  shippingMethod: 'STANDARD',
  shippingOptions: [],
  paymentMethod: 'PIX',
  cart: null,
};

const addressList = document.getElementById('address-list');
const shippingBox = document.getElementById('shipping-options');
const paymentBox = document.getElementById('payment-options');
const summary = document.getElementById('order-summary');
const newAddressForm = document.getElementById('new-address');

function requireLogin() {
  if (!store.isLoggedIn()) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/src/pages/login.html?returnTo=${returnTo}`;
    return false;
  }
  return true;
}

/** Enriquece o carrinho com o frete da opcao escolhida. */
function shippingCost() {
  const subtotal = state.cart?.subtotalCents ?? 0;
  if (state.shippingMethod === 'PICKUP') return 0;
  if (subtotal >= 19900) return 0;
  const option = state.shippingOptions.find((o) => o.method === state.shippingMethod);
  return option?.priceCents ?? 0;
}

function renderAddresses() {
  if (!state.addresses.length) {
    addressList.innerHTML = '<p class="text-sm text-stone-500">Nenhum endereco salvo. Cadastre um abaixo.</p>';
    newAddressForm.classList.remove('hidden');
    return;
  }

  addressList.innerHTML = state.addresses
    .map(
      (address) => `
      <label class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        state.selectedAddressId === address.id
          ? 'border-brand-500 bg-brand-50/50'
          : 'border-stone-200 hover:border-stone-300'
      }">
        <input type="radio" name="address" value="${address.id}" class="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
               ${state.selectedAddressId === address.id ? 'checked' : ''} />
        <span class="text-sm">
          <span class="font-semibold text-stone-900">${address.recipient}</span>
          ${address.isDefault ? '<span class="badge ml-2 bg-stone-900 text-white">Padrao</span>' : ''}
          <span class="mt-1 block text-stone-500">
            ${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''} - ${address.district}<br />
            ${address.city}/${address.state} - CEP ${formatCep(address.zipCode)}
          </span>
        </span>
      </label>`,
    )
    .join('');

  addressList.querySelectorAll('input[name="address"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.selectedAddressId = radio.value;
      state.newAddress = null;
      renderAddresses();
      renderSummary();
    });
  });
}

function renderShipping() {
  shippingBox.innerHTML = state.shippingOptions
    .map(
      (option) => `
      <label class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition ${
        state.shippingMethod === option.method
          ? 'border-brand-500 bg-brand-50/50'
          : 'border-stone-200 hover:border-stone-300'
      }">
        <span class="flex items-center gap-3">
          <input type="radio" name="shipping" value="${option.method}" class="h-4 w-4 text-brand-600 focus:ring-brand-500"
                 ${state.shippingMethod === option.method ? 'checked' : ''} />
          <span class="text-sm">
            <span class="block font-semibold text-stone-900">${option.label}</span>
            <span class="text-stone-500">${option.description}</span>
          </span>
        </span>
        <span class="text-sm font-semibold text-stone-900">${option.priceCents === 0 ? 'Gratis' : formatBRL(option.priceCents)}</span>
      </label>`,
    )
    .join('');

  shippingBox.querySelectorAll('input[name="shipping"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.shippingMethod = radio.value;
      renderShipping();
      renderSummary();
    });
  });
}

function renderPayment() {
  const options = [
    { method: 'PIX', icon: '⚡', hint: 'Aprovacao imediata' },
    { method: 'CREDIT_CARD', icon: '💳', hint: 'Em ate 12x' },
    { method: 'BOLETO', icon: '🧾', hint: 'Vence em 3 dias' },
    { method: 'CASH_ON_DELIVERY', icon: '💵', hint: 'Somente para retirada' },
  ];

  paymentBox.innerHTML = options
    .map(
      (option) => `
      <label class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
        state.paymentMethod === option.method
          ? 'border-brand-500 bg-brand-50/50'
          : 'border-stone-200 hover:border-stone-300'
      }">
        <input type="radio" name="payment" value="${option.method}" class="h-4 w-4 text-brand-600 focus:ring-brand-500"
               ${state.paymentMethod === option.method ? 'checked' : ''} />
        <span class="text-2xl">${option.icon}</span>
        <span class="text-sm">
          <span class="block font-semibold text-stone-900">${PAYMENT_LABELS[option.method]}</span>
          <span class="text-stone-500">${option.hint}</span>
        </span>
      </label>`,
    )
    .join('');

  paymentBox.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.paymentMethod = radio.value;
      renderPayment();
    });
  });
}

function renderSummary() {
  const cart = state.cart;
  if (!cart) return;

  const shipping = shippingCost();
  const total = cart.subtotalCents + shipping;

  summary.innerHTML = `
    <h2 class="text-lg font-bold text-stone-900">Resumo</h2>

    <ul class="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
      ${cart.items
        .map(
          (item) => `
        <li class="flex items-center gap-3">
          <img src="${item.image ?? ''}" alt="${item.name}" class="h-12 w-12 rounded-lg object-cover" />
          <span class="flex-1 text-sm">
            <span class="block font-medium text-stone-900">${item.name}</span>
            <span class="text-stone-500">${item.quantity} x ${formatBRL(item.unitPriceCents)}</span>
          </span>
          <span class="text-sm font-semibold text-stone-900">${formatBRL(item.lineTotalCents)}</span>
        </li>`,
        )
        .join('')}
    </ul>

    <dl class="mt-5 space-y-3 border-t border-stone-200 pt-5 text-sm">
      <div class="flex justify-between"><dt class="text-stone-500">Subtotal</dt><dd class="font-medium">${formatBRL(cart.subtotalCents)}</dd></div>
      <div class="flex justify-between">
        <dt class="text-stone-500">${SHIPPING_LABELS[state.shippingMethod]}</dt>
        <dd class="font-medium">${shipping === 0 ? 'Gratis' : formatBRL(shipping)}</dd>
      </div>
      <div class="flex justify-between border-t border-stone-200 pt-3 text-base">
        <dt class="font-semibold text-stone-900">Total</dt>
        <dd class="font-bold text-stone-900">${formatBRL(total)}</dd>
      </div>
    </dl>

    <button id="place-order" class="btn-primary mt-6 w-full">Confirmar pedido</button>
    <a href="/src/pages/carrinho.html" class="btn-ghost mt-2 w-full">Voltar ao carrinho</a>
  `;

  document.getElementById('place-order').addEventListener('click', placeOrder);
}

async function loadAddresses() {
  const { data } = await api.get('/addresses');
  state.addresses = data;
  state.selectedAddressId = data.find((a) => a.isDefault)?.id ?? data[0]?.id ?? null;
  renderAddresses();
}

async function loadShippingOptions() {
  const { data } = await api.get('/shipping-options');
  state.shippingOptions = data;
  renderShipping();
}

async function placeOrder() {
  const button = document.getElementById('place-order');
  button.disabled = true;
  button.textContent = 'Processando...';

  try {
    const payload = {
      paymentMethod: state.paymentMethod,
      shippingMethod: state.shippingMethod,
      notes: document.getElementById('notes').value.trim() || undefined,
    };

    if (state.newAddress) {
      payload.address = state.newAddress;
    } else if (state.selectedAddressId) {
      payload.addressId = state.selectedAddressId;
    } else {
      throw new Error('Selecione ou cadastre um endereco de entrega.');
    }

    const order = await api.post('/orders', payload);
    await refreshCartBadge();
    toast('Pedido criado com sucesso!', 'success');
    window.location.href = `/src/pages/pedido.html?id=${order.id}`;
  } catch (error) {
    toast(error.message, 'error');
    button.disabled = false;
    button.textContent = 'Confirmar pedido';
  }
}

// CEP: preenche cidade/estado via API publica dos Correios
document.getElementById('zipCode')?.addEventListener('blur', async (event) => {
  const cep = onlyDigits(event.target.value);
  if (cep.length !== 8) return;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (data.erro) return;
    if (data.localidade) document.getElementById('city').value = data.localidade;
    if (data.uf) document.getElementById('state').value = data.uf;
    if (data.bairro) document.getElementById('district').value = data.bairro;
    if (data.logradouro) document.getElementById('street').value = data.logradouro;
  } catch {
    /* sem preenchimento automatico */
  }
});

document.getElementById('toggle-new-address')?.addEventListener('click', () => {
  newAddressForm.classList.toggle('hidden');
  state.selectedAddressId = null;
  renderAddresses();
});

newAddressForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(newAddressForm).entries());
  state.newAddress = {
    recipient: data.recipient.trim(),
    street: data.street.trim(),
    number: data.number.trim(),
    complement: data.complement?.trim() || '',
    district: data.district.trim(),
    city: data.city.trim(),
    state: data.state.trim().toUpperCase(),
    zipCode: onlyDigits(data.zipCode).replace(/^(\d{5})(\d{3})$/, '$1-$2'),
  };
  toast('Endereco sera usado neste pedido.', 'success');
  renderSummary();
});

async function init() {
  if (!requireLogin()) return;

  try {
    const [cart] = await Promise.all([api.get('/cart')]);
    if (!cart.items.length) {
      toast('Seu carrinho esta vazio.', 'info');
      window.location.href = '/src/pages/carrinho.html';
      return;
    }
    state.cart = cart;

    await Promise.all([loadAddresses(), loadShippingOptions()]);
    renderPayment();
    renderSummary();
  } catch (error) {
    toast(error.message, 'error');
  }
}

mountLayout();
init();
