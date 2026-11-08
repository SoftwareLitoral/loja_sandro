import * as service from './auth.service.js';

export const register = async (req, res) => {
  const result = await service.register(req.body);
  res.status(201).json(result);
};

export const login = async (req, res) => {
  const result = await service.login(req.body);
  res.json(result);
};

export const me = async (req, res) => {
  const result = await service.me(req.user.id);
  res.json(result);
};

export const updateProfile = async (req, res) => {
  const result = await service.updateProfile(req.user.id, req.body);
  res.json(result);
};

export const changePassword = async (req, res) => {
  const result = await service.changePassword(req.user.id, req.body);
  res.json(result);
};
