import { NextRequest, NextResponse } from 'next/server';
import { appendRow, readSheet, updateCell } from '@/lib/sheets';
import { createPayment } from '@/lib/flow';
import { generateTicketCodes } from '@/lib/tickets';
import type { OrderItem } from '@/types';

const SIMULATION_MODE = !(process.env.FLOW_API_KEY ?? '').trim();

async function incrementProgress(items: OrderItem[]) {
  const ebooksCount = items.reduce((s, i) => s + i.qty, 0);
  const config      = await readSheet('Config!A:B');
  for (let j = 0; j < config.length; j++) {
    if (config[j][0]?.trim() === 'progress_current') {
      await updateCell(`Config!B${j + 1}`, String(Number(config[j][1] ?? 0) + ebooksCount));
      break;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, telefono, items } = await req.json() as {
      nombre: string; email: string; telefono: string; items: OrderItem[];
    };

    if (!nombre || !email || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const total      = items.reduce((s, i) => s + i.precio * i.qty, 0);
    const ticketsQty = items.reduce((s, i) => s + i.participaciones * i.qty, 0);
    const orderId    = `ORD-${Date.now()}`;
    const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? '';

    /* ── SIMULATION MODE (Flow not configured) ───────────────────────────
       Skip Flow entirely: generate tickets immediately, mark order as paid,
       and redirect straight to the success page.
    ──────────────────────────────────────────────────────────────────── */
    if (SIMULATION_MODE) {
      const fakeToken   = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ticketCodes = generateTicketCodes(ticketsQty);

      await appendRow('Pedidos!A:K', [
        new Date().toISOString(), nombre, email, telefono ?? '',
        JSON.stringify(items), total, ticketsQty,
        'paid', orderId, fakeToken, JSON.stringify(ticketCodes),
      ]);

      await incrementProgress(items);

      const flowUrl = `${siteUrl}/checkout-success?token=${fakeToken}`;
      return NextResponse.json({ success: true, flowUrl, orderId, total, tickets: ticketsQty, simulation: true });
    }

    /* ── PRODUCTION MODE (Flow configured) ───────────────────────────── */
    const { flowUrl, token } = await createPayment({
      orderId, amount: total, email,
      subject: 'Compra e-book QuieroMiParcela',
    });

    // Columns: A=timestamp B=nombre C=email D=telefono E=items_json
    //          F=total G=tickets_count H=payment_status I=orderId J=flow_token K=ticket_codes
    await appendRow('Pedidos!A:K', [
      new Date().toISOString(), nombre, email, telefono ?? '',
      JSON.stringify(items), total, ticketsQty, 'pending', orderId, token, '',
    ]);

    return NextResponse.json({ success: true, flowUrl, orderId, total, tickets: ticketsQty });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
