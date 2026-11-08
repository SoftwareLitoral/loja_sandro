
import { mountLayout } from '../layout.js';
import { api } from '../api.js';

const $ = (id) => document.getElementById(id);
const form = $('form-categoria');
const mensagem = $('mensagem');
const lista = $('lista-categorias');

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro
    ? 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600'
    : 'rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700';
}

async function carregarCategorias() {
  try {
    const resposta = await api.get('/categories');
    const categorias = resposta.data ?? [];

    lista.replaceChildren();

    for (const categoria of categorias) {
      const item = document.createElement('li');
      item.textContent = categoria.name;
      item.className = 'rounded-lg border p-3';
      lista.appendChild(item);
    }
  } catch (erro) {
    console.error(erro);
    mostrarMensagem('Não foi possível carregar as categorias.', true);
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const name = $('nome').value.trim();
  const description = $('descricao').value.trim();

  if (name.length < 2) {
    mostrarMensagem('Digite um nome válido para a categoria.', true);
    return;
  }

  const botao = form.querySelector('button[type="submit"]');
  botao.disabled = true;

  try {
    await api.post('/categories', {
      name,
      description: description || undefined,
    });

    mostrarMensagem('Categoria cadastrada com sucesso!');
    form.reset();
    await carregarCategorias();
  } catch (erro) {
    console.error(erro);
    mostrarMensagem(
      erro?.message || 'Erro ao cadastrar categoria. Verifique o backend e suas permissões.',
      true
    );
  } finally {
    botao.disabled = false;
  }
});

await mountLayout();
await carregarCategorias();
