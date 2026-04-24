'use client';
import { useEffect } from 'react';
import Carousel from './Carousel';
import type { Parcela } from '@/types';

export default function ParcelaModal({ parcela, onClose }: { parcela: Parcela; onClose: () => void }) {
  const images = parcela.imagen_url.split(',').map(s => s.trim()).filter(Boolean);

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
          <div className="pr-4">
            <h2 className="font-heading font-bold text-lg leading-snug">{parcela.nombre}</h2>
            {parcela.proyecto && (
              <p className="text-sm font-semibold text-primary mt-0.5">{parcela.proyecto}</p>
            )}
          </div>
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
          <Carousel urls={images} alt={parcela.nombre} />

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2">
            {parcela.ubicacion && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Ubicación</p>
                <p className="text-sm font-semibold">{parcela.ubicacion}</p>
              </div>
            )}
            {parcela.metraje && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Metraje</p>
                <p className="text-sm font-semibold">{parcela.metraje}</p>
              </div>
            )}
            {parcela.precio && (
              <div className="bg-primary/5 rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Valor de la parcela</p>
                <p className="font-heading font-bold text-primary text-xl">{parcela.precio}</p>
              </div>
            )}
          </div>

          {/* Descripción */}
          {parcela.descripcion && (
            <p className="text-sm text-gray-600 leading-relaxed">{parcela.descripcion}</p>
          )}
        </div>
      </div>
    </div>
  );
}
