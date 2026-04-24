'use client';
import { useState } from 'react';
import Image from 'next/image';
import ParcelaModal from './ParcelaModal';
import type { Parcela } from '@/types';

export default function ParcelaCard({ parcela, progress }: { parcela: Parcela; progress: number }) {
  const locked = parcela.estado !== 'disponible';
  const [open, setOpen] = useState(false);

  // Mini unlock progress bar
  const milestone = parcela.unlock_milestone;
  const unlockPct = milestone > 0 ? Math.min((progress / milestone) * 100, 100) : 0;
  const remaining = milestone > 0 ? Math.max(milestone - progress, 0) : 0;

  return (
    <>
      <div className={`relative rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-shadow ${locked ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-white'}`}>
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <Image
            src={parcela.imagen_url.split(',')[0].trim() || `https://placehold.co/400x300/e8faf2/23cb69?text=Parcela`}
            alt={parcela.nombre}
            fill
            className={`object-cover ${locked ? 'grayscale opacity-60' : ''}`}
            unoptimized
          />
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <svg className="w-10 h-10 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-white font-heading font-bold text-lg tracking-widest">BLOQUEADA</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-heading font-bold text-base mb-1">{parcela.nombre}</h3>
          <p className="text-sm font-semibold text-primary mb-1">{parcela.proyecto}</p>
          <div className="space-y-0.5 text-xs text-gray-500">
            {parcela.ubicacion && <p><span className="font-semibold">Ubicación:</span> {parcela.ubicacion}</p>}
            {parcela.metraje   && <p><span className="font-semibold">Metraje:</span> {parcela.metraje}</p>}
            {parcela.precio    && <p className="text-primary font-semibold text-sm mt-1">Valuada en {parcela.precio}</p>}
          </div>

          {/* Mini unlock progress bar — solo en bloqueadas con milestone definido */}
          {locked && milestone > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-500">
                  {remaining === 0 ? '¡Lista para desbloquearse!' : `Faltan ${remaining} e-book${remaining !== 1 ? 's' : ''}`}
                </span>
                <span className="text-gray-400">{progress}/{milestone}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${unlockPct}%` }}
                />
              </div>
            </div>
          )}

          {!locked && (
            <button
              onClick={() => setOpen(true)}
              className="mt-3 text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer"
            >
              Ver más →
            </button>
          )}
        </div>
      </div>

      {open && <ParcelaModal parcela={parcela} onClose={() => setOpen(false)} />}
    </>
  );
}
