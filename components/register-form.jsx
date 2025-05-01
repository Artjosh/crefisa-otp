"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formData = new FormData(e.target)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          password: formData.get("password"),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirecionar para login após registro bem sucedido
        window.location.href = "/"
      } else {
        throw new Error(data.error || "Erro ao registrar usuário")
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Registro</CardTitle>
        <CardDescription className="text-center">
          Crie sua conta para acessar o sistema
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
            {loading ? "Registrando..." : "Registrar"}
          </Button>
          <div className="text-center text-sm">
            <a href="/" className="text-blue-500 hover:underline">
              Já tem uma conta? Faça login
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 