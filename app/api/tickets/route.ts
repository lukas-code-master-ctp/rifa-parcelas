import { NextRequest, NextResponse } from 'next/server';
import { readSheet } from '@/lib/sheets';
import type { TicketOrder } from '@/types';

// GET /api/tickets?token=xxx
// Returns order data for the success page (looks up by Flow token stored in column J)
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });

    // Columns: A=timestamp B=nombre C=email D=telefono E=items_json
    //          F=total G=tickets_count H=payment_status I=orderId J=flow_token K=ticket_codes
    const rows = await readSheet('Pedidos!A:K');

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[9] === token) {
        let ticketCodes: string[] = [];
        try { ticketCodes = JSON.parse(row[10] || '[]'); } catch { /* empty */ }

        const order: TicketOrder = {
          orderId:     row[8]  ?? '',
          nombre:      row[1]  ?? '',
          email:       row[2]  ?? '',
          total:       Number(row[5] ?? 0),
          ticketCount: Number(row[6] ?? 0),
          ticketCodes,
          status:      row[7]  ?? 'pending',
          timestamp:   row[0]  ?? '',
        };
        return NextResponse.json(order);
      }
    }

    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
