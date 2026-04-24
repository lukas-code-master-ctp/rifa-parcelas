'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCartStore, formatCLP } from '@/stores/cartStore';
import EbookModal from './EbookModal';
import type { Ebook } from '@/types';

export default function EbookCard({ ebook }: { ebook: Ebook }) {
  const add = useCartStore(s => s.add);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow flex flex-col ${ebook.best_seller ? 'best-seller-card' : ''}`}>
        {ebook.best_seller && (
          <div className="absolute top-3 right-3 z-10 bg-black text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            Best seller
          </div>
        )}
        <div className="w-full aspect-[4/3] bg-accent/50 overflow-hidden relative">
          <Image
            src={ebook.imagen_url.split(',')[0].trim() || `https://placehold.co/400x300/e8faf2/23cb69?text=e-book`}
            alt={ebook.titulo}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-heading font-bold text-lg leading-snug mb-2">{ebook.titulo}</h3>
          <p className="text-sm text-gray-500 flex-1 mb-4 line-clamp-3">{ebook.descripcion}</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-heading font-extrabold text-primary">{formatCLP(ebook.precio)}</span>
            <span className="text-xs text-primary font-semibold">+ {ebook.participaciones} participación{ebook.participaciones > 1 ? 'es' : ''}</span>
          </div>
          <button
            onClick={() => add(ebook)}
            className="w-full py-3 bg-cta hover:bg-cta-dark text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-md"
          >
            Comprar ahora
          </button>
          <button
            onClick={() => setOpen(true)}
            className="mt-2 text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer text-left"
          >
            Ver más →
          </button>
        </div>
      </div>

      {open && <EbookModal ebook={ebook} onClose={() => setOpen(false)} />}
    </>
  );
}
