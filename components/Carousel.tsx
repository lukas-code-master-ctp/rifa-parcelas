'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function Carousel({ urls, alt }: { urls: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const images = urls.filter(Boolean);
  if (!images.length) images.push(`https://placehold.co/600x400/e8faf2/23cb69?text=imagen`);

  const goTo = (next: number) => {
    setIdx(next);
    setLoading(true);
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-accent rounded-xl overflow-hidden select-none">

      {/* Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-accent">
          <svg className="w-8 h-8 text-primary animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )}

      <Image
        src={images[idx]}
        alt={`${alt} ${idx + 1}`}
        fill
        className={`object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        unoptimized
        onLoad={() => setLoading(false)}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => goTo((idx - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer z-20 text-lg leading-none"
            aria-label="Anterior"
          >‹</button>
          <button
            onClick={() => goTo((idx + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer z-20 text-lg leading-none"
            aria-label="Siguiente"
          >›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${i === idx ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                aria-label={`Imagen ${i + 1}`}
              />
            ))}
          </div>
          <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-20">
            {idx + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
}
