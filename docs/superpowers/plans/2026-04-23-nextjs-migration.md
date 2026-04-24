# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar la landing page de QuieroMiParcela de HTML estático + Google Apps Script a Next.js 14 con App Router, googleapis directo con Service Account, y caché de módulo para eliminar cold starts.

**Architecture:** Server Components hacen el fetch a Google Sheets en el servidor con `React.cache()` + revalidate de 30s — ningún cliente toca Sheets directamente. El carrito y el checkout modal son Client Components con estado Zustand. Las mutaciones (crear orden, webhook Flow.cl) van por API Routes con firma HMAC.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, googleapis v6, Flow.cl REST API.

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies |
| `next.config.ts` | Image domains, env validation |
| `tailwind.config.ts` | Custom palette #000/#fff/#23cb69 |
| `tsconfig.json` | TypeScript paths |
| `app/layout.tsx` | Root layout, fonts, metadata |
| `app/page.tsx` | Landing page — Server Component, composes sections |
| `app/globals.css` | Animations: progress fill, WA pulse, golden glow |
| `app/checkout-success/page.tsx` | Post-payment success page |
| `app/checkout-error/page.tsx` | Post-payment error page |
| `app/api/config/route.ts` | GET config from Sheet (revalidate 30s) |
| `app/api/ebooks/route.ts` | GET ebooks from Sheet (revalidate 30s) |
| `app/api/parcelas/route.ts` | GET parcelas from Sheet (revalidate 30s) |
| `app/api/order/route.ts` | POST create order → Flow.cl |
| `app/api/flow-webhook/route.ts` | POST Flow.cl webhook → update Sheet |
| `lib/sheets.ts` | googleapis client singleton + `readSheet()` |
| `lib/flow.ts` | Flow.cl `createPayment()` + `confirmPayment()` + HMAC sign |
| `lib/data.ts` | `getConfig()`, `getEbooks()`, `getParcelas()` with React.cache() |
| `types/index.ts` | Shared TS types: SiteConfig, Ebook, Parcela, OrderItem |
| `stores/cartStore.ts` | Zustand store: items, open, add/remove/increment/decrement |
| `components/Navbar.tsx` | Sticky navbar — logo + CartButton |
| `components/CartButton.tsx` | Client Component — reads Zustand, opens sidebar |
| `components/CartSidebar.tsx` | Client Component — drawer, item list, checkout trigger |
| `components/CheckoutModal.tsx` | Client Component — form + POST /api/order |
| `components/Hero.tsx` | Hero section — receives siteConfig as props |
| `components/Countdown.tsx` | `'use client'` — live countdown from target date |
| `components/ProgressBar.tsx` | Animated bar + milestone ticks |
| `components/EbooksSection.tsx` | Grid of EbookCard |
| `components/EbookCard.tsx` | Client Component — "Comprar ahora" → Zustand |
| `components/ParcelasSection.tsx` | Grid of ParcelaCard |
| `components/ParcelaCard.tsx` | Server Component — disponible vs bloqueada |
| `components/WhatsAppWidget.tsx` | Fixed floating WA button |
| `components/Footer.tsx` | Footer with logos |
| `.env.local.example` | Template for env vars |

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `app/globals.css`
- Create: `.env.local.example`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "rifa-parcelas",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "googleapis": "^140.0.0",
    "zustand": "^4.5.2",
    "crypto-js": "^4.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/crypto-js": "^4.2.2",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd "C:\Users\lukas\Desktop\Claude_Code\rifa parcelas"
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
    ],
  },
};

export default config;
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#23cb69',
        secondary:  '#1aaa55',
        cta:        '#000000',
        'cta-dark': '#222222',
        accent:     '#e8faf2',
        'text-dark':'#000000',
      },
      fontFamily: {
        heading: ['var(--font-rubik)', 'sans-serif'],
        body:    ['var(--font-nunito)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes progressFill {
  from { width: 0%; }
}
.progress-bar { animation: progressFill 1.2s cubic-bezier(0.4,0,0.2,1) forwards; }

@keyframes waPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.5); }
  50%      { box-shadow: 0 0 0 12px rgba(37,211,102,0); }
}
.wa-pulse { animation: waPulse 2s ease-in-out infinite; }

@keyframes goldenPulse {
  0%,100% { box-shadow: 0 0 18px 4px rgba(212,175,55,0.45), 0 0 40px 8px rgba(212,175,55,0.18); }
  50%     { box-shadow: 0 0 28px 8px rgba(212,175,55,0.65), 0 0 60px 16px rgba(212,175,55,0.28); }
}
.best-seller-card {
  border: 1.5px solid #d4af37 !important;
  animation: goldenPulse 2.8s ease-in-out infinite;
  transform: scale(1.03);
}

html { scroll-behavior: smooth; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 7: Create `postcss.config.js`**

```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 8: Create `.env.local.example`**

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-cuenta@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID=10e1poh1J3NAUnadaiccTwcNKo5htSW4Vz0m6RU_FTx0

FLOW_API_KEY=
FLOW_SECRET_KEY=
FLOW_API_URL=https://sandbox.flow.cl/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 9: Copy `.env.local.example` to `.env.local` y rellenar credenciales**

- [ ] **Step 10: Verificar que Next.js arranca**

```bash
npm run dev
```
Expected: `ready - started server on 0.0.0.0:3000`

---

## Task 2: TypeScript types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create `types/index.ts`**

```ts
export interface SiteConfig {
  countdown_datetime: string;
  progress_current:   number;
  progress_goal:      number;
  whatsapp_number:    string;
  sorteo_parcelas:    number;
  milestone_1:        number;
  milestone_2:        number;
  milestone_3:        number;
  milestone_4:        number;
  hero_imagen_url:    string;
}

export interface Ebook {
  id:              string;
  titulo:          string;
  descripcion:     string;
  precio:          number;
  participaciones: number;
  imagen_url:      string;
  best_seller:     boolean;
}

export interface Parcela {
  id:          string;
  nombre:      string;
  proyecto:    string;
  ubicacion:   string;
  metraje:     string;
  precio:      string;
  estado:      'disponible' | 'bloqueada';
  imagen_url:  string;
  ver_mas_url: string;
}

export interface OrderItem {
  id:              string;
  titulo:          string;
  precio:          number;
  participaciones: number;
  qty:             number;
}

export interface CartItem extends OrderItem {}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Google Sheets client

**Files:**
- Create: `lib/sheets.ts`

- [ ] **Step 1: Create `lib/sheets.ts`**

```ts
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

export async function readSheet(range: string): Promise<string[][]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return (res.data.values ?? []) as string[][];
}

export async function appendRow(range: string, values: unknown[]): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

export async function updateCell(range: string, value: string): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets.ts
git commit -m "feat: add Google Sheets client with service account"
```

---

## Task 4: Cached data fetchers

**Files:**
- Create: `lib/data.ts`

- [ ] **Step 1: Create `lib/data.ts`**

```ts
import { cache } from 'react';
import { readSheet } from './sheets';
import type { SiteConfig, Ebook, Parcela } from '@/types';

// Module-level cache with 30s TTL
let configCache: { data: SiteConfig; ts: number } | null = null;
let ebooksCache: { data: Ebook[]; ts: number }         | null = null;
let parcelasCache: { data: Parcela[]; ts: number }     | null = null;
const TTL = 30_000;

export const getConfig = cache(async (): Promise<SiteConfig> => {
  if (configCache && Date.now() - configCache.ts < TTL) return configCache.data;

  const rows = await readSheet('Config!A:B');
  const map: Record<string, string> = {};
  rows.forEach(([k, v]) => { if (k) map[k.trim()] = String(v ?? ''); });

  const data: SiteConfig = {
    countdown_datetime: map.countdown_datetime ?? '',
    progress_current:   Number(map.progress_current  ?? 0),
    progress_goal:      Number(map.progress_goal     ?? 200),
    whatsapp_number:    map.whatsapp_number           ?? '',
    sorteo_parcelas:    Number(map.sorteo_parcelas    ?? 3),
    milestone_1:        Number(map.milestone_1        ?? 50),
    milestone_2:        Number(map.milestone_2        ?? 100),
    milestone_3:        Number(map.milestone_3        ?? 150),
    milestone_4:        Number(map.milestone_4        ?? 200),
    hero_imagen_url:    map.hero_imagen_url            ?? '',
  };

  configCache = { data, ts: Date.now() };
  return data;
});

export const getEbooks = cache(async (): Promise<Ebook[]> => {
  if (ebooksCache && Date.now() - ebooksCache.ts < TTL) return ebooksCache.data;

  const rows = await readSheet('Ebooks!A:H');
  if (rows.length < 2) return [];
  const [, ...data] = rows;

  const ebooks = data
    .filter(r => r[6]?.toUpperCase() === 'TRUE')
    .map(r => ({
      id:              r[0] ?? '',
      titulo:          r[1] ?? '',
      descripcion:     r[2] ?? '',
      precio:          Number(r[3] ?? 0),
      participaciones: Number(r[4] ?? 1),
      imagen_url:      r[5] ?? '',
      best_seller:     r[7]?.toUpperCase() === 'TRUE',
    }));

  ebooksCache = { data: ebooks, ts: Date.now() };
  return ebooks;
});

export const getParcelas = cache(async (): Promise<Parcela[]> => {
  if (parcelasCache && Date.now() - parcelasCache.ts < TTL) return parcelasCache.data;

  const rows = await readSheet('Parcelas!A:I');
  if (rows.length < 2) return [];
  const [, ...data] = rows;

  const parcelas = data.map(r => ({
    id:          r[0] ?? '',
    nombre:      r[1] ?? '',
    proyecto:    r[2] ?? '',
    ubicacion:   r[3] ?? '',
    metraje:     r[4] ?? '',
    precio:      r[5] ?? '',
    estado:      (r[6]?.toLowerCase() ?? 'bloqueada') as 'disponible' | 'bloqueada',
    imagen_url:  r[7] ?? '',
    ver_mas_url: r[8] ?? '',
  }));

  parcelasCache = { data: parcelas, ts: Date.now() };
  return parcelas;
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/data.ts
git commit -m "feat: add cached data fetchers with 30s TTL"
```

---

## Task 5: Flow.cl integration

**Files:**
- Create: `lib/flow.ts`

- [ ] **Step 1: Create `lib/flow.ts`**

```ts
import CryptoJS from 'crypto-js';

const API_URL    = process.env.FLOW_API_URL    ?? 'https://sandbox.flow.cl/api';
const API_KEY    = process.env.FLOW_API_KEY    ?? '';
const SECRET_KEY = process.env.FLOW_SECRET_KEY ?? '';

function sign(params: Record<string, string>): string {
  const concat = Object.keys(params).sort().map(k => k + params[k]).join('');
  return CryptoJS.HmacSHA256(concat, SECRET_KEY).toString();
}

export async function createPayment(opts: {
  orderId:  string;
  amount:   number;
  email:    string;
  subject:  string;
}): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  const params: Record<string, string> = {
    apiKey:          API_KEY,
    commerceOrder:   opts.orderId,
    subject:         opts.subject,
    currency:        'CLP',
    amount:          String(opts.amount),
    email:           opts.email,
    urlConfirmation: `${siteUrl}/api/flow-webhook`,
    urlReturn:       `${siteUrl}/checkout-success`,
    paymentMethod:   '9',
  };
  params.s = sign(params);

  const body = new URLSearchParams(params);
  const res  = await fetch(`${API_URL}/payment/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });

  const data = await res.json();
  if (!data.url || !data.token) throw new Error(`Flow error: ${JSON.stringify(data)}`);
  return `${data.url}?token=${data.token}`;
}

export async function getPaymentStatus(token: string): Promise<{ status: number; commerceOrder: string }> {
  const params: Record<string, string> = { apiKey: API_KEY, token };
  params.s = sign(params);
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/payment/getStatus?${qs}`);
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/flow.ts
git commit -m "feat: add Flow.cl payment integration"
```

---

## Task 6: API Routes

**Files:**
- Create: `app/api/config/route.ts`
- Create: `app/api/ebooks/route.ts`
- Create: `app/api/parcelas/route.ts`
- Create: `app/api/order/route.ts`
- Create: `app/api/flow-webhook/route.ts`

- [ ] **Step 1: Create `app/api/config/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/data';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getConfig();
    return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=30' } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/ebooks/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getEbooks } from '@/lib/data';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getEbooks();
    return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=30' } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create `app/api/parcelas/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getParcelas } from '@/lib/data';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getParcelas();
    return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=30' } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create `app/api/order/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { appendRow } from '@/lib/sheets';
import { createPayment } from '@/lib/flow';
import type { OrderItem } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, telefono, items } = await req.json() as {
      nombre: string; email: string; telefono: string; items: OrderItem[];
    };

    if (!nombre || !email || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const total   = items.reduce((s, i) => s + i.precio * i.qty, 0);
    const tickets = items.reduce((s, i) => s + i.participaciones * i.qty, 0);
    const orderId = `ORD-${Date.now()}`;

    await appendRow('Pedidos!A:I', [
      new Date().toISOString(), nombre, email, telefono ?? '',
      JSON.stringify(items), total, tickets, 'pending', orderId,
    ]);

    const flowUrl = await createPayment({
      orderId, amount: total, email,
      subject: 'Compra e-book QuieroMiParcela',
    });

    return NextResponse.json({ success: true, flowUrl, orderId, total, tickets });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create `app/api/flow-webhook/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/flow';
import { readSheet, updateCell } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    const body  = await req.formData();
    const token = body.get('token') as string;
    if (!token) return NextResponse.json({ error: 'no token' }, { status: 400 });

    const result = await getPaymentStatus(token);

    if (result.status === 2) {
      // Find order row and mark paid
      const rows = await readSheet('Pedidos!A:I');
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][8] === result.commerceOrder) {
          await updateCell(`Pedidos!H${i + 1}`, 'paid');
          // Increment progress_current
          const config = await readSheet('Config!A:B');
          for (let j = 0; j < config.length; j++) {
            if (config[j][0]?.trim() === 'progress_current') {
              const next = Number(config[j][1] ?? 0) + 1;
              await updateCell(`Config!B${j + 1}`, String(next));
              break;
            }
          }
          break;
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for config, ebooks, parcelas, order, flow-webhook"
```

---

## Task 7: Zustand cart store

**Files:**
- Create: `stores/cartStore.ts`

- [ ] **Step 1: Create `stores/cartStore.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add stores/cartStore.ts
git commit -m "feat: add Zustand cart store"
```

---

## Task 8: Root layout + static components

**Files:**
- Create: `app/layout.tsx`
- Create: `components/Navbar.tsx`
- Create: `components/CartButton.tsx`
- Create: `components/Footer.tsx`
- Create: `components/WhatsAppWidget.tsx`

- [ ] **Step 1: Create `app/layout.tsx`**

```tsx
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
    <html lang="es">
      <body className={`${rubik.variable} ${nunito.variable} bg-white text-black antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create `components/CartButton.tsx`**

```tsx
'use client';
import { useCartStore } from '@/stores/cartStore';

export default function CartButton() {
  const { setOpen, count } = useCartStore();
  return (
    <button onClick={() => setOpen(true)} className="relative p-2 rounded-full hover:bg-accent transition-colors cursor-pointer" aria-label="Abrir carrito">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
      {count() > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
          {count()}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Create `components/Navbar.tsx`**

```tsx
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
```

- [ ] **Step 4: Create `components/Footer.tsx`**

```tsx
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
```

- [ ] **Step 5: Create `components/WhatsAppWidget.tsx`**

```tsx
export default function WhatsAppWidget({ number }: { number: string }) {
  return (
    <a
      href={`https://wa.me/${number}?text=Hola!%20Tengo%20una%20consulta%20sobre%20los%20e-books.`}
      target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-xl cursor-pointer wa-pulse group"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Contactar por WhatsApp"
    >
      <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span className="absolute right-16 bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        ¿Tienes dudas? ¡Escríbenos!
      </span>
    </a>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx components/Navbar.tsx components/CartButton.tsx components/Footer.tsx components/WhatsAppWidget.tsx
git commit -m "feat: add layout, navbar, footer, whatsapp widget"
```

---

## Task 9: Hero, Countdown y ProgressBar

**Files:**
- Create: `components/Countdown.tsx`
- Create: `components/Hero.tsx`
- Create: `components/ProgressBar.tsx`

- [ ] **Step 1: Create `components/Countdown.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';

function pad(n: number) { return String(Math.floor(n)).padStart(2, '0'); }

export default function Countdown({ target }: { target: string }) {
  const [time, setTime] = useState({ days:'00', hours:'00', minutes:'00', seconds:'00' });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setTime({ days:'00', hours:'00', minutes:'00', seconds:'00' }); return; }
      setTime({
        days:    pad(diff / 86400000),
        hours:   pad((diff % 86400000) / 3600000),
        minutes: pad((diff % 3600000)  / 60000),
        seconds: pad((diff % 60000)    / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="w-full bg-white rounded-2xl shadow-md border border-accent px-5 py-4">
      <p className="text-center text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Cuenta regresiva al sorteo</p>
      <div className="grid grid-cols-4 gap-2 text-center pr-12 sm:pr-0">
        {[['days','días'],['hours','horas'],['minutes','min'],['seconds','seg']].map(([k,label]) => (
          <div key={k} className="bg-primary/10 rounded-xl py-3">
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-primary tabular-nums">{time[k as keyof typeof time]}</span>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/Hero.tsx`**

```tsx
import Image from 'next/image';
import Countdown from './Countdown';
import type { SiteConfig } from '@/types';

export default function Hero({ config }: { config: SiteConfig }) {
  return (
    <section className="py-14 sm:py-20 px-4" style={{ background: 'linear-gradient(135deg,#e8faf2 0%,#fff 60%,#f5fff9 100%)' }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-primary leading-tight">
            #QuieroMiParcela
          </h1>
          <p className="text-lg sm:text-xl text-black/80 leading-relaxed">
            Compra nuestro e-book y participa por una de las
          </p>
          <div className="flex items-center gap-3">
            <span className="font-heading font-black text-6xl sm:text-7xl text-black">{config.sorteo_parcelas}</span>
            <span className="text-2xl sm:text-3xl font-heading font-bold">Parcelas a regalar</span>
          </div>
          <a href="#ebooks" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-heading font-bold rounded-full hover:bg-secondary transition-all shadow-lg shadow-primary/30 text-base cursor-pointer">
            Compra Tu e-book
          </a>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-accent shadow-xl">
            {config.hero_imagen_url ? (
              <Image src={config.hero_imagen_url} alt="Parcela" fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-accent to-primary/20">
                <svg className="w-20 h-20 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span className="text-primary/40 text-sm font-semibold mt-2">Foto de la parcela</span>
              </div>
            )}
          </div>
          <Countdown target={config.countdown_datetime} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/ProgressBar.tsx`**

```tsx
import type { SiteConfig } from '@/types';

export default function ProgressBar({ config }: { config: SiteConfig }) {
  const goal       = config.progress_goal || 200;
  const current    = config.progress_current || 0;
  const pct        = Math.min((current / goal) * 100, 100);
  const milestones = [config.milestone_1, config.milestone_2, config.milestone_3, config.milestone_4].filter(Boolean);

  return (
    <section className="bg-white py-10 px-4 border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-base sm:text-lg text-black/70 mb-6">
          Mientras más e-books sean vendidos, más parcelas regalaremos
        </p>
        <div className="relative pt-7">
          {milestones.map((ms, i) => {
            const left = (ms / goal) * 100;
            return (
              <span key={i}
                className={`absolute top-0 -translate-x-1/2 text-xs font-semibold whitespace-nowrap ${pct >= left ? 'text-primary' : 'text-gray-400'}`}
                style={{ left: `${left}%` }}>
                +1 parcela
              </span>
            );
          })}
          <div className="relative h-6 bg-gray-100 rounded-full overflow-visible shadow-inner">
            <div className="progress-bar absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${pct}%` }} />
            {milestones.map((ms, i) => {
              const left = (ms / goal) * 100;
              return (
                <div key={i} className={`milestone-tick ${pct >= left ? 'passed' : ''}`} style={{ position:'absolute', top:'50%', left:`${left}%`, transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', border:`2px solid #23cb69`, background: pct >= left ? '#23cb69' : '#fff', zIndex:2 }} />
              );
            })}
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="font-semibold text-primary">{current} e-books vendidos</span>
            <span className="text-gray-400">Meta: {goal}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/Countdown.tsx components/Hero.tsx components/ProgressBar.tsx
git commit -m "feat: add Hero, Countdown and ProgressBar components"
```

---

## Task 10: Ebooks section

**Files:**
- Create: `components/EbookCard.tsx`
- Create: `components/EbooksSection.tsx`

- [ ] **Step 1: Create `components/EbookCard.tsx`**

```tsx
'use client';
import Image from 'next/image';
import { useCartStore, formatCLP } from '@/stores/cartStore';
import type { Ebook } from '@/types';

export default function EbookCard({ ebook }: { ebook: Ebook }) {
  const add = useCartStore(s => s.add);
  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow flex flex-col ${ebook.best_seller ? 'best-seller-card' : ''}`}>
      {ebook.best_seller && (
        <div className="absolute top-3 right-3 z-10 bg-black text-white text-xs font-bold px-3 py-1 rounded-full shadow">Best seller</div>
      )}
      <div className="w-full aspect-[4/3] bg-accent/50 overflow-hidden relative">
        <Image src={ebook.imagen_url || `https://placehold.co/400x300/e8faf2/23cb69?text=e-book`} alt={ebook.titulo} fill className="object-cover" unoptimized />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-lg leading-snug mb-2">{ebook.titulo}</h3>
        <p className="text-sm text-gray-500 flex-1 mb-4">{ebook.descripcion}</p>
        <span className="text-2xl font-heading font-extrabold text-primary mb-3">{formatCLP(ebook.precio)}</span>
        <button onClick={() => add(ebook)} className="w-full py-3 bg-cta hover:bg-cta-dark text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-md">
          Comprar ahora
        </button>
        <p className="text-center text-xs text-primary font-semibold mt-2">
          + {ebook.participaciones} participación{ebook.participaciones > 1 ? 'es' : ''}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/EbooksSection.tsx`**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add components/EbookCard.tsx components/EbooksSection.tsx
git commit -m "feat: add EbooksSection with cart integration"
```

---

## Task 11: Parcelas section

**Files:**
- Create: `components/ParcelaCard.tsx`
- Create: `components/ParcelasSection.tsx`

- [ ] **Step 1: Create `components/ParcelaCard.tsx`**

```tsx
import Image from 'next/image';
import type { Parcela } from '@/types';

export default function ParcelaCard({ parcela }: { parcela: Parcela }) {
  const locked = parcela.estado !== 'disponible';
  return (
    <div className={`relative rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-shadow ${locked ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-white'}`}>
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <Image src={parcela.imagen_url || `https://placehold.co/400x300/e8faf2/23cb69?text=Parcela`} alt={parcela.nombre} fill className={`object-cover ${locked ? 'grayscale opacity-60' : ''}`} unoptimized />
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <svg className="w-10 h-10 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
            </svg>
            <span className="text-white font-heading font-bold text-lg tracking-widest">BLOQUEADA</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-base mb-1">{parcela.nombre}</h3>
        <p className="text-sm font-semibold text-primary mb-1">{parcela.proyecto}</p>
        <div className="space-y-0.5 text-xs text-gray-500">
          {parcela.ubicacion && <p><span className="font-semibold">Ubicación:</span> {parcela.ubicacion}</p>}
          {parcela.metraje   && <p><span className="font-semibold">Metraje:</span> {parcela.metraje}</p>}
          {parcela.precio    && <p className="text-primary font-semibold text-sm mt-1">Parcela valuada en {parcela.precio}</p>}
        </div>
        {!locked && parcela.ver_mas_url && (
          <a href={parcela.ver_mas_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer">
            Ver más →
          </a>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/ParcelasSection.tsx`**

```tsx
import ParcelaCard from './ParcelaCard';
import type { Parcela } from '@/types';

export default function ParcelasSection({ parcelas }: { parcelas: Parcela[] }) {
  return (
    <section id="parcelas" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-center mb-3">Gana una de estas parcelas</h2>
        <p className="text-center text-gray-500 mb-12">por la compra de tu e-book</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {parcelas.map(p => <ParcelaCard key={p.id} parcela={p} />)}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ParcelaCard.tsx components/ParcelasSection.tsx
git commit -m "feat: add ParcelasSection with lock overlay"
```

---

## Task 12: Cart Sidebar + Checkout Modal

**Files:**
- Create: `components/CartSidebar.tsx`
- Create: `components/CheckoutModal.tsx`

- [ ] **Step 1: Create `components/CheckoutModal.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useCartStore, formatCLP } from '@/stores/cartStore';

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, total, tickets, clear } = useCartStore();
  const [form, setForm]     = useState({ nombre:'', email:'', telefono:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.email) { setError('Completa nombre y correo.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, items: items() }) });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.flowUrl) { clear(); window.location.href = data.flowUrl; }
    } catch { setError('Error de conexión. Inténtalo nuevamente.'); }
    finally   { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-heading font-bold">Finalizar compra</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">✕</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="bg-accent/40 rounded-xl p-4">
            <p className="text-sm font-semibold mb-2">Resumen del pedido</p>
            {items().map(i => (
              <div key={i.id} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{i.titulo} × {i.qty}</span>
                <span className="font-semibold">{formatCLP(i.precio * i.qty)}</span>
              </div>
            ))}
            <div className="border-t border-accent mt-2 pt-2 flex justify-between font-bold">
              <span>Total</span><span className="text-primary">{formatCLP(total())}</span>
            </div>
            <p className="mt-2 text-xs text-primary font-semibold">Obtienes {tickets()} participación{tickets() !== 1 ? 'es' : ''} para el sorteo</p>
          </div>
          {(['nombre','email'] as const).map(f => (
            <div key={f}>
              <label className="block text-sm font-semibold mb-1 capitalize">{f === 'email' ? 'Correo electrónico' : 'Nombre completo'}</label>
              <input type={f === 'email' ? 'email' : 'text'} required value={form[f]} onChange={e => setForm(p => ({...p,[f]:e.target.value}))}
                placeholder={f === 'email' ? 'juan@email.com' : 'Juan Pérez'}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold mb-1">Teléfono</label>
            <div className="flex">
              <span className="flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-500">+56</span>
              <input type="tel" value={form.telefono} onChange={e => setForm(p => ({...p,telefono:e.target.value}))} placeholder="9 1234 5678"
                className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-cta hover:bg-cta-dark disabled:opacity-60 text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-lg">
            {loading ? 'Procesando...' : 'Pagar con Flow.cl →'}
          </button>
          <p className="text-center text-xs text-gray-400">Pago seguro procesado por Flow.cl</p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/CartSidebar.tsx`**

```tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCartStore, formatCLP } from '@/stores/cartStore';
import CheckoutModal from './CheckoutModal';

export default function CartSidebar() {
  const { open, setOpen, items, remove, increment, decrement, total, tickets } = useCartStore();
  const [checkout, setCheckout] = useState(false);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-heading font-bold">Tu carrito</h2>
          <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">✕</button>
        </div>

        {items().length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-gray-400">Tu carrito está vacío</p>
            <button onClick={() => { setOpen(false); document.getElementById('ebooks')?.scrollIntoView({behavior:'smooth'}); }}
              className="mt-2 px-5 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-secondary transition-colors cursor-pointer">
              Ver e-books
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items().map(item => (
                <div key={item.id} className="flex gap-3 bg-accent/30 rounded-xl p-3">
                  <div className="w-14 h-14 rounded-lg bg-accent flex-shrink-0 overflow-hidden relative">
                    <Image src={item.imagen_url || `https://placehold.co/56x56/e8faf2/23cb69?text=e`} alt={item.titulo} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-2">{item.titulo}</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">+{item.participaciones} participación{item.participaciones > 1 ? 'es' : ''}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => decrement(item.id)} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm font-bold">−</button>
                        <span className="px-2 text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => increment(item.id)} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm font-bold">+</button>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatCLP(item.precio * item.qty)}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(item.id)} className="self-start p-1 text-gray-300 hover:text-red-400 cursor-pointer">✕</button>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Participaciones:</span>
                <span className="font-bold text-primary">{tickets()} 🎟️</span>
              </div>
              <div className="flex justify-between font-heading font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatCLP(total())}</span>
              </div>
              <button onClick={() => { setOpen(false); setCheckout(true); }}
                className="w-full py-3 bg-cta hover:bg-cta-dark text-white font-heading font-bold rounded-xl transition-colors cursor-pointer shadow-lg">
                Ir al pago →
              </button>
            </div>
          </>
        )}
      </aside>
      {checkout && <CheckoutModal onClose={() => setCheckout(false)} />}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/CartSidebar.tsx components/CheckoutModal.tsx
git commit -m "feat: add CartSidebar and CheckoutModal"
```

---

## Task 13: Main page + checkout pages

**Files:**
- Create: `app/page.tsx`
- Create: `app/checkout-success/page.tsx`
- Create: `app/checkout-error/page.tsx`

- [ ] **Step 1: Create `app/page.tsx`**

```tsx
import { getConfig, getEbooks, getParcelas } from '@/lib/data';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ProgressBar from '@/components/ProgressBar';
import EbooksSection from '@/components/EbooksSection';
import ParcelasSection from '@/components/ParcelasSection';
import CartSidebar from '@/components/CartSidebar';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import Footer from '@/components/Footer';

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
```

- [ ] **Step 2: Create `app/checkout-success/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `app/checkout-error/page.tsx`**

```tsx
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
```

- [ ] **Step 4: Copiar logos a `/public`**

```bash
cp -r "Logos" "public/Logos"
```

- [ ] **Step 5: Build y verificar sin errores de TypeScript**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit final**

```bash
git add app/ components/ lib/ stores/ types/ public/ package.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.js .env.local.example
git commit -m "feat: complete Next.js migration with Server Components + googleapis cache"
```

---

## Self-Review

### Spec coverage
- ✅ Google Sheets backend via googleapis + Service Account
- ✅ Caché 30s (módulo TTL + React.cache())
- ✅ Countdown conectado a Sheet
- ✅ Progress bar con milestones desde Sheet
- ✅ Ebooks dinámicos desde Sheet
- ✅ Parcelas disponibles/bloqueadas desde Sheet
- ✅ Carrito lateral con Zustand
- ✅ Checkout modal + Flow.cl
- ✅ WhatsApp flotante con número del Sheet
- ✅ Páginas checkout-success / checkout-error
- ✅ Colores #000/#fff/#23cb69
- ✅ Logo y favicon desde /public/Logos/
- ✅ Best seller golden glow

### Placeholder scan
Ningún TBD ni TODO en el plan.

### Type consistency
- `CartItem extends OrderItem` — consistente en todo el plan
- `items()` en Zustand retorna `CartItem[]` — usado correctamente en CartSidebar y CheckoutModal
- `formatCLP` exportado desde `cartStore.ts` — importado correctamente en EbookCard, CartSidebar, CheckoutModal
