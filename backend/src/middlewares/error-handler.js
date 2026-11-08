import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';
import { env } from '../config/env.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        campo: issue.path.join('.') || source,
        mensagem: issue.message,
      }));
      return next(HttpError.badRequest('Dados invalidos.', details));
    }
    req[source] = result.data;
    return next();
  };
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Rota nao encontrada: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Dados invalidos.',
        details: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
      },
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { message: err.message, details: err.details ?? undefined },
    });
  }

  // Violacao de unique do Prisma
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: { message: 'Registro duplicado.', details: err.meta } });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: { message: 'Registro nao encontrado.' } });
  }
  // Foreign key / constraint
  if (err?.code === 'P2003') {
    return res.status(400).json({ error: { message: 'Relacionamento invalido.' } });
  }

  if (!env.isProd) console.error(err);

  return res.status(500).json({ error: { message: 'Erro interno do servidor.' } });
}
