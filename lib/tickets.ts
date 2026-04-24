import { readSheet, updateCell } from './sheets';

export function generateTicketCode(): string {
  return 'C' + Math.floor(1_000_000 + Math.random() * 9_000_000);
}

export function generateTicketCodes(count: number): string[] {
  const codes: Record<string, true> = {};
  while (Object.keys(codes).length < count) {
    codes[generateTicketCode()] = true;
  }
  return Object.keys(codes);
}

/** Mark an order row as paid, write ticket codes, and increment progress. */
export async function confirmOrder(rowIndex: number, rows: string[][]): Promise<string[]> {
  const row          = rows[rowIndex];
  const ticketsCount = Number(row[6] ?? 1);
  const ticketCodes  = generateTicketCodes(ticketsCount);

  await updateCell(`Pedidos!H${rowIndex + 1}`, 'paid');
  await updateCell(`Pedidos!K${rowIndex + 1}`, JSON.stringify(ticketCodes));

  // Increment progress_current by total ebook quantity
  let ebooksCount = 1;
  try {
    const items = JSON.parse(row[4] || '[]') as Array<{ qty: number }>;
    ebooksCount = items.reduce((s, item) => s + (item.qty ?? 1), 0);
  } catch { /* fallback to 1 */ }

  const config = await readSheet('Config!A:B');
  for (let j = 0; j < config.length; j++) {
    if (config[j][0]?.trim() === 'progress_current') {
      await updateCell(`Config!B${j + 1}`, String(Number(config[j][1] ?? 0) + ebooksCount));
      break;
    }
  }

  return ticketCodes;
}
