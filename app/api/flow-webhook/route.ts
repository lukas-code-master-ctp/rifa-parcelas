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
