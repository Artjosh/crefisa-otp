"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, LogOut } from "lucide-react"

export default function LoginError() {
  const handleLogout = () => {
    // Limpar o token no localStorage
    localStorage.removeItem("token")
    // Redirecionar para a página de login
    window.location.href = "/"
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="text-2xl text-center text-red-500">
          Acesso Negado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Você não tem permissão para acessar esta área que é restrita apenas para administradores.
        </p>
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleLogout}
            className="w-full"
            variant="destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 