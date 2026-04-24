import CryptoJS from 'crypto-js';

const API_URL    = process.env.FLOW_API_URL    ?? 'https://sandbox.flow.cl/api';
const API_KEY    = process.env.FLOW_API_KEY    ?? '';
const SECRET_KEY = process.env.FLOW_SECRET_KEY ?? '';

function sign(params: Record<string, string>): string {
  const concat = Object.keys(params).sort().map(k => k + params[k]).join('');
  return CryptoJS.HmacSHA256(concat, SECRET_KEY).toString();
}

export async function createPayment(opts: {
  orderId:  string;
  amount:   number;
  email:    string;
  subject:  string;
}): Promise<{ flowUrl: string; token: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  const params: Record<string, string> = {
    apiKey:          API_KEY,
    commerceOrder:   opts.orderId,
    subject:         opts.subject,
    currency:        'CLP',
    amount:          String(opts.amount),
    email:           opts.email,
    urlConfirmation: `${siteUrl}/api/flow-webhook`,
    urlReturn:       `${siteUrl}/checkout-success`,
    paymentMethod:   '9',
  };
  params.s = sign(params);

  const body = new URLSearchParams(params);
  const res  = await fetch(`${API_URL}/payment/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });

  const data = await res.json();
  if (!data.url || !data.token) throw new Error(`Flow error: ${JSON.stringify(data)}`);
  return { flowUrl: `${data.url}?token=${data.token}`, token: data.token };
}

export async function getPaymentStatus(token: string): Promise<{ status: number; commerceOrder: string }> {
  const params: Record<string, string> = { apiKey: API_KEY, token };
  params.s = sign(params);
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/payment/getStatus?${qs}`);
  return res.json();
}
