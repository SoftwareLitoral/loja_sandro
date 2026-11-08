
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:3333';

export default defineConfig({
  plugins: [tailwindcss()],

  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        adminCategorias: resolve(process.cwd(),'src/pages/admin-categorias.html'),
        index: resolve(process.cwd(), 'index.html'),
        produtos: resolve(process.cwd(), 'src/pages/produtos.html'),
        produto: resolve(process.cwd(), 'src/pages/produto.html'),
        adminProdutos: resolve(process.cwd(), 'src/pages/admin-produtos.html'),
        carrinho: resolve(process.cwd(), 'src/pages/carrinho.html'),
        checkout: resolve(process.cwd(), 'src/pages/checkout.html'),
        login: resolve(process.cwd(), 'src/pages/login.html'),
        cadastro: resolve(process.cwd(), 'src/pages/cadastro.html'),
        conta: resolve(process.cwd(), 'src/pages/conta.html'),
        pedidos: resolve(process.cwd(), 'src/pages/pedidos.html'),
        pedido: resolve(process.cwd(), 'src/pages/pedido.html'),
      },
    },
  },
});
