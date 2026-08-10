import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    try {
      const [givenUser, givenPass] = atob(auth.slice(6)).split(':');
      if (givenUser === user && givenPass === pass) return NextResponse.next();
    } catch {}
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="EarlyFind Admin"' },
  });
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
