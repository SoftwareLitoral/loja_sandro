import { env } from '../config/env.js';

/**
 * Calcula o custo de frete.
 * @param {number} subtotalCents total dos itens do carrinho
 * @param {'STANDARD'|'EXPRESS'|'PICKUP'} method
 */
export function calculateShipping(subtotalCents, method = 'STANDARD') {
  if (method === 'PICKUP') return env.shipping.pickupCents;
  if (subtotalCents >= env.shipping.freeThresholdCents) return 0;
  if (method === 'EXPRESS') return env.shipping.expressCents;
  return env.shipping.standardCents;
}

export const shippingOptions = () => [
  {
    method: 'STANDARD',
    label: 'Entrega padrao',
    description: '5 a 8 dias uteis',
    priceCents: env.shipping.standardCents,
  },
  {
    method: 'EXPRESS',
    label: 'Entrega expressa',
    description: '2 a 3 dias uteis',
    priceCents: env.shipping.expressCents,
  },
  {
    method: 'PICKUP',
    label: 'Retirar na loja',
    description: 'Disponivel em 1 dia util',
    priceCents: env.shipping.pickupCents,
  },
];
