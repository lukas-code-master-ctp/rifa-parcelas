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
