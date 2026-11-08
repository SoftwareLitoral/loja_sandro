import rateLimit from 'express-rate-limit';

/** Limite mais rigido para rotas sensiveis (login/cadastro). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Muitas tentativas. Tente novamente em alguns minutos.' } },
});

/** Limite geral da API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Limite de requisicoes excedido.' } },
});
