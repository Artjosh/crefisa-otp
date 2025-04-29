// Function to decode QR code from an image file
export async function decodeQrFromImage(file) {
  // Dynamically import jsQR
  const jsQR = (await import("jsqr")).default

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          // Create canvas and draw image
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")

          canvas.width = img.width
          canvas.height = img.height
          context.drawImage(img, 0, 0, img.width, img.height)

          // Get image data
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

          // Decode QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          })

          if (code) {
            console.log("QR code detected:", code.data.substring(0, 20) + "...")
            resolve(code.data)
          } else {
            resolve(null)
          }
        }

        img.onerror = () => {
          reject(new Error("Failed to load image"))
        }

        img.src = e.target.result
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

// Function to parse otpauth URI
export function parseOtpAuthUri(uri) {
  try {
    const url = new URL(uri)

    if (url.protocol !== "otpauth:") {
      throw new Error("Invalid OTP URI protocol")
    }

    const type = url.hostname.toLowerCase()
    if (type !== "totp" && type !== "hotp") {
      throw new Error("Unsupported OTP type")
    }

    // Parse path to get issuer and name
    const path = decodeURIComponent(url.pathname).substring(1)
    let issuer = ""
    let name = path

    if (path.includes(":")) {
      ;[issuer, name] = path.split(":")
    }

    // Get parameters
    const params = url.searchParams
    const secret = params.get("secret")

    if (!secret) {
      throw new Error("Secret is missing")
    }

    // Get issuer from parameter if not in path
    if (!issuer && params.get("issuer")) {
      issuer = params.get("issuer")
    }

    return {
      type,
      issuer: issuer.trim() || "Unknown",
      name: name.trim() || "Account",
      secret: secret.trim(),
      algorithm: params.get("algorithm") || "SHA1",
      digits: Number.parseInt(params.get("digits") || "6", 10),
      period: Number.parseInt(params.get("period") || "30", 10),
      counter: type === "hotp" ? Number.parseInt(params.get("counter") || "0", 10) : undefined,
    }
  } catch (error) {
    console.error("Error parsing OTP URI:", error)
    return null
  }
}
