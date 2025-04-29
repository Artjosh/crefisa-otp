"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff } from "lucide-react"
import { useCapacitor } from "./capacitor-provider"
import jsQR from "jsqr"

export default function QrScanner({ onQrDetected }) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const { isNative } = useCapacitor()

  useEffect(() => {
    // Check if camera is available
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === "videoinput")
        setHasCamera(videoDevices.length > 0)
      })
      .catch((err) => {
        console.error("Error checking camera:", err)
        setHasCamera(false)
      })

    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      if (!videoRef.current) return

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      videoRef.current.srcObject = stream
      videoRef.current.play()
      setIsScanning(true)

      // Start scanning for QR codes
      requestAnimationFrame(scanQrCode)
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Could not access the camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const scanQrCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight
      canvas.width = video.videoWidth

      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code) {
        stopCamera()
        onQrDetected(code.data)
        return
      }
    }

    requestAnimationFrame(scanQrCode)
  }

  const toggleCamera = () => {
    if (isScanning) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  if (!hasCamera && !isNative) {
    return (
      <div className="text-center p-4">
        <CameraOff className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-4">No camera detected on your device.</p>
        <p className="text-xs text-muted-foreground">Please use the Upload tab to add OTP codes.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden mb-4">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <Button onClick={toggleCamera} className="w-full">
        {isScanning ? "Stop Camera" : "Start Camera"}
      </Button>
    </div>
  )
}
