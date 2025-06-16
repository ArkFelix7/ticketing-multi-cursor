// Middleware to handle authentication redirects
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;
  
  // Get the token from cookies
  const token = request.cookies.get('firebase-auth-token')?.value;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || 
                      path === '/register' || 
                      path === '/invite' || 
                      path === '/';
                      
  // If the user is on a public path and has a token, redirect to the dashboard
  // Assuming the user has saved their companySlug in a cookie or localStorage
  if (isPublicPath && token) {
    const companySlug = request.cookies.get('company-slug')?.value;
    if (companySlug) {
      return NextResponse.redirect(new URL(`/${companySlug}/dashboard`, request.url));
    }
    // If no company slug is found, they might need to register a company
    return NextResponse.redirect(new URL('/register', request.url));
  }
  
  // If the user is on a protected path and doesn't have a token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Match all routes except for API routes, static files, and other special Next.js paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
