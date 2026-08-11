import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const userId = req.nextUrl.searchParams.get('userId') ?? 'default-user';
  try {
    const res = await fetch(`${API_BASE}/books/${slug}/progress?userId=${userId}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({
      bookSlug: slug,
      total: 0,
      mastered: 0,
      read: 0,
      started: 0,
      lessons: [],
    });
  }
}
