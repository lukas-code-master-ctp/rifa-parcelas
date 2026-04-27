'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TicketOrder } from '@/types';

/* ── helpers ────────────────────────────────────────── */
function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

/* ── PNG download (same as success page) ───────────── */
function downloadTicketsPNG(order: TicketOrder) {
  const W        = 720;
  const COLS     = 2;
  const ROW_H    = 46;
  const codeRows = Math.ceil(order.ticketCodes.length / COLS);
  const H        = 280 + codeRows * ROW_H + 60;

  const canvas  = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#23cb69';
  ctx.fillRect(0, 0, W, 90);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText('QuieroMiParcela', 32, 38);
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText('Tickets de Participación', 32, 64);

  const badge = `${order.ticketCodes.length} ticket${order.ticketCodes.length !== 1 ? 's' : ''}`;
  ctx.font = 'bold 15px Arial, sans-serif';
  const bw = ctx.measureText(badge).width + 24;
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(W - bw - 24, 30, bw, 32, 8);
  else ctx.rect(W - bw - 24, 30, bw, 32);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(badge, W - bw - 12, 51);

  ctx.fillStyle = '#111111';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText(`Pedido: ${order.orderId}`, 32, 128);
  ctx.fillStyle = '#444444';
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText(`Comprador: ${order.nombre}`, 32, 153);
  ctx.fillText(`Fecha: ${formatDate(order.timestamp)}`, 32, 175);
  ctx.fillText(`Total: ${formatCLP(order.total)}`, 32, 197);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 215);
  ctx.lineTo(W - 32, 215);
  ctx.stroke();

  ctx.fillStyle = '#6b7280';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('CÓDIGOS DE PARTICIPACIÓN', 32, 238);

  order.ticketCodes.forEach((code, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x   = 32 + col * 340;
    const y   = 252 + row * ROW_H;
    ctx.fillStyle = '#f0fdf4';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, 310, 34, 8);
    else ctx.rect(x, y, 310, 34);
    ctx.fill();
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 16px Courier New, monospace';
    ctx.fillText(code, x + 14, y + 22);
  });

  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, H - 54, W, 54);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(
    `compratuparcela.cl  •  Generado el ${new Date().toLocaleDateString('es-CL')}`,
    32, H - 24,
  );

  const link    = document.createElement('a');
  link.download = `tickets-${order.orderId}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

/* ── main component ─────────────────────────────────── */
export default function MyTicketsButton() {
  const [open,    setOpen]    = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [orders,  setOrders]  = useState<TicketOrder[] | null>(null);
  const [error,   setError]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /* mount flag so createPortal only runs client-side */
  useEffect(() => { setMounted(true); }, []);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /* focus input when modal opens */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  function handleClose() {
    setOpen(false);
    setEmail('');
    setOrders(null);
    setError('');
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setOrders(null);
    try {
      const res  = await fetch(`/api/my-tickets?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json() as { orders?: TicketOrder[]; error?: string };
      if (data.error) { setError(data.error); return; }
      setOrders(data.orders ?? []);
    } catch {
      setError('Error de conexión. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  const totalTickets = orders?.reduce((s, o) => s + o.ticketCodes.length, 0) ?? 0;

  return (
    <>
      {/* trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        Ver mis tickets
      </button>

      {/* modal — rendered via portal to escape the sticky navbar stacking context */}
      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <h2 className="text-xl font-heading font-bold">Ver mis tickets</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* search form */}
            <form onSubmit={search} className="px-6 py-5">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Correo electrónico con el que compraste
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 bg-cta hover:opacity-90 disabled:opacity-60 text-white font-heading font-bold rounded-xl transition-opacity cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                  )}
                  Buscar
                </button>
              </div>
              {error && (
                <p className="mt-3 text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>
              )}
            </form>

            {/* results */}
            {orders !== null && (
              <div className="px-6 pb-6">
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">No encontramos compras</p>
                    <p className="text-sm text-gray-500">No hay pedidos pagados para <strong>{email}</strong>.</p>
                  </div>
                ) : (
                  <>
                    {/* summary bar */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-primary/10 rounded-xl">
                      <span className="text-sm font-semibold text-green-800">
                        {orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} en total
                      </span>
                    </div>

                    {/* order list */}
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div key={order.orderId} className="border border-gray-100 rounded-2xl overflow-hidden">
                          {/* order header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <div>
                              <p className="font-heading font-bold text-sm">{order.orderId}</p>
                              <p className="text-xs text-gray-500">{formatDate(order.timestamp)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-primary">{formatCLP(order.total)}</span>
                              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                {order.ticketCodes.length} ticket{order.ticketCodes.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* tickets grid */}
                          <div className="px-4 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                              {order.ticketCodes.map(code => (
                                <div key={code} className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#86efac] rounded-lg px-2.5 py-1.5">
                                  <svg className="w-3 h-3 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                  </svg>
                                  <span className="font-mono font-bold text-xs text-green-800">{code}</span>
                                </div>
                              ))}
                            </div>

                            {/* download button */}
                            <button
                              onClick={() => downloadTicketsPNG(order)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:border-primary hover:text-primary text-gray-600 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Guardar tickets (PNG)
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
