"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Loader2 } from "lucide-react"
import QrUpload from "./qr-upload"
import QrScanner from "./qr-scanner"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

export default function AddOtpDialog({ open, onOpenChange, onSuccess }) {
  const [activeTab, setActiveTab] = useState("upload")
  const [successMessage, setSuccessMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { loadOtpItems } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQrCodeDetected = async (qrData) => {
    try {
      setIsProcessing(true)
      
      // Enviar o QR code diretamente para o servidor processar
      const response = await fetch("/api/otp/parse/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrData }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Falha ao processar o QR code")
      }
      
      // Atualizar a lista de OTPs
      loadOtpItems()
      
      // Mostrar mensagem de sucesso
      setSuccessMessage(data.message || "OTP adicionado com sucesso!")
      setTimeout(() => {
        setSuccessMessage("")
        onOpenChange(false)
        onSuccess()
      }, 1500)
    } catch (error) {
      console.error("Erro ao processar QR code:", error)
      alert(error.message || "Erro ao processar QR code. Por favor, tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    handleQrCodeDetected(event.target.qrData.value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New OTP</DialogTitle>
        </DialogHeader>

        {successMessage ? (
          <Alert className="bg-primary/20 border-primary">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Processando QR Code...</p>
          </div>
        ) : (
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload QR</TabsTrigger>
              <TabsTrigger value="camera">Use Camera</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <QrUpload onQrDetected={handleQrCodeDetected} />
            </TabsContent>
            <TabsContent value="camera" className="mt-4">
              <QrScanner onQrDetected={handleQrCodeDetected} />
            </TabsContent>
          </Tabs>
        )}

        {/* Botão de submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adicionando...
            </>
          ) : (
            "Adicionar"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

AddOtpDialog.defaultProps = {
  onSuccess: () => {},
};
