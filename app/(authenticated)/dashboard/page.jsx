"use client"

import { useEffect, useState } from "react"
import OtpDashboard from "@/components/otp-dashboard"
import LoginError from "@/components/login-error"
import { useRouter, useSearchParams } from "next/navigation"

// Garante que todas as requisições incluam o token de autorização
function configureAuthInterceptors() {
  if (typeof window === 'undefined') return

  const token = localStorage.getItem("token")
  if (!token) return

  console.log("Dashboard - Configurando interceptores de requisição com token")
  
  // Interceptar XMLHttpRequest
  const originalXhrOpen = window.XMLHttpRequest.prototype.open
  window.XMLHttpRequest.prototype.open = function(...args) {
    const result = originalXhrOpen.apply(this, arguments)
    this.setRequestHeader("Authorization", `Bearer ${token}`)
    return result
  }
  
  // Interceptar fetch
  const originalFetch = window.fetch
  window.fetch = function(url, options = {}) {
    options = options || {}
    options.headers = options.headers || {}
    options.headers["Authorization"] = `Bearer ${token}`
    console.log(`Adicionando token ao fetch para: ${url}`)
    return originalFetch(url, options)
  }
  
  console.log("Interceptores de autenticação configurados")
  return true
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessDenied = searchParams.get('accessDenied') === 'true'

  // Configurar interceptores ANTES de qualquer requisição
  useEffect(() => {
    configureAuthInterceptors()
  }, [])

  // Verificar autenticação
  useEffect(() => {
    console.log("Dashboard - Página carregada")
    
    async function checkAuth() {
      console.log("Dashboard - Verificando autenticação")
      
      // Verificar se o token existe localmente
      const token = localStorage.getItem("token")
      console.log("Dashboard - Token encontrado:", token ? "Sim" : "Não")
      
      if (!token) {
        console.log("Dashboard - Token não encontrado, redirecionando para login")
        router.push("/")
        return
      }
      
      try {
        // Verificar o usuário no servidor (dados reais do banco de dados)
        // Esta rota está protegida pelo middleware que verifica o token
        const response = await fetch('/api/user/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.log("Dashboard - Verificação de usuário falhou:", response.status);
          localStorage.removeItem("token");
          router.push("/");
          return;
        }
        
        const userData = await response.json();
        console.log("Dashboard - Dados do usuário verificados:", userData);
        
        setIsAuthenticated(true);
        
        // Verificar se o usuário é admin usando os dados do BANCO retornados pela API
        setIsAdmin(userData.type === 'admin');
        console.log("Dashboard - É admin:", userData.type === 'admin');
        
        // Se não for admin, exibir tela de erro, mas não redirecionar
        if (userData.type !== 'admin') {
          console.log("Dashboard - Usuário não é admin, mostrando erro de acesso");
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Dashboard - Erro ao verificar usuário:", error)
        localStorage.removeItem("token")
        router.push("/")
      }
    }
    
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </main>
    )
  }

  // Se não estiver autenticado, retornar null enquanto redireciona
  if (!isAuthenticated) {
    return null
  }
  
  // Se não for admin ou tiver parâmetro de acesso negado, mostrar tela de erro
  if (!isAdmin || accessDenied) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <LoginError />
      </main>
    )
  }

  // Se for admin, mostrar o dashboard
  return (
    <main className="min-h-screen bg-background">
      <OtpDashboard />
    </main>
  )
}
