"use client"

import { useState, useEffect } from "react"
import OtpCard from "./otp-card"
import { generateTOTP } from "@/lib/totp"
import { PlusCircle, RefreshCw, Trash2, CheckSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function OtpList({ items }) {
  const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000))
  const [codes, setCodes] = useState({})
  const { 
    loadOtpItems, 
    isSelectionMode, 
    toggleSelectionMode, 
    selectedItems, 
    clearSelections, 
    bulkDeleteItems 
  } = useStore()
  const [deleting, setDeleting] = useState(false)

  // Calculate time remaining once per render based on currentTime
  const timeRemaining = 30 - (currentTime % 30)

  // Calculate the current period (changes every 30 seconds)
  const currentPeriod = Math.floor(currentTime / 30)

  // Update codes only when the period changes
  useEffect(() => {
    const updateCodes = async () => {
      const newCodes = {}
      for (const item of items) {
        if (item && item.secret) {
          newCodes[item.id] = await generateTOTP(item.secret, {
            digits: item.digits || 6,
            algorithm: item.algorithm || "SHA1",
            period: item.period || 30,
          })
        }
      }
      setCodes(newCodes)
    }

    updateCodes()
  }, [items, currentPeriod]) // Only regenerate when items change or the 30-second period changes

  // Update the time every second without causing full re-renders
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  const handleBulkDelete = async () => {
    if (!selectedItems.length) return
    
    if (confirm(`Tem certeza que deseja excluir ${selectedItems.length} item(s)?`)) {
      setDeleting(true)
      await bulkDeleteItems()
      setDeleting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-card p-8 rounded-lg shadow-sm max-w-md w-full">
          <div className="flex justify-between items-center mb-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No OTP codes found</p>
            </div>
            <div className="ml-auto z-10">
              <Button variant="ghost" size="icon" onClick={loadOtpItems} title="Atualizar">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Add your first OTP code by scanning a QR code or uploading an image
          </p>
          <Button onClick={() => document.getElementById("add-otp-button")?.click()} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add OTP Code
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      {isSelectionMode && (
        <div className="bg-card rounded-md p-2 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span>{selectedItems.length} item(s) selecionado(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              disabled={selectedItems.length === 0 || deleting}
              onClick={handleBulkDelete}
            >
              {deleting ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Excluir ({selectedItems.length})
            </Button>
            <Button variant="outline" size="sm" onClick={toggleSelectionMode}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <OtpCard
            key={item.id}
            item={item}
            code={codes[item.id] || "------"}
            timeRemaining={timeRemaining}
            period={item.period || 30}
          />
        ))}
      </div>
    </div>
  )
}
