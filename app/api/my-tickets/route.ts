import { NextRequest, NextResponse } from 'next/server';
import { readSheet } from '@/lib/sheets';
import type { TicketOrder } from '@/types';

// GET /api/my-tickets?email=xxx
// Returns all paid orders for a given email
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim();
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    // Columns: A=timestamp B=nombre C=email D=telefono E=items_json
    //          F=total G=tickets_count H=payment_status I=orderId J=flow_token K=ticket_codes
    const rows = await readSheet('Pedidos!A:K');
    const orders: TicketOrder[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowEmail  = (row[2] ?? '').toLowerCase().trim();
      const rowStatus = (row[7] ?? '').toLowerCase();

      if (rowEmail === email && rowStatus === 'paid') {
        let ticketCodes: string[] = [];
        try { ticketCodes = JSON.parse(row[10] || '[]'); } catch { /* empty */ }

        orders.push({
          orderId:     row[8]  ?? '',
          nombre:      row[1]  ?? '',
          email:       row[2]  ?? '',
          total:       Number(row[5] ?? 0),
          ticketCount: Number(row[6] ?? 0),
          ticketCodes,
          status:      row[7]  ?? 'paid',
          timestamp:   row[0]  ?? '',
        });
      }
    }

    // Most recent first
    orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
