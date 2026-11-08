/** Helpers de dinheiro (valores sempre em centavos). */

export const formatBRL = (cents) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    (cents ?? 0) / 100,
  );

export const toCents = (value) => {
  if (typeof value === 'number') return Math.round(value * 100);
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

/** Aplica percentual de desconto sobre um valor em centavos. */
export const percentOff = (cents, percent) => Math.round((cents * percent) / 100);
