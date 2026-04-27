import Image from 'next/image';
import Countdown from './Countdown';
import type { SiteConfig } from '@/types';

export default function Hero({ config }: { config: SiteConfig }) {
  return (
    <section
      className="relative overflow-hidden py-14 sm:py-20 px-4"
      style={{ background: 'linear-gradient(135deg,#e8faf2 0%,#fff 60%,#f5fff9 100%)' }}
    >
      {/* ── Left trees ───────────────────────────────────── */}
      <div className="pointer-events-none select-none absolute bottom-0 left-0 items-end hidden sm:flex">
        <Image src="/background/16.png" alt="" width={90}  height={130} className="opacity-50 -translate-x-6 translate-y-2" unoptimized />
        <Image src="/background/17.png" alt="" width={130} height={185} className="opacity-65 -translate-x-2" unoptimized />
        <Image src="/background/15.png" alt="" width={100} height={145} className="opacity-55 translate-y-4" unoptimized />
      </div>

      {/* ── Right trees ──────────────────────────────────── */}
      <div className="pointer-events-none select-none absolute bottom-0 right-0 flex items-end hidden sm:flex">
        <Image src="/background/15.png" alt="" width={100} height={145} className="opacity-55 translate-y-4" unoptimized />
        <Image src="/background/17.png" alt="" width={130} height={185} className="opacity-65 translate-x-2" unoptimized />
        <Image src="/background/16.png" alt="" width={90}  height={130} className="opacity-50 translate-x-6 translate-y-2" unoptimized />
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-primary leading-tight">
            #QuieroMiParcela
          </h1>
          <p className="text-lg sm:text-xl text-black/80 leading-relaxed">
            Compra nuestro e-book y participa por una de las
          </p>
          <div className="flex items-center gap-3">
            <span className="font-heading font-black text-6xl sm:text-7xl text-black">{config.sorteo_parcelas}</span>
            <span className="text-2xl sm:text-3xl font-heading font-bold">Parcelas a regalar</span>
          </div>
          <a href="#ebooks" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-heading font-bold rounded-full hover:bg-secondary transition-all shadow-lg shadow-primary/30 text-base cursor-pointer">
            Compra Tu e-book
          </a>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-accent shadow-xl relative">
            {config.hero_imagen_url ? (
              <Image src={config.hero_imagen_url} alt="Parcela" fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-accent to-primary/20">
                <svg className="w-20 h-20 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span className="text-primary/40 text-sm font-semibold mt-2">Foto de la parcela</span>
              </div>
            )}
          </div>
          <Countdown target={config.countdown_datetime} instagramUrl={config.instagram_url} />
        </div>
      </div>
    </section>
  );
}
