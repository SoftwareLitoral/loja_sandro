# loja_sandro

# Loja do Sandro — Loja Virtual (produtos físicos)
--------------------------------------------------

Agora identifiquei o que está acontecendo! Seu projeto possui dois processos diferentes:
1. npm run dev: inicia a API Node.js na porta 3333 e o frontend Vite na porta 3000.
2. npm run seed:users: executa o cadastro automático de 20 usuários a cada 2 minutos.
O npm run dev não inicia automaticamente o cadastro de usuários.
-------------------------------------------------

Terminal 1 — Loja
Em execução

npm run dev
-------------------------------------------------

Terminal 2 — Cadastro automático
Entre na pasta backend:
cd backend
npm run seed:users

-------------------------------------------------

E-commerce completo com **backend e frontend separados**, sem painel administrativo (apenas a loja para clientes).

| Camada | Stack | Porta |
|---|---|---|
| Backend | Node.js 24 + Express 4 + Prisma 6 + MySQL 8 | `3333` |
| Frontend | HTML + JavaScript (ES Modules) + Tailwind CSS 4 (Vite) | `5173` |

---

## 1. Como executar

```bash
# 1) instalar dependencias
npm run install:all

# 2) banco de dados (ja configurado com root/aluno)
npm run migrate
npm run seed

# 3) subir API + site juntos
npm run dev
```

- Site: <http://localhost:5173>
- API: <http://localhost:3333/api>
- Health check: <http://localhost:3333/api/health>

**Conta de teste:** `cliente@lojadosandro.com` / `aluno`

> O `.env` do backend já aponta para `mysql://root:aluno@localhost:3306/loja_do_sandro`.
> Ajuste `DATABASE_URL` e `JWT_SECRET` conforme o ambiente.

---

## 2. Estrutura de pastas

```
loja-do-sandro/
├── package.json                  # orquestrador (dev: API + web juntos)
├── scripts/
│   └── dev.js                    # sobe backend e frontend em paralelo
├── backend/
│   ├── .env                      # variaveis de ambiente (DATABASE_URL, JWT...)
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma         # modelo de dados completo
│   │   ├── seed.js               # popula categorias, produtos e cliente de teste
│   │   └── migrations/           # migracoes versionadas do MySQL
│   └── src/
│       ├── server.js             # bootstrap do HTTP server
│       ├── app.js                # middlewares globais (cors, helmet, rate limit)
│       ├── config/
│       │   └── env.js            # leitura e validacao do .env
│       ├── db/
│       │   └── prisma.js         # instancia do PrismaClient
│       ├── middlewares/
│       │   ├── auth.js           # requireAuth / optionalAuth / requireAdmin
│       │   ├── error-handler.js  # tratamento centralizado de erros + validacao (zod)
│       │   └── rate-limit.js     # limites de requisicao
│       ├── modules/              # cada modulo = rotas + controller + service (+ schema)
│       │   ├── auth/             # cadastro, login, perfil, senha
│       │   ├── products/         # catalogo, busca, filtros, paginacao
│       │   ├── categories/       # categorias com contador de produtos
│       │   ├── cart/             # carrinho visitante + carrinho do cliente
│       │   ├── orders/           # criacao, pagamento, cancelamento, listagem
│       │   └── addresses/        # CRUD de enderecos do cliente
│       ├── routes/
│       │   └── index.js          # central de rotas da API
│       └── utils/
│           ├── async-handler.js  # tratamento de promises
│           ├── http-error.js     # HttpError (400/401/403/404/409)
│           ├── money.js          # formatacao de valores em centavos
│           ├── password.js       # hash/compare com bcrypt
│           ├── shipping.js       # regras de frete
│           ├── slugify.js
│           └── token.js          # assinatura/verificacao de JWT
└── frontend/
    ├── index.html                # home
    ├── vite.config.js            # multi-page + proxy /api -> :3333
    ├── package.json
    └── src/
        ├── pages/                # uma pagina por arquivo
        │   ├── produtos.html
        │   ├── produto.html
        │   ├── carrinho.html
        │   ├── checkout.html
        │   ├── login.html
        │   ├── cadastro.html
        │   ├── conta.html
        │   ├── pedidos.html
        │   └── pedido.html
        ├── styles/
        │   └── main.css          # Tailwind v4 (@theme com a paleta da marca)
        └── js/
            ├── api.js            # wrapper de fetch (token + cart token + erros)
            ├── store.js          # sessao no localStorage
            ├── format.js         # moeda, datas, rotulos de status
            ├── layout.js         # cabecalho/rodape compartilhados + badge do carrinho
            ├── ui.js             # toasts, card de produto, skeletons, estados vazios
            └── pages/            # um controller JS por pagina
                ├── home.js
                ├── produtos.js
                ├── produto.js
                ├── carrinho.js
                ├── checkout.js
                ├── login.js
                ├── cadastro.js
                ├── conta.js
                ├── pedidos.js
                └── pedido.js
```

---

## 3. Modelo de dados (Prisma / MySQL)

Valores monetários são gravados **em centavos** (`Int`) para eliminar erro de ponto flutuante.

```
User (users)
 ├── Address (addresses)        1:N  enderecos de entrega
 ├── Cart (carts)               1:1  carrinho do cliente logado
 └── Order (orders)             1:N  pedidos
         └── OrderItem (order_items)  1:N  itens (snapshot de nome/preço/imagem)

Category (categories) 1:N ──> Product (products) 1:N ──> ProductImage (product_images)
Cart (carts) 1:N ──> CartItem (cart_items) N:1 ──> Product
```

| Modelo | Campos principais |
|---|---|
| **User** | `id`, `email` (único), `passwordHash`, `name`, `phone`, `role` (`CUSTOMER`/`ADMIN`) |
| **Address** | `userId`, `recipient`, `street`, `number`, `complement`, `district`, `city`, `state`, `zipCode`, `isDefault` |
| **Category** | `name`, `slug` (único), `description` |
| **Product** | `name`, `slug` (único), `description`, `priceCents`, `compareAtCents`, `stock`, `active`, `featured`, `categoryId` |
| **ProductImage** | `productId`, `url`, `alt`, `position` |
| **Cart** | `userId?` (cliente logado) **ou** `token` (visitante, via header `X-Cart-Token`) |
| **CartItem** | `cartId`, `productId`, `quantity` — único por `(cartId, productId)` |
| **Order** | `orderNumber` (único), `status`, `paymentMethod`, `paymentStatus`, `shippingMethod`, `subtotalCents`, `shippingCents`, `discountCents`, `totalCents`, **snapshot do endereço**, `notes` |
| **OrderItem** | `productId?`, `productName`, `productSlug`, `imageUrl`, `unitPriceCents`, `quantity`, `totalCents` |

**Enums:** `UserRole`, `OrderStatus` (`PENDING_PAYMENT → PAID → CONFIRMED → SHIPPED → DELIVERED`, além de `CANCELLED`/`REFUNDED`), `PaymentMethod` (`PIX`, `CREDIT_CARD`, `BOLETO`, `CASH_ON_DELIVERY`), `PaymentStatus`, `ShippingMethod` (`STANDARD`, `EXPRESS`, `PICKUP`).

**Regras de negócio implementadas**
- Estoque validado e baixado dentro de transação ao criar o pedido; devolvido no cancelamento.
- `Order` guarda snapshot de nome, preço, imagem e endereço — alterações futuras no catálogo não quebram o histórico.
- Frete: grátis acima de R$ 199; padrão R$ 19,90; expressa R$ 34,90; retirada grátis.
- Carrinho de visitante é mesclado no carrinho do cliente no login (`POST /cart/merge`).
- Pagamento é **simulado** (gateway real fora do escopo): `POST /orders/:id/pay` aprova o pedido.

---

## 4. Endpoints da API

Base: `http://localhost:3333/api` · Autenticação: `Authorization: Bearer <token>` · Carrinho de visitante: header `X-Cart-Token`.

### Autenticação
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/register` | Cria conta (com endereço opcional) e devolve JWT | – |
| POST | `/auth/login` | Autentica e devolve `{ user, token }` | – |
| GET | `/auth/me` | Perfil + endereços do cliente | ✔ |
| PATCH | `/auth/me` | Atualiza nome/telefone | ✔ |
| POST | `/auth/me/password` | Troca de senha | ✔ |

### Catálogo
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/products` | Lista com `page`, `limit`, `search`, `category`, `minPrice`, `maxPrice`, `featured`, `sort` | – |
| GET | `/products/featured` | Produtos em destaque | – |
| GET | `/products/slug/:slug` | Detalhe por slug | – |
| GET | `/products/:id` | Detalhe por id | – |
| GET | `/categories` | Categorias + contagem de produtos | – |
| GET | `/shipping-options` | Opções de frete configuradas | – |

### Carrinho
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/cart` | Carrinho atual (logado ou visitante) | – |
| POST | `/cart/items` | Adiciona item `{ productId, quantity }` | – |
| PATCH | `/cart/items/:productId` | Atualiza quantidade (`0` remove) | – |
| DELETE | `/cart/items/:productId` | Remove item | – |
| DELETE | `/cart` | Esvazia o carrinho | – |
| POST | `/cart/merge` | Mescla carrinho de visitante no do cliente | ✔ |

### Endereços
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/addresses` | Lista os endereços | ✔ |
| POST | `/addresses` | Cria endereço | ✔ |
| GET | `/addresses/:id` | Detalhe | ✔ |
| PATCH | `/addresses/:id` | Atualiza | ✔ |
| DELETE | `/addresses/:id` | Remove (redefine o padrão se necessário) | ✔ |
| POST | `/addresses/:id/default` | Define como padrão | ✔ |

### Pedidos
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/orders` | Cria o pedido a partir do carrinho `{ addressId \| address, paymentMethod, shippingMethod, notes }` | ✔ |
| GET | `/orders` | Lista com `page`, `limit`, `status` | ✔ |
| GET | `/orders/:id` | Detalhe do pedido | ✔ |
| POST | `/orders/:id/pay` | Confirma o pagamento (simulação) | ✔ |
| POST | `/orders/:id/cancel` | Cancela e devolve o estoque | ✔ |

**Formato de erro (padronizado):**
```json
{ "error": { "message": "Dados invalidos.", "details": [{ "campo": "name", "mensagem": "..." }] } }
```

---

## 5. Fluxo do cliente

1. **Visitante** navega pelo catálogo e monta o carrinho (identificado por `X-Cart-Token` no `localStorage`).
2. Ao **entrar/cadastrar**, o carrinho de visitante é mesclado automaticamente no carrinho do cliente.
3. No **checkout**, escolhe endereço (salvo ou novo, com preenchimento automático de CEP via ViaCEP), forma de envio e pagamento.
4. O **pedido** é criado (estoque baixado, carrinho esvaziado) e o cliente é redirecionado para a página do pedido.
5. Acompanha o **status** em *Meus pedidos* (linha do tempo: criado → pago → confirmado → enviado → entregue), com ações de **pagar** e **cancelar**.
6. Em *Minha conta* gerencia **dados pessoais**, **senha** e **endereços**.

---

## 6. Comandos úteis

```bash
npm run dev            # API + frontend juntos
npm run dev:backend    # só a API (porta 3333)
npm run dev:frontend   # só o site (porta 5173)
npm run migrate        # aplica as migracoes do Prisma
npm run seed           # popula o banco
npm run build          # build de producao do frontend (frontend/dist)
npm run studio         # Prisma Studio para inspecionar os dados
```



entrar no backend

cd backend

promover ADM
node scripts/promover-admin.js


inserir cadstro users

USE loja_do_sandro;

INSERT INTO users (
    id,
    email,
    passwordHash,
    name,
    phone,
    role,
    createdAt,
    updatedAt
)
WITH RECURSIVE numeros AS (
    SELECT 10 AS n
    UNION ALL
    SELECT n + 1
    FROM numeros
    WHERE n < 1009
)
SELECT
    UUID(),
    CONCAT('usuario_', n, '@gmail.com'),
    '$2a$10$ElrQq7k9Fpo7TA6KQCn5ZuzFBYNErI9zMuXYoAk1z759UPJpB1SDi',
    CONCAT('Cliente de Teste ', LPAD(n + 9, 4, '0')),
    NULL,
    'CUSTOMER',
    NOW(3),
    NOW(3)
FROM numeros;

SELECT *
FROM users;

SELECT COUNT(*) AS total_admins
FROM users
WHERE role = 'ADMIN';

SELECT id, name, email, role
FROM users
WHERE email = 'seu-email@exemplo.com'
  AND role = 'ADMIN';

SELECT
    id,
    name,
    email,
    role,
    createdAt
FROM users
WHERE role = 'ADMIN';

SELECT name, email
FROM users
WHERE name LIKE 'Cliente de Teste %'
ORDER BY name
LIMIT 20;

SELECT COUNT(*) AS total_cadastros_teste
FROM users
WHERE name LIKE 'Cliente de Teste %';

('TesteLoja@2026')
$2a$10$ElrQq7k9Fpo7TA6KQCn5ZuzFBYNErI9zMuXYoAk1z759UPJpB1SDi