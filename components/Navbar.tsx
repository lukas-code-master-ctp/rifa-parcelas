import Image from 'next/image';
import Link from 'next/link';
import CartButton from './CartButton';

export default function Navbar({ whatsapp }: { whatsapp: string }) {
  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex-shrink-0">
          <Image src="/Logos/Logo negro.png" alt="CompraTuParcela" width={160} height={40} className="h-10 w-auto" priority />
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="#parcelas" className="hidden sm:block text-sm font-semibold hover:text-primary transition-colors">
            Conoce las parcelas
          </Link>
          <CartButton />
        </div>
      </div>
    </nav>
  );
}
