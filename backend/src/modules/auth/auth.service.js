import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { signToken } from '../../utils/token.js';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  role: user.role,
});

export async function register({ name, email, password, phone, address }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw HttpError.conflict('Ja existe uma conta com este e-mail.');

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone ?? null,
      passwordHash,
      addresses: address
        ? {
            create: {
              ...address,
              zipCode: address.zipCode,
              complement: address.complement || null,
              label: address.label || 'Endereco principal',
              isDefault: true,
            },
          }
        : undefined,
    },
    include: { addresses: true },
  });

  return { user: publicUser(user), token: signToken({ sub: user.id, role: user.role }) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw HttpError.unauthorized('E-mail ou senha incorretos.');

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw HttpError.unauthorized('E-mail ou senha incorretos.');

  return { user: publicUser(user), token: signToken({ sub: user.id, role: user.role }) };
}

export async function me(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: { orderBy: { createdAt: 'asc' } } },
  });
  if (!user) throw HttpError.notFound('Usuario nao encontrado.');
  return { ...publicUser(user), addresses: user.addresses };
}

export async function updateProfile(userId, data) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  return publicUser(user);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw HttpError.notFound('Usuario nao encontrado.');

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw HttpError.badRequest('Senha atual incorreta.');

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { message: 'Senha alterada com sucesso.' };
}
