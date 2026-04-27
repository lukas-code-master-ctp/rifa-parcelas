'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCartStore, formatCLP } from '@/stores/cartStore';

const SIM = process.env.NEXT_PUBLIC_FLOW_SIMULATION === 'true';

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, total, tickets, clear } = useCartStore();
  const [form, setForm]       = useState({ nombre:'', email:'', telefono:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // lock body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.email) { setError('Completa nombre y correo.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, items }) });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.flowUrl) { clear(); window.location.href = data.flowUrl; }
    } catch { setError('Error de conexión. Inténtalo nuevamente.'); }
    finally   { setLoading(false); }
  }

  const modal = (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* sheet on mobile (slides from bottom), centered dialog on desktop */}
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95dvh] overflow-y-auto"
      >
        {/* drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-heading font-bold">Finalizar compra</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {SIM && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Modo simulación — Flow.cl no configurado. El pago se aprobará automáticamente.
          </div>
        )}

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="bg-accent/40 rounded-xl p-4">
            <p className="text-sm font-semibold mb-2">Resumen del pedido</p>
            {items.map(i => (
              <div key={i.id} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{i.titulo} × {i.qty}</span>
                <span className="font-semibold">{formatCLP(i.precio * i.qty)}</span>
              </div>
            ))}
            <div className="border-t border-accent mt-2 pt-2 flex justify-between font-bold">
              <span>Total</span><span className="text-primary">{formatCLP(total())}</span>
            </div>
            <p className="mt-2 text-xs text-primary font-semibold">
              Obtienes {tickets()} participación{tickets() !== 1 ? 'es' : ''} para el sorteo
            </p>
          </div>

          {(['nombre','email'] as const).map(f => (
            <div key={f}>
              <label className="block text-sm font-semibold mb-1">
                {f === 'email' ? 'Correo electrónico' : 'Nombre completo'}
              </label>
              <input
                type={f === 'email' ? 'email' : 'text'} required
                value={form[f]} onChange={e => setForm(p => ({...p,[f]:e.target.value}))}
                placeholder={f === 'email' ? 'juan@email.com' : 'Juan Pérez'}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold mb-1">Teléfono</label>
            <div className="flex">
              <span className="flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-500">+56</span>
              <input type="tel" value={form.telefono}
                onChange={e => setForm(p => ({...p,telefono:e.target.value}))}
                placeholder="9 1234 5678"
                className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-cta hover:bg-cta-dark disabled:opacity-60 text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-lg">
            {loading ? 'Procesando...' : SIM ? 'Simular pago (modo prueba) →' : 'Pagar con Flow.cl →'}
          </button>
          <p className="text-center text-xs text-gray-400 pb-2">Pago seguro procesado por Flow.cl</p>
        </form>
      </div>
    </div>
  );

  // portal to body to escape CartSidebar's CSS transform stacking context
  return mounted ? createPortal(modal, document.body) : null;
}
