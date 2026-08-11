import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function GET(req: Request, { params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const url = new URL(req.url);
  const portfolioId = url.searchParams.get('portfolioId') ?? 'seed-portfolio';
  try {
    const res = await fetch(`${API_BASE}/ir/${year}/csv?portfolioId=${portfolioId}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const csv = await res.text();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ir-${year}.csv"`,
      },
    });
  } catch {
    return new NextResponse('Data,Ticker,Tipo,Quantidade,Preco,Total\n', {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    });
  }
}
