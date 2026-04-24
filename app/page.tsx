import { getConfig, getEbooks, getParcelas } from '@/lib/data';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ProgressBar from '@/components/ProgressBar';
import EbooksSection from '@/components/EbooksSection';
import ParcelasSection from '@/components/ParcelasSection';
import CartSidebar from '@/components/CartSidebar';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function Home() {
  const [config, ebooks, parcelas] = await Promise.all([getConfig(), getEbooks(), getParcelas()]);

  return (
    <>
      <Navbar whatsapp={config.whatsapp_number} />
      <main>
        <Hero config={config} />
        <ProgressBar config={config} />
        <EbooksSection ebooks={ebooks} />
        <ParcelasSection parcelas={parcelas} />
      </main>
      <Footer whatsapp={config.whatsapp_number} />
      <CartSidebar />
      <WhatsAppWidget number={config.whatsapp_number} />
    </>
  );
}
