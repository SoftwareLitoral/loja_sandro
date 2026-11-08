import * as service from './orders.service.js';

export const create = async (req, res) => {
  const result = await service.createOrder(req.user.id, req.body);
  res.status(201).json(result);
};

export const list = async (req, res) => {
  const result = await service.listOrders(req.user.id, req.query);
  res.json(result);
};

export const get = async (req, res) => {
  const result = await service.getOrder(req.user.id, req.params.id);
  res.json(result);
};

export const pay = async (req, res) => {
  const result = await service.payOrder(req.user.id, req.params.id);
  res.json(result);
};

export const cancel = async (req, res) => {
  const result = await service.cancelOrder(req.user.id, req.params.id);
  res.json(result);
};
