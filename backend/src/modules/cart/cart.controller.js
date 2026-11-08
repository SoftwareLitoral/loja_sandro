import * as service from './cart.service.js';

export const get = async (req, res) => {
  const result = await service.getCart(req);
  res.json(result);
};

export const addItem = async (req, res) => {
  const result = await service.addItem(req, req.body);
  res.status(201).json(result);
};

export const updateItem = async (req, res) => {
  const result = await service.updateItem(req, req.params.productId, req.body.quantity);
  res.json(result);
};

export const removeItem = async (req, res) => {
  const result = await service.removeItem(req, req.params.productId);
  res.json(result);
};

export const clear = async (req, res) => {
  const result = await service.clearCart(req);
  res.json(result);
};

export const merge = async (req, res) => {
  const result = await service.mergeGuestCart(req.user.id, req.body.guestToken);
  res.json({ data: result });
};
