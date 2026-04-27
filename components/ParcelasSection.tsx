import ParcelaCard from './ParcelaCard';
import type { Parcela } from '@/types';

export default function ParcelasSection({ parcelas, progress, instagramUrl }: { parcelas: Parcela[]; progress: number; instagramUrl: string }) {
  return (
    <section id="parcelas" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-center mb-3">Gana una de estas parcelas</h2>
        <p className="text-center text-gray-500 mb-2">por la compra de tu e-book</p>
        <p className="text-center text-gray-400 text-sm mb-12">
          el sorteo será realizado en vivo desde nuestro{' '}
          {instagramUrl ? (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline">
              Instagram
            </a>
          ) : (
            <span className="text-primary font-semibold">Instagram</span>
          )}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {parcelas.map(p => <ParcelaCard key={p.id} parcela={p} progress={progress} />)}
        </div>
      </div>
    </section>
  );
}
