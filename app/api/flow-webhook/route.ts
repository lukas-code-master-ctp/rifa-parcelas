import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/flow';
import { readSheet, updateCell } from '@/lib/sheets';

function generateTicketCode(): string {
  return 'C' + Math.floor(1_000_000 + Math.random() * 9_000_000);
}

function generateTicketCodes(count: number): string[] {
  const codes: Record<string, true> = {};
  while (Object.keys(codes).length < count) {
    codes[generateTicketCode()] = true;
  }
  return Object.keys(codes);
}

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
          // Already paid — skip
          if (rows[i][7] === 'paid') break;

          // Generate ticket codes based on participaciones count
          const ticketsCount = Number(rows[i][6] ?? 1);
          const ticketCodes  = generateTicketCodes(ticketsCount);

          // Update payment_status → 'paid' and store ticket codes
          await updateCell(`Pedidos!H${i + 1}`, 'paid');
          await updateCell(`Pedidos!K${i + 1}`, JSON.stringify(ticketCodes));

          // Increment progress_current by the number of ebooks (sum of item qty)
          let ebooksCount = 1;
          try {
            const items = JSON.parse(rows[i][4] || '[]') as Array<{ qty: number }>;
            ebooksCount = items.reduce((s, item) => s + (item.qty ?? 1), 0);
          } catch { /* fallback to 1 */ }

          const config = await readSheet('Config!A:B');
          for (let j = 0; j < config.length; j++) {
            if (config[j][0]?.trim() === 'progress_current') {
              const next = Number(config[j][1] ?? 0) + ebooksCount;
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
