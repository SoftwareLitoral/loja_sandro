import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { productsRouter } from '../modules/products/products.routes.js';
import { categoriesRouter } from '../modules/categories/categories.routes.js';
import { cartRouter } from '../modules/cart/cart.routes.js';
import { ordersRouter } from '../modules/orders/orders.routes.js';
import { addressesRouter } from '../modules/addresses/addresses.routes.js';
import { shippingOptions } from '../utils/shipping.js';
import { env } from '../config/env.js';

export const routes = Router();

routes.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'loja-do-sandro-api', env: env.nodeEnv, time: new Date().toISOString() });
});

routes.get('/shipping-options', (req, res) => {
  res.json({
    data: shippingOptions(),
    freeShippingThresholdCents: env.shipping.freeThresholdCents,
  });
});

routes.use('/auth', authRouter);
routes.use('/products', productsRouter);
routes.use('/categories', categoriesRouter);
routes.use('/cart', cartRouter);
routes.use('/orders', ordersRouter);
routes.use('/addresses', addressesRouter);
