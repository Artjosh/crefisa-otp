import { NextResponse } from 'next/server'

export async function middleware(request) {
  console.log('Middleware - URL:', request.nextUrl.pathname)
  console.log('Middleware - Método:', request.method)
  
  // Verificar se é uma requisição para APIs ou para páginas
  const isApiRequest = request.nextUrl.pathname.startsWith('/api/')
  
  // Ignorar rota de login e registro
  if (request.nextUrl.pathname === '/api/auth' || 
      request.nextUrl.pathname === '/api/auth/register') {
    return NextResponse.next()
  }

  // Para dashboard, permitir acesso inicial (componente cliente verificará token)
  if (request.nextUrl.pathname.startsWith('/dashboard') && !isApiRequest) {
    return NextResponse.next()
  }

  // Para APIs, apenas passar para a rota, pois já temos verificação lá
  if (isApiRequest && request.nextUrl.pathname.startsWith('/api/otp/')) {
    return NextResponse.next()
  }
  
  // Para outras rotas, permitir acesso
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/otp/:path*',  // Protege todas as rotas OTP
    '/dashboard',         // Proteger a página de dashboard 
    '/dashboard/:path*'   // Proteger subpáginas do dashboard
  ]
} 