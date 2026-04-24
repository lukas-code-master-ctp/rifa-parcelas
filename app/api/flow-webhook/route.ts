import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/flow';
import { readSheet } from '@/lib/sheets';
import { confirmOrder } from '@/lib/tickets';

export async function POST(req: NextRequest) {
  try {
    const body  = await req.formData();
    const token = body.get('token') as string;
    if (!token) return NextResponse.json({ error: 'no token' }, { status: 400 });

    const result = await getPaymentStatus(token);

    if (result.status === 2) {
      // Columns: A=timestamp B=nombre C=email D=telefono E=items_json
      //          F=total G=tickets_count H=payment_status I=orderId J=flow_token K=ticket_codes
      const rows = await readSheet('Pedidos!A:K');
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][8] === result.commerceOrder) {
          if (rows[i][7] === 'paid') break; // already processed
          await confirmOrder(i, rows);
          break;
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
