import { NextResponse } from 'next/server';
import { withBasePath } from '@/lib/base-path';

export function GET() {
  return NextResponse.json(
    { graphqlUrl: process.env.NEXT_PUBLIC_API_URL ? withBasePath(process.env.NEXT_PUBLIC_API_URL) : null },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
