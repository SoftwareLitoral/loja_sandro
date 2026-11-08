import { api } from '../api.js';
import { store } from '../store.js';
import { mountLayout } from '../layout.js';
import { toast } from '../ui.js';

const form = document.getElementById('register-form');
const errorBox = document.getElementById('form-error');

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.classList.add('hidden');

  const button = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());

  if (data.password !== data.passwordConfirm) {
    showError('As senhas nao conferem.');
    return;
  }

  button.disabled = true;
  button.textContent = 'Criando conta...';

  try {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
    };

    const response = await api.post('/auth/register', payload);
    store.setSession(response);

    const guestToken = store.getCartToken();
    try {
      await api.post('/cart/merge', { guestToken });
      store.clearCartToken();
    } catch {
      /* merge e opcional */
    }

    toast('Conta criada com sucesso!', 'success');
    window.location.href = '/src/pages/conta.html';
  } catch (error) {
    showError(error.message);
    button.disabled = false;
    button.textContent = 'Criar conta';
  }
});

mountLayout();
