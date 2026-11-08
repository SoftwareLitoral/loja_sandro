/**
 * Sobe a API (backend) e o frontend (Vite) em paralelo.
 * Uso: npm run dev
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend');
const frontend = join(root, 'frontend');

const viteBin = join(frontend, 'node_modules', 'vite', 'bin', 'vite.js');

if (!existsSync(join(backend, 'node_modules')) || !existsSync(viteBin)) {
  console.error('Dependencias ausentes. Rode: npm run install:all');
  process.exit(1);
}

const targets = [
  {
    name: 'API',
    color: '\x1b[36m',
    command: process.execPath,
    args: ['--watch', 'src/server.js'],
    cwd: backend,
  },
  {
    name: 'WEB',
    color: '\x1b[35m',
    command: process.execPath,
    args: [viteBin],
    cwd: frontend,
  },
];

const children = targets.map((target) => {
  const child = spawn(target.command, target.args, {
    cwd: target.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const prefix = `${target.color}[${target.name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      lines.filter((line) => line.trim()).forEach((line) => out.write(`${prefix}${line}\n`));
    });
  };

  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);

  child.on('exit', (code) => {
    console.log(`${prefix}encerrado (codigo ${code})`);
  });

  return child;
});

const shutdown = () => {
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
