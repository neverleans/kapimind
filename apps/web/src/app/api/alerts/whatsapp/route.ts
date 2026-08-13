import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function GET(req: Request) {
  // Meta verifica webhook via GET com hub.mode, hub.verify_token, hub.challenge
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode') ?? '';
  const token = searchParams.get('hub.verify_token') ?? '';
  const challenge = searchParams.get('hub.challenge') ?? '';

  try {
    const qs = new URLSearchParams({
      'hub.mode': mode,
      'hub.verify_token': token,
      'hub.challenge': challenge,
    });
    const res = await fetch(`${API_BASE}/webhook/whatsapp?${qs}`, {
      cache: 'no-store',
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch {
    return new NextResponse('0', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/webhook/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return new NextResponse(await res.text(), { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: 'webhook_proxy_failed', message: err instanceof Error ? err.message : 'Erro' },
      { status: 503 },
    );
  }
}
