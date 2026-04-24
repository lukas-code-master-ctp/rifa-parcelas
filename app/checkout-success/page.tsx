import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/">
            <Image src="/Logos/Logo negro.png" alt="CompraTuParcela" width={160} height={40} className="h-9 w-auto" />
          </Link>
        </div>
      </nav>
      <Suspense fallback={<LoadingState />}>
        <SuccessClient />
      </Suspense>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="pt-28 pb-16 flex flex-col items-center justify-center flex-1 min-h-screen">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-semibold">Verificando tu pago...</p>
    </main>
  );
}
