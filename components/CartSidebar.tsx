'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCartStore, formatCLP } from '@/stores/cartStore';
import CheckoutModal from './CheckoutModal';

export default function CartSidebar() {
  const { open, setOpen, items, remove, increment, decrement, total, tickets } = useCartStore();
  const [checkout, setCheckout] = useState(false);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-heading font-bold">Tu carrito</h2>
          <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-gray-400">Tu carrito está vacío</p>
            <button onClick={() => { setOpen(false); document.getElementById('ebooks')?.scrollIntoView({behavior:'smooth'}); }}
              className="mt-2 px-5 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-secondary transition-colors cursor-pointer">
              Ver e-books
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 bg-accent/30 rounded-xl p-3">
                  <div className="w-14 h-14 rounded-lg bg-accent flex-shrink-0 overflow-hidden relative">
                    <Image src={item.imagen_url || `https://placehold.co/56x56/e8faf2/23cb69?text=e`} alt={item.titulo} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-2">{item.titulo}</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">+{item.participaciones} participación{item.participaciones > 1 ? 'es' : ''}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => decrement(item.id)} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm font-bold">−</button>
                        <span className="px-2 text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => increment(item.id)} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm font-bold">+</button>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatCLP(item.precio * item.qty)}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(item.id)} className="self-start p-1 text-gray-300 hover:text-red-400 cursor-pointer">✕</button>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Participaciones:</span>
                <span className="font-bold text-primary">{tickets()} 🎟️</span>
              </div>
              <div className="flex justify-between font-heading font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatCLP(total())}</span>
              </div>
              <button onClick={() => { setOpen(false); setCheckout(true); }}
                className="w-full py-3 bg-cta hover:bg-cta-dark text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-lg">
                Ir al pago →
              </button>
            </div>
          </>
        )}
      </aside>
      {checkout && <CheckoutModal onClose={() => setCheckout(false)} />}
    </>
  );
}
