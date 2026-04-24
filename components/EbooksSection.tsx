import EbookCard from './EbookCard';
import type { Ebook } from '@/types';

export default function EbooksSection({ ebooks }: { ebooks: Ebook[] }) {
  return (
    <section id="ebooks" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-center mb-12">Compra tu e-book</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {ebooks.map(e => <EbookCard key={e.id} ebook={e} />)}
        </div>
      </div>
    </section>
  );
}
