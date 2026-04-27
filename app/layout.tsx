import type { Metadata } from 'next';
import { Rubik, Nunito_Sans } from 'next/font/google';
import './globals.css';

const rubik  = Rubik({ subsets: ['latin'], variable: '--font-rubik', weight: ['400','500','600','700','800','900'] });
const nunito = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito', weight: ['300','400','500','600','700'] });

export const metadata: Metadata = {
  title: '#QuieroMiParcela — Compra tu e-book y gana una parcela',
  description: 'Compra nuestros e-books y participa por una de las parcelas que vamos a regalar.',
  icons: { icon: '/Logos/Favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className={`${rubik.variable} ${nunito.variable} bg-white text-black antialiased overflow-x-hidden w-full`}>
        {children}
      </body>
    </html>
  );
}
