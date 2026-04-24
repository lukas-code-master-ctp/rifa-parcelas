'use client';
import { useState } from 'react';
import { useCartStore, formatCLP } from '@/stores/cartStore';

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, total, tickets, clear } = useCartStore();
  const [form, setForm]     = useState({ nombre:'', email:'', telefono:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.email) { setError('Completa nombre y correo.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, items: items }) });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.flowUrl) { clear(); window.location.href = data.flowUrl; }
    } catch { setError('Error de conexión. Inténtalo nuevamente.'); }
    finally   { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-heading font-bold">Finalizar compra</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">✕</button>
        </div>
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
            <p className="mt-2 text-xs text-primary font-semibold">Obtienes {tickets()} participación{tickets() !== 1 ? 'es' : ''} para el sorteo</p>
          </div>
          {(['nombre','email'] as const).map(f => (
            <div key={f}>
              <label className="block text-sm font-semibold mb-1 capitalize">{f === 'email' ? 'Correo electrónico' : 'Nombre completo'}</label>
              <input type={f === 'email' ? 'email' : 'text'} required value={form[f]} onChange={e => setForm(p => ({...p,[f]:e.target.value}))}
                placeholder={f === 'email' ? 'juan@email.com' : 'Juan Pérez'}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold mb-1">Teléfono</label>
            <div className="flex">
              <span className="flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-500">+56</span>
              <input type="tel" value={form.telefono} onChange={e => setForm(p => ({...p,telefono:e.target.value}))} placeholder="9 1234 5678"
                className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-cta hover:bg-cta-dark disabled:opacity-60 text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-lg">
            {loading ? 'Procesando...' : 'Pagar con Flow.cl →'}
          </button>
          <p className="text-center text-xs text-gray-400">Pago seguro procesado por Flow.cl</p>
        </form>
      </div>
    </div>
  );
}
