import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') ?? 'default-user';
  try {
    const res = await fetch(`${API_BASE}/books/progress?userId=${userId}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    // Fallback: tudo "STARTED" via Prisma direto NÃO possível aqui.
    // Retornar zeros.
    return NextResponse.json({
      streak: 0,
      overall: { total: 0, mastered: 0, read: 0, progress: 0 },
      books: [],
    });
  }
}
