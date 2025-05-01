"use client"

import { useState, useEffect } from "react"
import OtpHeader from "./otp-header"
import FilterBar from "./filter-bar"
import OtpList from "./otp-list"
import AddOtpDialog from "./add-otp-dialog"
import { useStore } from "@/lib/store"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function OtpDashboard() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [filters, setFilters] = useState({ issuer: "", name: "" })
  const { otpItems, loadOtpItems, isLoading, error } = useStore()
  const { toast } = useToast()
  const [loadAttempted, setLoadAttempted] = useState(false)

  useEffect(() => {
    if (!loadAttempted) {
      console.log("OtpDashboard - Carregando itens OTP (primeira vez)")
      loadOtpItems(true)
      setLoadAttempted(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempted])

  useEffect(() => {
    if (error) {
      console.log("OtpDashboard - Erro ao carregar:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar códigos OTP",
        description: error,
        action: (
          <button
            onClick={() => loadOtpItems(true)}
            className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-xs"
          >
            Tentar Novamente
          </button>
        ),
      })
    }
  }, [error, toast])

  const filteredItems = otpItems.filter((item) => {
    const matchIssuer = (item.issuer || "").toLowerCase().includes(filters.issuer.toLowerCase())
    const matchName = (item.name || "").toLowerCase().includes(filters.name.toLowerCase())
    return matchIssuer && matchName
  })

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex flex-col h-screen">
      <OtpHeader onAddClick={() => setIsAddDialogOpen(true)} />
      <FilterBar issuerFilter={filters.issuer} nameFilter={filters.name} onFilterChange={handleFilterChange} />

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && !error && <OtpList items={filteredItems} />}

      <AddOtpDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onSuccess={() => loadOtpItems(true)}
      />
    </div>
  )
}
