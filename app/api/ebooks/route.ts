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
