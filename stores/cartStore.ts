import { create } from 'zustand';
import type { CartItem, Ebook } from '@/types';

interface CartStore {
  open:      boolean;
  items:     CartItem[];
  setOpen:   (v: boolean) => void;
  add:       (ebook: Ebook) => void;
  remove:    (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clear:     () => void;
  total:     () => number;
  tickets:   () => number;
  count:     () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  open:    false,
  items:   [],
  setOpen: (v) => set({ open: v }),

  add: (ebook) => {
    const items    = get().items;
    const existing = items.find(i => i.id === ebook.id);
    if (existing) {
      set({ items: items.map(i => i.id === ebook.id ? { ...i, qty: i.qty + 1 } : i), open: true });
    } else {
      set({ items: [...items, { ...ebook, qty: 1 }], open: true });
    }
  },

  remove:    (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
  increment: (id) => set(s => ({ items: s.items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i) })),
  decrement: (id) => set(s => ({
    items: s.items
      .map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
      .filter(i => i.qty > 0),
  })),
  clear: () => set({ items: [] }),

  total:   () => get().items.reduce((s, i) => s + i.precio  * i.qty, 0),
  tickets: () => get().items.reduce((s, i) => s + i.participaciones * i.qty, 0),
  count:   () => get().items.reduce((s, i) => s + i.qty, 0),
}));

export const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
