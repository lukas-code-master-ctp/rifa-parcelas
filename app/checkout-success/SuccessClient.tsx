'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { TicketOrder } from '@/types';

/* ── helpers ────────────────────────────────────────── */
function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

/* ── PNG download ───────────────────────────────────── */
function downloadTicketsPNG(order: TicketOrder) {
  const W          = 720;
  const COLS       = 2;
  const ROW_H      = 46;
  const codeRows   = Math.ceil(order.ticketCodes.length / COLS);
  const H          = 280 + codeRows * ROW_H + 60;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  /* background */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  /* green header */
  ctx.fillStyle = '#23cb69';
  ctx.fillRect(0, 0, W, 90);

  /* header title */
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText('QuieroMiParcela', 32, 38);
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText('Tickets de Participación', 32, 64);

  /* ticket count badge */
  const badge = `${order.ticketCodes.length} ticket${order.ticketCodes.length !== 1 ? 's' : ''}`;
  ctx.font = 'bold 15px Arial, sans-serif';
  const bw = ctx.measureText(badge).width + 24;
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.roundRect(W - bw - 24, 30, bw, 32, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(badge, W - bw - 12, 51);

  /* order info */
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText(`Pedido: ${order.orderId}`, 32, 128);

  ctx.fillStyle = '#444444';
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText(`Comprador: ${order.nombre}`, 32, 153);
  ctx.fillText(`Fecha: ${formatDate(order.timestamp)}`, 32, 175);
  ctx.fillText(`Total: ${formatCLP(order.total)}`, 32, 197);

  /* divider */
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 215);
  ctx.lineTo(W - 32, 215);
  ctx.stroke();

  /* section label */
  ctx.fillStyle = '#6b7280';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('CÓDIGOS DE PARTICIPACIÓN', 32, 238);

  /* ticket codes */
  order.ticketCodes.forEach((code, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x   = 32 + col * 340;
    const y   = 252 + row * ROW_H;

    /* pill */
    ctx.fillStyle = '#f0fdf4';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, 310, 34, 8);
    } else {
      ctx.rect(x, y, 310, 34);
    }
    ctx.fill();
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* code text */
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 16px Courier New, monospace';
    ctx.fillText(code, x + 14, y + 22);
  });

  /* footer */
  const footerY = H - 54;
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, footerY, W, 54);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(
    `compratuparcela.cl  •  Generado el ${new Date().toLocaleDateString('es-CL')}`,
    32,
    footerY + 30,
  );

  /* trigger download */
  const link      = document.createElement('a');
  link.download   = `tickets-${order.orderId}.png`;
  link.href       = canvas.toDataURL('image/png');
  link.click();
}

/* ── main component ─────────────────────────────────── */
export default function SuccessClient() {
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [order,   setOrder]   = useState<TicketOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [attempt, setAttempt] = useState(0);

  const fetchOrder = useCallback(async () => {
    if (!token) { setError('No se encontró el token del pago.'); setLoading(false); return; }
    try {
      const res  = await fetch(`/api/tickets?token=${encodeURIComponent(token)}`);
      const data = await res.json() as TicketOrder & { error?: string };
      if (data.error) { setError(data.error); setLoading(false); return; }

      setOrder(data);
      /* if payment still pending and we haven't tried too many times, retry */
      if (data.status !== 'paid' && attempt < 12) {
        setTimeout(() => setAttempt(a => a + 1), 2500);
      } else {
        setLoading(false);
      }
    } catch {
      setError('Error al obtener los tickets. Intenta recargar la página.');
      setLoading(false);
    }
  }, [token, attempt]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  /* ── loading state ── */
  if (loading) {
    return (
      <main className="pt-28 pb-16 flex flex-col items-center justify-center flex-1 min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-semibold">Confirmando tu pago...</p>
        <p className="text-gray-400 text-sm mt-1">Esto puede tardar unos segundos.</p>
      </main>
    );
  }

  /* ── error state ── */
  if (error || !order) {
    return (
      <main className="pt-28 pb-16 flex flex-col items-center justify-center flex-1 min-h-[80vh] px-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-heading font-black text-2xl mb-2 text-center">No pudimos encontrar tu pedido</h1>
        <p className="text-gray-500 text-center max-w-sm mb-6">{error || 'Usa la sección "Ver mis tickets" en la página principal para encontrar tus tickets.'}</p>
        <Link href="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-colors cursor-pointer">
          Volver al inicio
        </Link>
      </main>
    );
  }

  /* ── pending (paid but codes not yet generated) ── */
  if (order.status !== 'paid' || order.ticketCodes.length === 0) {
    return (
      <main className="pt-28 pb-16 flex flex-col items-center justify-center flex-1 min-h-[80vh] px-4">
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-heading font-black text-2xl mb-2">Procesando pago…</h1>
        <p className="text-gray-500 text-center max-w-sm mb-4">
          Tu pago está siendo verificado. Los tickets aparecerán en segundos.
          Puedes buscarlos en "Ver mis tickets" usando tu correo <strong>{order.email}</strong>.
        </p>
        <Link href="/" className="text-sm text-primary font-semibold hover:underline">← Volver al inicio</Link>
      </main>
    );
  }

  /* ── success state ── */
  return (
    <main className="pt-24 pb-16 px-4 max-w-2xl mx-auto w-full">
      {/* success badge */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl mb-2">¡Compra exitosa!</h1>
        <p className="text-gray-500">Tu pago fue procesado. Guarda tus tickets a continuación.</p>
      </div>

      {/* order summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Pedido</p>
            <p className="font-heading font-bold text-lg">{order.orderId}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Total</p>
            <p className="font-bold text-lg text-primary">{formatCLP(order.total)}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 flex-wrap">
          <p className="text-sm text-gray-600"><span className="font-semibold">Comprador:</span> {order.nombre}</p>
          <p className="text-sm text-gray-600"><span className="font-semibold">Fecha:</span> {formatDate(order.timestamp)}</p>
        </div>
      </div>

      {/* tickets grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-lg">Tus tickets de participación</h2>
            <p className="text-sm text-gray-500">{order.ticketCodes.length} código{order.ticketCodes.length !== 1 ? 's' : ''} activos para el sorteo</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
            {order.ticketCodes.length} tickets
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {order.ticketCodes.map(code => (
            <div key={code} className="flex items-center gap-2 bg-[#f0fdf4] border border-[#86efac] rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <span className="font-mono font-bold text-sm text-green-800">{code}</span>
            </div>
          ))}
        </div>
      </div>

      {/* action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => downloadTicketsPNG(order)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-cta hover:opacity-90 text-white font-heading font-bold rounded-xl transition-opacity cursor-pointer shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Guardar tickets (PNG)
        </button>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(`¡Acabo de comprar mi e-book en #QuieroMiParcela! 🌿 Mis tickets: ${order.ticketCodes.join(', ')}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-heading font-bold transition-opacity cursor-pointer shadow-sm text-white hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.527 5.845L.057 23.5l5.797-1.519A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.87 9.87 0 01-5.031-1.372l-.361-.214-3.741.981.997-3.645-.235-.374A9.862 9.862 0 012.1 12C2.1 6.525 6.525 2.1 12 2.1S21.9 6.525 21.9 12 17.475 21.9 12 21.9z"/>
          </svg>
          Compartir por WhatsApp
        </a>
      </div>

      <div className="text-center">
        <Link href="/" className="text-sm text-primary font-semibold hover:underline">← Volver al inicio</Link>
      </div>
    </main>
  );
}
