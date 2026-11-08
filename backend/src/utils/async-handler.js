/** Envolve handlers async e encaminha rejeicoes para o error handler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
