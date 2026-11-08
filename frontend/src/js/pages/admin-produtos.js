import { mountLayout } from '../layout.js';
import { api } from '../api.js';

const $ = (id) => document.getElementById(id);
const form = $('form-produto');
const tabela = $('tabela-produtos');
const mensagem = $('mensagem');

let produtos = [];
let categorias = [];


const NOVA_CATEGORIA = '__nova_categoria__';
let categoriaSelecionadaAntesDoCadastro = '';

function criarFormularioCategoria() {
  if ($('modal-nova-categoria')) return;

  const modal = document.createElement('dialog');
  modal.id = 'modal-nova-categoria';
  modal.className = 'rounded-2xl p-0 shadow-2xl';
  modal.style.width = 'min(92vw, 480px)';
  modal.style.border = '1px solid #e5e7eb';

  modal.innerHTML = `
    <form id="form-nova-categoria" class="p-6 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-xl font-bold">Nova categoria</h2>
        <button type="button" id="fechar-modal-categoria"
          class="text-2xl" aria-label="Fechar">&times;</button>
      </div>

      <p class="text-sm text-gray-600">
        Cadastre uma categoria para utilizar nos produtos da loja.
      </p>

      <div>
        <label for="nova-categoria-nome"
          class="block mb-1 font-semibold">Nome da categoria</label>
        <input id="nova-categoria-nome" name="name"
          class="admin-input w-full" maxlength="100"
          required minlength="2" placeholder="Ex.: Informática">
      </div>

      <div>
        <label for="nova-categoria-descricao"
          class="block mb-1 font-semibold">Descrição</label>
        <textarea id="nova-categoria-descricao" name="description"
          class="admin-input w-full" rows="3" maxlength="500"
          placeholder="Descrição opcional"></textarea>
      </div>

      <p id="mensagem-nova-categoria"
        class="text-sm" role="status" aria-live="polite"></p>

      <div class="flex justify-end gap-3">
        <button type="button" id="cancelar-modal-categoria"
          class="btn-outline">Cancelar</button>
        <button type="submit" id="salvar-nova-categoria"
          class="btn-primary">Salvar categoria</button>
      </div>
    </form>
  `;

  document.body.append(modal);

  const fechar = () => {
    if (modal.open) modal.close();
    $('categoria').value = categoriaSelecionadaAntesDoCadastro;
  };

  $('fechar-modal-categoria').addEventListener('click', fechar);
  $('cancelar-modal-categoria').addEventListener('click', fechar);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) fechar();
  });

  $('form-nova-categoria').addEventListener('submit', salvarNovaCategoria);
}

function abrirFormularioCategoria() {
  const modal = $('modal-nova-categoria');
  const formCategoria = $('form-nova-categoria');

  formCategoria.reset();
  $('mensagem-nova-categoria').textContent = '';
  $('mensagem-nova-categoria').className = 'text-sm';
  $('salvar-nova-categoria').disabled = false;
  $('salvar-nova-categoria').textContent = 'Salvar categoria';

  modal.showModal();
  $('nova-categoria-nome').focus();
}

async function salvarNovaCategoria(event) {
  event.preventDefault();

  const nome = $('nova-categoria-nome').value.trim();
  const descricao = $('nova-categoria-descricao').value.trim();
  const botao = $('salvar-nova-categoria');
  const mensagemCategoria = $('mensagem-nova-categoria');

  if (nome.length < 2) {
    mensagemCategoria.textContent =
      'Informe um nome com pelo menos 2 caracteres.';
    mensagemCategoria.className = 'text-sm text-red-600';
    return;
  }

  botao.disabled = true;
  botao.textContent = 'Salvando...';

  try {
    const resposta = await api.post('/categories', {
      name: nome,
      description: descricao,
    });

    const categoriaCriada = resposta.data;

    if (!categoriaCriada?.id) {
      throw new Error('A API não retornou a categoria cadastrada.');
    }

    await carregarCategorias(categoriaCriada.id);

    $('modal-nova-categoria').close();
    mostrarMensagem(
      `Categoria "${categoriaCriada.name}" cadastrada e selecionada.`
    );
  } catch (erro) {
    mensagemCategoria.textContent =
      erro.message || 'Não foi possível cadastrar a categoria.';
    mensagemCategoria.className = 'text-sm text-red-600';
  } finally {
    botao.disabled = false;
    botao.textContent = 'Salvar categoria';
  }
}

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro
    ? 'admin-message error'
    : 'admin-message';
}

function dinheiro(centavos) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

function limparFormulario() {
  form.reset();
  $('produto-id').value = '';
  $('estoque').value = '0';
  $('ativo').checked = true;
  $('titulo-form').textContent = 'Adicionar produto';
  $('botao-salvar').textContent = 'Cadastrar produto';
  $('botao-cancelar').classList.add('hidden');
}

async function carregarCategorias(categoriaParaSelecionar = null) {
  const select = $('categoria');

  select.disabled = true;
  select.replaceChildren(
    new Option('Carregando categorias...', '')
  );

  try {
    const resposta = await api.get('/categories');
    categorias = resposta.data ?? [];

    select.replaceChildren(
      new Option('＋ Nova categoria', NOVA_CATEGORIA),
      new Option('Selecione uma categoria', '')
    );

    for (const categoria of categorias) {
      select.add(new Option(categoria.name, categoria.id));
    }

    if (categoriaParaSelecionar) {
      select.value = categoriaParaSelecionar;
    } else if (!categorias.length) {
      select.value = NOVA_CATEGORIA;
    }

    if (!categorias.length) {
      mostrarMensagem(
        'Nenhuma categoria cadastrada. Selecione "+ Nova categoria" para criar a primeira.'
      );
    }
  } catch (erro) {
    console.error('Erro ao carregar categorias:', erro);

    select.replaceChildren(
      new Option('＋ Nova categoria', NOVA_CATEGORIA),
      new Option('Erro ao carregar categorias', '')
    );

    mostrarMensagem(
      'Não foi possível carregar as categorias. Verifique a API.',
      true
    );
  } finally {
    select.disabled = false;
  }
}

async function carregarProdutos() {
  tabela.innerHTML =
    '<tr><td colspan="6" class="p-5 text-center">Carregando...</td></tr>';

  const resposta = await api.get('/products/admin');
  produtos = resposta.data ?? [];

  tabela.replaceChildren();

  if (!produtos.length) {
    tabela.innerHTML =
      '<tr><td colspan="6" class="p-5 text-center">Nenhum produto cadastrado.</td></tr>';
    return;
  }

  for (const produto of produtos) {
    const tr = document.createElement('tr');
    tr.className = 'border-t';

    const nome = document.createElement('td');
    nome.className = 'p-3';
    nome.textContent = produto.name;

    const categoria = document.createElement('td');
    categoria.className = 'p-3';
    categoria.textContent = produto.category?.name ?? '—';

    const preco = document.createElement('td');
    preco.className = 'p-3';
    preco.textContent = dinheiro(produto.priceCents);

    const estoque = document.createElement('td');
    estoque.className = 'p-3';
    estoque.textContent = String(produto.stock);

    const situacao = document.createElement('td');
    situacao.className = 'p-3';
    situacao.textContent = produto.active ? 'Ativo' : 'Inativo';


    const acoes = document.createElement('td');
    acoes.className = 'p-3';

    // Botão Editar
    const editar = document.createElement('button');
    editar.type = 'button';
    editar.textContent = 'Editar';
    editar.className = 'mr-3 font-semibold text-purple-700 hover:underline';
    editar.addEventListener('click', () => editarProduto(produto.id));
    acoes.append(editar);

    // Botão Desativar: aparece somente para produtos ativos
    if (produto.active) {
      const desativar = document.createElement('button');
      desativar.type = 'button';
      desativar.textContent = 'Desativar';
      desativar.className = 'mr-3 font-semibold text-orange-700 hover:underline';
      desativar.addEventListener('click', () => desativarProduto(produto.id));
      acoes.append(desativar);
    }

    // Botão Excluir
    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.textContent = 'Excluir';
    excluir.className = 'font-semibold text-red-800 hover:underline';
    excluir.addEventListener('click', () => excluirProduto(produto.id));
    acoes.append(excluir);

    tr.append(nome, categoria, preco, estoque, situacao, acoes);
    tabela.append(tr);
  }
}

function editarProduto(id) {
  const produto = produtos.find((item) => item.id === id);
  if (!produto) return;

  $('produto-id').value = produto.id;
  $('nome').value = produto.name;
  $('categoria').value = produto.category?.id ?? '';
  $('preco').value = (produto.priceCents / 100).toFixed(2);
  $('preco-anterior').value = produto.compareAtCents == null
    ? ''
    : (produto.compareAtCents / 100).toFixed(2);
  $('estoque').value = produto.stock;
  $('imagem').value = produto.mainImage ?? '';
  $('descricao-curta').value = produto.shortDescription ?? '';
  $('descricao').value = produto.description;
  $('destaque').checked = produto.featured;
  $('ativo').checked = produto.active;

  $('titulo-form').textContent = 'Editar produto';
  $('botao-salvar').textContent = 'Salvar alterações';
  $('botao-cancelar').classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function desativarProduto(id) {
  const produto = produtos.find((item) => item.id === id);
  if (!produto) return;

  if (!window.confirm(`Deseja desativar "${produto.name}"?`)) return;

  try {
    await api.patch(`/products/${encodeURIComponent(id)}/deactivate`, {});
    mostrarMensagem('Produto desativado com sucesso.');
    await carregarProdutos();
  } catch (erro) {
    mostrarMensagem(erro.message, true);
  }
}

async function excluirProduto(id) {
  const produto = produtos.find((item) => item.id === id);
  if (!produto) return;

  const confirmado = window.confirm(
    `Tem certeza de que deseja excluir permanentemente o produto "${produto.name}"? Esta ação não poderá ser desfeita.`
  );

  if (!confirmado) return;

  try {
    await api.del(`/products/${encodeURIComponent(id)}`);

    mostrarMensagem('Solicitação de exclusão enviada.');
    await carregarProdutos();
  } catch (erro) {
    mostrarMensagem(
      erro.message || 'Não foi possível excluir o produto.',
      true
    );
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = $('produto-id').value;

  const dados = {
    name: $('nome').value.trim(),
    categoryId: $('categoria').value,
    price: Number($('preco').value),
    stock: Number($('estoque').value),
    description: $('descricao').value.trim(),
    shortDescription: $('descricao-curta').value.trim(),
    imageUrl: $('imagem').value.trim(),
    featured: $('destaque').checked,
    active: $('ativo').checked,
    compareAtPrice: $('preco-anterior').value
      ? Number($('preco-anterior').value)
      : null,
  };

  try {
    $('botao-salvar').disabled = true;

    if (id) {
      await api.patch(`/products/${encodeURIComponent(id)}`, dados);
      mostrarMensagem('Produto atualizado com sucesso.');
    } else {
      await api.post('/products', dados);
      mostrarMensagem('Produto cadastrado com sucesso.');
    }

    limparFormulario();
    await carregarProdutos();
  } catch (erro) {
    mostrarMensagem(erro.message || 'Não foi possível salvar o produto.', true);
  } finally {
    $('botao-salvar').disabled = false;
  }
});

$('botao-cancelar').addEventListener('click', limparFormulario);

$('botao-atualizar').addEventListener('click', async () => {
  try {
    await carregarProdutos();
    mostrarMensagem('Lista atualizada.');
  } catch (erro) {
    mostrarMensagem(erro.message, true);
  }
});

$('categoria').addEventListener('focus', () => {
  if ($('categoria').value !== NOVA_CATEGORIA) {
    categoriaSelecionadaAntesDoCadastro = $('categoria').value;
  }
});

$('categoria').addEventListener('change', () => {
  if ($('categoria').value !== NOVA_CATEGORIA) return;

  criarFormularioCategoria();
  abrirFormularioCategoria();
});

async function iniciar() {
  try {
    await mountLayout();

    await api.get('/auth/me');
    await carregarCategorias();
    await carregarProdutos();
  } catch (erro) {
    mostrarMensagem(
      erro.status === 401 || erro.status === 403
        ? 'Entre com uma conta de administrador para gerenciar os produtos.'
        : `Não foi possível carregar os dados: ${erro.message}`,
      true,
    );
  }
}

iniciar();
