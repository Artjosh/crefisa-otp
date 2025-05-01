"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RegisterForm from "@/components/register-form"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    console.log("Login - Página carregada")
    console.log("Login - URL atual:", window.location.href)
    
    // Verificar se já tem token no localStorage
    const token = localStorage.getItem("token")
    console.log("Login - Token existente:", token ? "Sim" : "Não")
    
    // Se tiver token, redirecionar para o dashboard
    if (token) {
      console.log("Login - Redirecionando para dashboard")
      
      // Forçar o redirecionamento via URL
      window.location.href = "/dashboard"
    }
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    console.log("Login - Iniciando processo de login...")

    try {
      const formData = new FormData(e.target)
      const name = formData.get("name")
      const password = formData.get("password")
      
      console.log("Login - Enviando requisição para /api/auth com nome:", name)
      
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          password,
        }),
      })

      const data = await response.json()
      console.log("Login - Resposta da API:", response.status, data)

      if (response.ok) {
        console.log("Login - Bem-sucedido, token recebido:", data.token ? "Sim" : "Não")
        
        if (!data.token) {
          throw new Error("Token não recebido do servidor")
        }
        
        // Salvar token no localStorage
        localStorage.setItem("token", data.token)
        console.log("Login - Token salvo no localStorage")
        
        // Função para configurar interceptadores para adicionar o token em requisições
        const setupAuthInterceptors = () => {
          console.log("Login - Configurando interceptadores de requisição")
          
          // Interceptador para XMLHttpRequest
          const originalXhrOpen = window.XMLHttpRequest.prototype.open;
          window.XMLHttpRequest.prototype.open = function() {
            const result = originalXhrOpen.apply(this, arguments);
            const token = localStorage.getItem("token");
            if (token) {
              this.setRequestHeader("Authorization", `Bearer ${token}`);
            }
            return result;
          };
          
          // Interceptador para fetch
          const originalFetch = window.fetch;
          window.fetch = function(url, options = {}) {
            const token = localStorage.getItem("token");
            if (token) {
              options.headers = {
                ...options.headers,
                "Authorization": `Bearer ${token}`
              };
            }
            return originalFetch(url, options);
          };
        };
        
        // Configurar interceptadores
        setupAuthInterceptors();
        
        // Redirecionar para dashboard
        window.location.href = "/dashboard";
      } else {
        throw new Error(data.error || "Erro ao fazer login")
      }
    } catch (error) {
      console.error("Login - Erro durante o login:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (showRegister) {
    return (
      <main className="w-full flex items-center justify-center min-h-screen py-10">
        <div className="w-full max-w-md px-4">
          <RegisterForm />
          <Button 
            variant="link" 
            className="w-full mt-4"
            onClick={() => setShowRegister(false)}
          >
            Voltar para Login
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome de Usuário</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome de usuário"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <Button 
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowRegister(true)}
            >
              Criar nova conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
