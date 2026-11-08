import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const INTERVALO = 2 * 60 * 1000;
const QUANTIDADE = 20;
const SENHA = 'Teste@123456';

let executando = false;

async function cadastrarUsuarios() {
    if (executando) {
        console.log('Já existe um lote em execução.');
        return;
    }

    executando = true;

    try {
        const passwordHash = await bcrypt.hash(SENHA, 10);

        const lote = `${Date.now()}`;

        const usuarios = Array.from(
            { length: QUANTIDADE },
            (_, index) => {
                const numero = index + 1;

                return {
                    email: `teste_${lote}_${numero}@example.com`,
                    passwordHash,
                    name: `Cliente de Teste ${lote}_${String(numero).padStart(2, '0')}`,
                    phone: null,
                    role: 'CUSTOMER'
                };
            }
        );

        const resultado = await prisma.user.createMany({
            data: usuarios,
            skipDuplicates: true
        });

        console.log('----------------------------------');
        console.log('CADASTRO AUTOMÁTICO EXECUTADO');
        console.log(`Data: ${new Date().toLocaleString('pt-BR')}`);
        console.log(`Usuários cadastrados: ${resultado.count}`);
        console.log('Próximo lote em 2 minutos.');
        console.log('----------------------------------');

    } catch (erro) {
        console.error('ERRO NO CADASTRO AUTOMÁTICO:');
        console.error(erro);

    } finally {
        executando = false;
    }
}

async function iniciar() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL não encontrada no arquivo .env');
        }

        await prisma.$connect();

        console.log('Conexão com MySQL estabelecida.');
        console.log('Sistema de cadastro automático iniciado.');

        // Primeiro cadastro imediatamente
        await cadastrarUsuarios();

        // Próximos cadastros a cada 2 minutos
        async function agendar() {
            await new Promise(resolve => setTimeout(resolve, INTERVALO));

            await cadastrarUsuarios();

            agendar();
        }

        agendar();

    } catch (erro) {
        console.error('Falha ao iniciar o sistema:', erro);
        await prisma.$disconnect();
        process.exit(1);
    }
}

async function encerrar() {
    console.log('\nEncerrando cadastro automático...');

    await prisma.$disconnect();

    process.exit(0);
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);

iniciar();