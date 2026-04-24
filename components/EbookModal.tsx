'use client';
import { useEffect } from 'react';
import Carousel from './Carousel';
import { useCartStore, formatCLP } from '@/stores/cartStore';
import type { Ebook } from '@/types';

export default function EbookModal({ ebook, onClose }: { ebook: Ebook; onClose: () => void }) {
  const add = useCartStore(s => s.add);
  const images = ebook.imagen_url.split(',').map(s => s.trim()).filter(Boolean);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg leading-snug pr-4">{ebook.titulo}</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 cursor-pointer text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <Carousel urls={images} alt={ebook.titulo} />

          {/* Price + participaciones */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-heading font-extrabold text-primary">
              {formatCLP(ebook.precio)}
            </span>
            <span className="text-sm bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
              +{ebook.participaciones} participación{ebook.participaciones > 1 ? 'es' : ''}
            </span>
          </div>

          {/* Descripción */}
          {ebook.descripcion && (
            <p className="text-sm text-gray-600 leading-relaxed">{ebook.descripcion}</p>
          )}

          {/* CTA */}
          <button
            onClick={() => { add(ebook); onClose(); }}
            className="w-full py-3 bg-cta hover:bg-cta-dark text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-md"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
