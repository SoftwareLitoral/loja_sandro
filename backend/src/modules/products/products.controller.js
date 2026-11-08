
import * as service from './products.service.js';

export const list = async (req, res) => {
  const result = await service.listProducts(req.query);
  res.json(result);
};

export const featured = async (req, res) => {
  const result = await service.listFeatured(
    Number(req.query.limit) || 8
  );
  res.json({ data: result });
};

export const getById = async (req, res) => {
  const result = await service.getProduct(req.params.id);
  res.json(result);
};

export const getBySlug = async (req, res) => {
  const result = await service.getProductBySlug(req.params.slug);
  res.json(result);
};

export const adminList = async (req, res) => {
  const result = await service.listAdminProducts();
  res.json({ data: result });
};

export const create = async (req, res) => {
  const result = await service.createProduct(req.body);
  res.status(201).json({ data: result });
};

export const update = async (req, res) => {
  const result = await service.updateProduct(
    req.params.id,
    req.body
  );
  res.json({ data: result });
};

export const deactivate = async (req, res) => {
  const result = await service.deactivateProduct(req.params.id);
  res.json({
    data: result,
    message: 'Produto desativado com sucesso.',
  });
};

export const remove = async (req, res) => {
  const result = await service.deleteProduct(req.params.id);
  res.json({
    data: result,
    message: 'Produto excluído com sucesso.',
  });
};
