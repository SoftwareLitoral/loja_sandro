import { api } from '../api.js';
import { store } from '../store.js';
import { mountLayout } from '../layout.js';
import { toast } from '../ui.js';
import { formatCep } from '../format.js';

const profileForm = document.getElementById('profile-form');
const passwordForm = document.getElementById('password-form');
const addressForm = document.getElementById('address-form');
const addressList = document.getElementById('address-list');

if (!store.isLoggedIn()) {
  window.location.href = '/src/pages/login.html?returnTo=%2Fsrc%2Fpages%2Fconta.html';
}

function addressTemplate(address) {
  return `
    <div class="flex items-start justify-between gap-4 rounded-xl border border-stone-200 p-4" data-id="${address.id}">
      <div class="text-sm">
        <p class="font-semibold text-stone-900">
          ${address.recipient}
          ${address.isDefault ? '<span class="badge ml-2 bg-stone-900 text-white">Padrao</span>' : ''}
        </p>
        <p class="mt-1 text-stone-500">
          ${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}<br />
          ${address.district} - ${address.city}/${address.state} - CEP ${formatCep(address.zipCode)}
        </p>
      </div>
      <div class="flex shrink-0 gap-1">
        ${address.isDefault ? '' : '<button class="edit-address btn-ghost !px-2 !py-1 text-xs" data-action="default">Padrao</button>'}
        <button class="edit-address btn-ghost !px-2 !py-1 text-xs" data-action="edit">Editar</button>
        <button class="delete-address btn-ghost !px-2 !py-1 text-xs text-red-500" data-action="delete">Excluir</button>
      </div>
    </div>
  `;
}

async function loadProfile() {
  const user = await api.get('/auth/me');
  store.setUser(user);
  profileForm.elements.name.value = user.name ?? '';
  profileForm.elements.email.value = user.email ?? '';
  profileForm.elements.phone.value = user.phone ?? '';
}

async function loadAddresses() {
  const { data } = await api.get('/addresses');
  addressList.innerHTML = data.length
    ? data.map(addressTemplate).join('')
    : '<p class="text-sm text-stone-500">Nenhum endereco cadastrado.</p>';
  bindAddressEvents();
}

function bindAddressEvents() {
  addressList.querySelectorAll('[data-id]').forEach((row) => {
    const id = row.dataset.id;

    row.querySelector('[data-action="edit"]')?.addEventListener('click', () => openAddressForm(id));
    row.querySelector('[data-action="default"]')?.addEventListener('click', async () => {
      await api.post(`/addresses/${id}/default`);
      toast('Endereco padrao atualizado.', 'success');
      loadAddresses();
    });
    row.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!confirm('Excluir este endereco?')) return;
      try {
        await api.del(`/addresses/${id}`);
        toast('Endereco removido.', 'info');
        loadAddresses();
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  });
}

async function openAddressForm(id = null) {
  const form = document.getElementById('address-form');
  form.reset();
  document.getElementById('address-id').value = id ?? '';

  if (id) {
    const { data } = await api.get('/addresses');
    const address = data.find((a) => a.id === id);
    if (address) {
      form.elements.recipient.value = address.recipient;
      form.elements.street.value = address.street;
      form.elements.number.value = address.number;
      form.elements.complement.value = address.complement ?? '';
      form.elements.district.value = address.district;
      form.elements.city.value = address.city;
      form.elements.state.value = address.state;
      form.elements.zipCode.value = address.zipCode;
      form.elements.label.value = address.label ?? '';
      form.elements.isDefault.checked = address.isDefault;
    }
  }

  form.classList.remove('hidden');
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('new-address-btn').addEventListener('click', () => openAddressForm());
document.getElementById('cancel-address').addEventListener('click', () => {
  document.getElementById('address-form').classList.add('hidden');
});

addressForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(addressForm).entries());
  const payload = {
    recipient: data.recipient,
    street: data.street,
    number: data.number,
    complement: data.complement || '',
    district: data.district,
    city: data.city,
    state: data.state.toUpperCase(),
    zipCode: data.zipCode,
    label: data.label || 'Endereco',
    isDefault: addressForm.elements.isDefault.checked,
  };

  const id = document.getElementById('address-id').value;
  try {
    if (id) {
      await api.patch(`/addresses/${id}`, payload);
      toast('Endereco atualizado.', 'success');
    } else {
      await api.post('/addresses', payload);
      toast('Endereco salvo.', 'success');
    }
    document.getElementById('address-form').classList.add('hidden');
    loadAddresses();
  } catch (error) {
    toast(error.message, 'error');
  }
});

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(profileForm).entries());
  try {
    const user = await api.patch('/auth/me', { name: data.name, phone: data.phone || undefined });
    store.setUser(user);
    toast('Dados atualizados.', 'success');
  } catch (error) {
    toast(error.message, 'error');
  }
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(passwordForm).entries());
  try {
    await api.post('/auth/me/password', data);
    passwordForm.reset();
    toast('Senha alterada com sucesso.', 'success');
  } catch (error) {
    toast(error.message, 'error');
  }
});

mountLayout({ activePath: '/src/pages/conta.html' });
loadProfile();
loadAddresses();
