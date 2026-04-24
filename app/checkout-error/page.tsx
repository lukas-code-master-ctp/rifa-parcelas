import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutError() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/"><Image src="/Logos/Logo negro.png" alt="CompraTuParcela" width={160} height={40} className="h-9 w-auto" /></Link>
        </div>
      </nav>
      <main className="pt-24 pb-16 flex flex-col items-center text-center max-w-md w-full">
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl mb-3">Hubo un problema</h1>
        <p className="text-gray-500 mb-8">El pago no pudo completarse. Tu carrito sigue guardado — puedes intentarlo nuevamente.</p>
        <div className="w-full space-y-3 mb-8">
          <Link href="/#ebooks" className="flex items-center justify-center w-full py-3.5 bg-cta hover:bg-cta-dark text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-lg">
            Intentar nuevamente
          </Link>
        </div>
        <Link href="/" className="text-sm text-primary font-semibold hover:underline">← Volver al inicio</Link>
      </main>
    </div>
  );
}
