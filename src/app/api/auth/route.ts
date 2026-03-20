import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://be-production-4099.up.railway.app/';

export async function POST(request: Request) {
  let refreshToken: string;
  try {
    const body = await request.json();
    refreshToken = body.refreshToken;
  } catch {
    return NextResponse.json(
      { error: 'refreshToken required' },
      { status: 400 }
    );
  }

  if (!refreshToken || typeof refreshToken !== 'string') {
    return NextResponse.json(
      { error: 'refreshToken required' },
      { status: 400 }
    );
  }

  const res = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      Cookie: `refreshToken=${refreshToken}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
