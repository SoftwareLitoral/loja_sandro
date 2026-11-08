export const formatBRL = (cents) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents ?? 0) / 100);

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatCep = (cep) => {
  if (!cep) return '';
  const digits = cep.replace(/\D/g, '');
  return digits.length === 8 ? digits.replace(/^(\d{5})(\d{3})$/, '$1-$2') : cep;
};

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

export const STATUS_LABELS = {
  PENDING_PAYMENT: { label: 'Aguardando pagamento', className: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'Pago', className: 'bg-emerald-100 text-emerald-700' },
  CONFIRMED: { label: 'Confirmado', className: 'bg-sky-100 text-sky-700' },
  SHIPPED: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-700' },
  DELIVERED: { label: 'Entregue', className: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-600' },
  REFUNDED: { label: 'Estornado', className: 'bg-stone-200 text-stone-600' },
};

export const PAYMENT_LABELS = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartao de credito',
  BOLETO: 'Boleto bancario',
  CASH_ON_DELIVERY: 'Dinheiro na entrega',
};

export const SHIPPING_LABELS = {
  STANDARD: 'Entrega padrao',
  EXPRESS: 'Entrega expressa',
  PICKUP: 'Retirar na loja',
};
