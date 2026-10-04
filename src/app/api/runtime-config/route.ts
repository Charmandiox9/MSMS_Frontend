import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json(
    { graphqlUrl: process.env.NEXT_PUBLIC_API_URL ?? null },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
