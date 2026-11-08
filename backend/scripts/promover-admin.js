
import { prisma } from '../src/db/prisma.js';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const terminal = createInterface({ input: stdin, output: stdout });

try {
  console.log('\n=== Primeiro administrador da Loja do Sandro ===\n');

  // Este procedimento só pode inicializar o primeiro ADM.
  const totalAdmins = await prisma.user.count({
    where: { role: 'ADMIN' },
  });

  if (totalAdmins > 0) {
    throw new Error(
      'Já existe um administrador. Operação cancelada.'
    );
  }

  const email = (
    await terminal.question('E-mail da conta já cadastrada: ')
  ).trim();

  if (!email || !email.includes('@')) {
    throw new Error('Informe um e-mail válido.');
  }

  const confirmacao = (
    await terminal.question('Digite novamente o e-mail: ')
  ).trim();

  if (email !== confirmacao) {
    throw new Error('Os e-mails não correspondem.');
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(
      'Conta não encontrada. Cadastre-se primeiro pela loja.'
    );
  }

  if (user.role === 'ADMIN') {
    throw new Error('Esta conta já é administradora.');
  }

  const atualizado = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log('\nAdministrador inicial criado com sucesso!');
  console.log(atualizado);
  console.log('\nEntre novamente na loja para renovar seu token.');
} catch (error) {
  console.error('\nNão foi possível criar o administrador:');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  terminal.close();
  await prisma.$disconnect();
}
