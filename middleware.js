import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

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

  // Para APIs, verificar o token
  if (isApiRequest && request.nextUrl.pathname.startsWith('/api/otp/')) {
    // Obter token do cabeçalho de autorização
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado. Token não fornecido.' },
        { status: 401 }
      )
    }

    let decoded;
    
    // Verificar token do lado do servidor - apenas para validar assinatura e expiração
    console.log('Middleware - Tentando verificar token:', token.substring(0, 30) + '...')
    try {
      decoded = verifyToken(token)
      console.log('Middleware - Decode resultado:', decoded ? 'Válido' : 'Inválido')
      
      if (!decoded) {
        console.log('Middleware - Token inválido')
        return NextResponse.json(
          { error: 'Não autorizado. Token inválido.' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Middleware - Erro ao verificar token:', error.message)
      return NextResponse.json(
        { error: 'Erro ao verificar token: ' + error.message },
        { status: 401 }
      )
    }

    // O middleware só verifica se o token é válido
    // A verificação de permissões detalhada será feita na própria rota
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.userId)
    
    // Passar o controle para a rota
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
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