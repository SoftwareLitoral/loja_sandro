import { api } from '../api.js';
import { store } from '../store.js';
import { mountLayout } from '../layout.js';
import { toast } from '../ui.js';

const form = document.getElementById('login-form');
const errorBox = document.getElementById('form-error');

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function redirectTarget() {
  const params = new URLSearchParams(window.location.search);
  const target = params.get('returnTo');
  return target ? decodeURIComponent(target) : '/src/pages/conta.html';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.classList.add('hidden');

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Entrando...';

  try {
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await api.post('/auth/login', data);

    store.setSession(response);

    // Une o carrinho de visitante ao carrinho do cliente
    const guestToken = store.getCartToken();
    try {
      await api.post('/cart/merge', { guestToken });
      store.clearCartToken();
    } catch {
      /* merge e opcional */
    }

    toast(`Bem-vindo(a), ${response.user.name.split(' ')[0]}!`, 'success');
    window.location.href = redirectTarget();
  } catch (error) {
    showError(error.message);
    button.disabled = false;
    button.textContent = 'Entrar';
  }
});

mountLayout();
