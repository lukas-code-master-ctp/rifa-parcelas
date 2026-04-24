import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/"><Image src="/Logos/Logo negro.png" alt="CompraTuParcela" width={160} height={40} className="h-9 w-auto" /></Link>
        </div>
      </nav>
      <main className="pt-24 pb-16 flex flex-col items-center text-center max-w-md w-full">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl mb-3">¡Compra exitosa!</h1>
        <p className="text-gray-500 mb-6">Tu pago fue procesado correctamente. Recibirás un correo con tus e-books y tickets de participación.</p>
        <div className="w-full bg-white rounded-2xl border border-accent shadow-sm p-5 mb-8">
          <p className="text-sm text-gray-500">Tus participaciones están activas. ¡Mucha suerte en el sorteo!</p>
        </div>
        <a href={`https://wa.me/?text=Acabo%20de%20comprar%20mi%20e-book%20en%20%23QuieroMiParcela!`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-bold mb-6" style={{backgroundColor:'#25D366'}}>
          Compartir por WhatsApp
        </a>
        <Link href="/" className="text-sm text-primary font-semibold hover:underline">← Volver al inicio</Link>
      </main>
    </div>
  );
}
