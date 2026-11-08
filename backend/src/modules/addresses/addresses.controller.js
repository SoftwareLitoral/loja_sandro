import * as service from './addresses.service.js';

export const list = async (req, res) => {
  const result = await service.listAddresses(req.user.id);
  res.json({ data: result });
};

export const get = async (req, res) => {
  const result = await service.getAddress(req.user.id, req.params.id);
  res.json(result);
};

export const create = async (req, res) => {
  const result = await service.createAddress(req.user.id, req.body);
  res.status(201).json(result);
};

export const update = async (req, res) => {
  const result = await service.updateAddress(req.user.id, req.params.id, req.body);
  res.json(result);
};

export const remove = async (req, res) => {
  const result = await service.deleteAddress(req.user.id, req.params.id);
  res.json(result);
};

export const setDefault = async (req, res) => {
  const result = await service.setDefaultAddress(req.user.id, req.params.id);
  res.json(result);
};
