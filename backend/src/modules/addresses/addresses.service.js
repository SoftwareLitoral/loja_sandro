import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';

const normalize = (data) => ({
  ...data,
  complement: data.complement || null,
  label: data.label || 'Endereco',
  zipCode: data.zipCode.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2'),
});

export async function listAddresses(userId) {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return addresses;
}

export async function getAddress(userId, id) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw HttpError.notFound('Endereco nao encontrado.');
  return address;
}

export async function createAddress(userId, data) {
  const count = await prisma.address.count({ where: { userId } });
  const isDefault = data.isDefault ?? count === 0;

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return prisma.address.create({ data: { ...normalize(data), userId, isDefault } });
}

export async function updateAddress(userId, id, data) {
  await getAddress(userId, id);

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return prisma.address.update({ where: { id }, data });
}

export async function deleteAddress(userId, id) {
  const address = await getAddress(userId, id);
  await prisma.address.delete({ where: { id: address.id } });

  // Garante que exista um endereco padrao
  const remaining = await prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  if (remaining.length && !remaining.some((a) => a.isDefault)) {
    await prisma.address.update({ where: { id: remaining[0].id }, data: { isDefault: true } });
  }

  return { message: 'Endereco removido.' };
}

export async function setDefaultAddress(userId, id) {
  await getAddress(userId, id);
  await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  return prisma.address.update({ where: { id }, data: { isDefault: true } });
}
