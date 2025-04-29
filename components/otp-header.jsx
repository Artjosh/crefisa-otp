"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon, CheckSquare } from "lucide-react"
import { useStore } from "@/lib/store"

export default function OtpHeader({ onAddClick }) {
  const { isSelectionMode, toggleSelectionMode } = useStore()
  
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background border-b">
      <h1 className="text-xl font-bold">OTP Manager</h1>
      <div className="flex items-center gap-2">
        <Button 
          variant={isSelectionMode ? "secondary" : "outline"} 
          size="sm" 
          onClick={toggleSelectionMode}
          className="rounded-full"
        >
          <CheckSquare className="h-4 w-4 mr-1" />
          {isSelectionMode ? "Cancelar" : "Selecionar itens"}
        </Button>
        <Button id="add-otp-button" size="icon" onClick={onAddClick} className="rounded-full">
          <PlusIcon className="h-5 w-5" />
          <span className="sr-only">Add new OTP</span>
        </Button>
      </div>
    </header>
  )
}
