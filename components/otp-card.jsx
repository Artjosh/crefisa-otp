"use client"

import { memo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Copy, Check, Loader2, CheckCircle2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Use memo to prevent re-renders when props haven't changed
const OtpCard = memo(
  function OtpCard({ item, code, timeRemaining, period }) {
    const { removeOtpItem, updateOtpItem, isSelectionMode, toggleItemSelection, selectedItems } = useStore()
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editedName, setEditedName] = useState(item.name || "")
    const [editedIssuer, setEditedIssuer] = useState(item.issuer || "")
    const [isCopied, setIsCopied] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    const progressValue = (timeRemaining / period) * 100
    const isSelected = selectedItems.includes(item.id)

    const handleCardClick = () => {
      if (isSelectionMode) {
        toggleItemSelection(item.id)
      }
    }

    const handleDelete = async () => {
      if (confirm("Are you sure you want to delete this OTP code?")) {
        setIsDeleting(true)
        await removeOtpItem(item.id)
        setIsDeleting(false)
      }
    }

    const handleEdit = async () => {
      setIsUpdating(true)
      await updateOtpItem(item.id, {
        name: editedName,
        issuer: editedIssuer,
      })
      setIsUpdating(false)
      setIsEditDialogOpen(false)
    }

    const handleCopy = (e) => {
      if (isSelectionMode) return
      if (e && e.stopPropagation) {
        e.stopPropagation()
      }
      navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }

    // Prevent actions when in selection mode
    const handleAction = (e, action) => {
      if (isSelectionMode) return
      if (e && e.stopPropagation) {
        e.stopPropagation()
      }
      action()
    }

    return (
      <>
        <Card 
          className={`bg-card flex flex-col relative cursor-pointer transition-all ${
            isSelectionMode ? 'hover:bg-primary/10' : ''
          } ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}`}
          onClick={handleCardClick}
        >
          {isSelectionMode && (
            <div className="absolute top-2 right-2 z-10">
              <div className={`rounded-full p-1 ${isSelected ? 'bg-primary text-white' : 'bg-muted'}`}>
                <CheckCircle2 size={16} />
              </div>
            </div>
          )}
          
          <CardHeader className="p-4 pb-0 flex flex-col items-center">
            <h3 className="font-medium text-card-foreground text-center">{item.issuer || "Unknown"}</h3>
            <p className="text-sm text-muted-foreground text-center">{item.name || "Account"}</p>
            <div 
              className="text-4xl font-mono font-semibold tracking-wider text-card-foreground cursor-pointer pt-4 pb-4"
              onClick={(e) => handleCopy(e)}
            >
              {code}
            </div>
          </CardHeader>
          <CardContent className="p-4 mt-auto">
            <div className="flex items-center gap-2 mb-6">
              <Progress value={progressValue} className="h-2 flex-1" />
              <span className="text-sm font-medium w-8 text-right text-muted-foreground">{timeRemaining}s</span>
            </div>
            {!isSelectionMode && (
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-primary p-2"
                  onClick={(e) => handleCopy(e)}
                >
                  {isCopied ? <Check size={20} /> : <Copy size={20} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-primary p-2"
                  onClick={(e) => handleAction(e, () => setIsEditDialogOpen(true))}
                >
                  <Edit2 size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-destructive p-2"
                  onClick={(e) => handleAction(e, handleDelete)}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 size={20} />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit OTP Account</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="issuer" className="text-right">
                  Issuer
                </Label>
                <Input
                  id="issuer"
                  value={editedIssuer}
                  onChange={(e) => setEditedIssuer(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
      prevProps.code === nextProps.code &&
      prevProps.timeRemaining === nextProps.timeRemaining &&
      prevProps.item.id === nextProps.item.id
    )
  },
)

export default OtpCard
