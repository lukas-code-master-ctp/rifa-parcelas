import Image from 'next/image';

export default function Footer({ whatsapp }: { whatsapp: string }) {
  return (
    <footer className="bg-black text-white py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <Image src="/Logos/Logo blanco.png" alt="CompraTuParcela" width={160} height={40} className="h-9 w-auto mb-3" />
          <p className="text-xs text-white/50">© {new Date().getFullYear()} CompraTuParcela. Todos los derechos reservados.</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm text-white/60">
          <a href="#ebooks" className="hover:text-white transition-colors">Comprar e-books</a>
          <a href="#parcelas" className="hover:text-white transition-colors">Las parcelas</a>
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
