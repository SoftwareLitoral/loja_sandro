/** Erro de negocio com status HTTP. */
export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message = 'Requisicao invalida.', details = null) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'Nao autenticado.') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'Acesso negado.') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Recurso nao encontrado.') {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflito de dados.') {
    return new HttpError(409, message);
  }
}
