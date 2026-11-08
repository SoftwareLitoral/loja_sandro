import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`>> Loja do Sandro API rodando em ${env.apiUrl}`);
});

const shutdown = async (signal) => {
  console.log(`\n${signal} recebido, encerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
