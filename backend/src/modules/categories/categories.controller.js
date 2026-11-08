
import * as service from './categories.service.js';

export const list = async (req, res) => {
  const result = await service.listCategories();
  res.json({ data: result });
};

export const create = async (req, res) => {
  const { name, description } = req.body;

  const category = await service.createCategory({
    name,
    description,
  });

  res.status(201).json({
    message: 'Categoria cadastrada com sucesso!',
    data: category,
  });
};
