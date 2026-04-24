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

    const { flowUrl, token } = await createPayment({
      orderId, amount: total, email,
      subject: 'Compra e-book QuieroMiParcela',
    });

    // Columns: A=timestamp B=nombre C=email D=telefono E=items_json
    //          F=total G=tickets_count H=payment_status I=orderId J=flow_token K=ticket_codes
    await appendRow('Pedidos!A:K', [
      new Date().toISOString(), nombre, email, telefono ?? '',
      JSON.stringify(items), total, tickets, 'pending', orderId, token, '',
    ]);

    return NextResponse.json({ success: true, flowUrl, orderId, total, tickets });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
