"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Loader2 } from "lucide-react"
import QrUpload from "./qr-upload"
import QrScanner from "./qr-scanner"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddOtpDialog({ open, onOpenChange, onSuccess }) {
  const [activeTab, setActiveTab] = useState("upload")
  const [successMessage, setSuccessMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { loadOtpItems, getAuthHeaders } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Novos estados para processamento de QR e aliases
  const [qrProcessingStep, setQrProcessingStep] = useState("scan") // scan, alias, submitting
  const [qrType, setQrType] = useState(null) // "single" ou "migration"
  const [otpItems, setOtpItems] = useState([])
  const [aliases, setAliases] = useState([])
  const [qrDataBuffer, setQrDataBuffer] = useState(null)

  // Adicionar um novo estado para controlar o dialog de confirmação
  const [existingAliasDialog, setExistingAliasDialog] = useState({
    show: false,
    alias: '',
    confirmAction: null
  });

  // Função para analisar o QR enviando ao servidor
  const analyzeQrCode = async (qrData) => {
    // Obter cabeçalhos de autenticação do store
    const authHeaders = getAuthHeaders();
    
    // Enviar o QR code para análise (usando o mesmo endpoint, mas com flag de análise)
    const response = await fetch("/api/otp/parse/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify({ 
        qrData,
        analyzeOnly: true // Flag para indicar que é apenas análise
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Falha ao analisar o QR code");
    }
    
    // Obter os dados analisados
    const data = await response.json();
    return data;
  };
  
  // Gerar chave aleatória para usar como alias padrão
  const generateRandomKey = () => {
    return `otp_${Math.random().toString(36).substring(2, 10)}`;
  };

  const handleQrCodeDetected = async (qrData) => {
    try {
      setIsProcessing(true);
      
      // Determinar tipo de QR
      let type;
      if (qrData.startsWith("otpauth://")) {
        type = "single";
      } else if (qrData.startsWith("otpauth-migration://")) {
        type = "migration";
      } else {
        throw new Error("QR code inválido ou não suportado");
      }
      
      // Armazenar QR data para uso posterior
      setQrDataBuffer(qrData);
      setQrType(type);
      
      // Enviar para análise no servidor
      const analysisResult = await analyzeQrCode(qrData);
      const previewItems = analysisResult.preview || [];
      
      // Processar resultado
      setOtpItems(previewItems);
      
      // Inicializar aliases com chaves aleatórias
      const initialAliases = previewItems.map((item, idx) => ({
        id: idx,
        value: generateRandomKey(),
        info: `${item.issuer || 'Unknown'} - ${item.name || 'OTP'}`
      }));
      
      setAliases(initialAliases);
      
      // Mudar para a etapa de definição dos aliases
      setQrProcessingStep("alias");
      
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
      alert(error.message || "Erro ao processar QR code. Por favor, tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAliasChange = (id, value) => {
    setAliases(prev => 
      prev.map(alias => 
        alias.id === id ? { ...alias, value } : alias
      )
    );
  };

  const handleSubmitWithAliases = async () => {
    try {
      setIsSubmitting(true);
      
      // Obter cabeçalhos de autenticação do store
      const authHeaders = getAuthHeaders();
      
      // Enviar o QR code para processamento com os aliases
      const response = await fetch("/api/otp/parse/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({ 
          qrData: qrDataBuffer,
          aliases: aliases.map(a => a.value),
          forceOverwrite: false // Flag para não permitir sobrescrever inicialmente
        }),
      });
      
      const data = await response.json();
      
      // Verificar se há erro de alias já existente
      if (response.status === 409 && data.code === "ALIAS_EXISTS") {
        // Pausar o envio e mostrar confirmação
        setExistingAliasDialog({
          show: true,
          alias: data.existingAlias,
          confirmAction: () => handleConfirmOverwrite()
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Falha ao processar o QR code");
      }
      
      // Sucesso - código existente
      loadOtpItems();
      setSuccessMessage(data.message || "OTP adicionado com sucesso!");
      setTimeout(() => {
        resetQrProcessing();
        setSuccessMessage("");
        onOpenChange(false);
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Erro ao processar QR code com aliases:", error);
      alert(error.message || "Erro ao processar QR code. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Nova função para confirmar sobrescrição
  const handleConfirmOverwrite = async () => {
    try {
      setIsSubmitting(true);
      setExistingAliasDialog({ show: false, alias: '', confirmAction: null });
      
      // Obter cabeçalhos de autenticação do store
      const authHeaders = getAuthHeaders();
      
      // Reenviar com flag para forçar sobrescrição
      const response = await fetch("/api/otp/parse/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({ 
          qrData: qrDataBuffer,
          aliases: aliases.map(a => a.value),
          forceOverwrite: true // Agora permitir sobrescrever
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Falha ao processar o QR code");
      }
      
      // Sucesso
      loadOtpItems();
      setSuccessMessage(data.message || "OTP adicionado com sucesso (substituído)!");
      setTimeout(() => {
        resetQrProcessing();
        setSuccessMessage("");
        onOpenChange(false);
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Erro ao processar QR code com aliases:", error);
      alert(error.message || "Erro ao processar QR code. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQrProcessing = () => {
    setQrProcessingStep("scan");
    setQrType(null);
    setOtpItems([]);
    setAliases([]);
    setQrDataBuffer(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (event.target.qrData?.value) {
      handleQrCodeDetected(event.target.qrData.value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetQrProcessing();
      onOpenChange(newOpen);
    }}>
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
        ) : qrProcessingStep === "alias" ? (
          <div className="space-y-4">
            <Alert className="bg-blue-500/10 border-blue-500">
              <AlertDescription>
                {qrType === "single" 
                  ? "Defina um alias para seu código OTP"
                  : `Defina aliases para os ${otpItems.length} códigos OTP encontrados`}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3 max-h-60 overflow-y-auto py-2">
              {aliases.map((alias) => (
                <div key={alias.id} className="space-y-1">
                  <Label htmlFor={`alias-${alias.id}`}>
                    {alias.info || (qrType === "migration" ? `OTP ${alias.id + 1}` : "OTP")} - Chave de Identificação
                  </Label>
                  <Input
                    id={`alias-${alias.id}`}
                    value={alias.value}
                    onChange={(e) => handleAliasChange(alias.id, e.target.value)}
                    placeholder="Digite um identificador único"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={resetQrProcessing}
              >
                Voltar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSubmitWithAliases}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

        {qrProcessingStep === "scan" && (
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
        )}

        {existingAliasDialog.show && (
          <Dialog open={existingAliasDialog.show} onOpenChange={(open) => 
            setExistingAliasDialog(prev => ({ ...prev, show: open }))
          }>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirmação Necessária</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    O alias <strong>{existingAliasDialog.alias}</strong> já existe. 
                    Sobrescrever irá substituir o OTP existente permanentemente.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setExistingAliasDialog({ show: false, alias: '', confirmAction: null })}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={existingAliasDialog.confirmAction}
                >
                  Sobrescrever
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

AddOtpDialog.defaultProps = {
  onSuccess: () => {},
};
