import { HttpError } from '../utils/http-error.js';
import { verifyToken } from '../utils/token.js';
import { prisma } from '../db/prisma.js';

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
};

/** Exige um cliente autenticado. */
export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw HttpError.unauthorized('Token de acesso ausente.');

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    if (!user) throw HttpError.unauthorized('Usuario nao encontrado.');

    req.user = user;
    return next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    return next(HttpError.unauthorized('Sessao expirada. Faca login novamente.'));
  }
}

/** Popula req.user quando houver token valido, mas nao bloqueia visitantes. */
export async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    if (user) req.user = user;
  } catch {
    // visitante anonimo
  }
  return next();
}

/** Garante perfil ADMIN. */
export function requireAdmin(req, res, next) {
  if (!req.user) return next(HttpError.unauthorized());
  if (req.user.role !== 'ADMIN') return next(HttpError.forbidden());
  return next();
}
