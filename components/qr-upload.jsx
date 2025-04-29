"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { decodeQrFromImage } from "@/lib/qr-decoder"

export default function QrUpload({ onQrDetected }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      const qrData = await decodeQrFromImage(file)
      if (qrData) {
        onQrDetected(qrData)
      } else {
        alert("No QR code found in the image. Please try another image.")
      }
    } catch (error) {
      console.error("Error decoding QR code:", error)
      alert("Error decoding QR code. Please try another image.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 w-full text-center mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="qr-upload"
          disabled={isLoading}
        />
        <label htmlFor="qr-upload" className="flex flex-col items-center cursor-pointer">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">{isLoading ? "Processing..." : "Upload QR Code Image"}</p>
          <p className="text-xs text-muted-foreground">Click to select or drag and drop</p>
        </label>
      </div>
      <Button
        variant="outline"
        onClick={() => document.getElementById("qr-upload").click()}
        disabled={isLoading}
        className="w-full"
      >
        Select Image
      </Button>
    </div>
  )
}
