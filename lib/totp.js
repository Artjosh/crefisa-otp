// Import jsSHA dynamically on the client side
let jsSHA

/**
 * Gera um código TOTP (Time-based One-Time Password) baseado em um segredo
 * 
 * @param {string} secret - A chave secreta em formato Base32
 * @param {Object} options - Opções de configuração
 * @param {number} options.digits - Número de dígitos do código (padrão: 6)
 * @param {string} options.algorithm - Algoritmo de hash (padrão: 'SHA1')
 * @param {number} options.period - Período de validade em segundos (padrão: 30)
 * @returns {Promise<string>} - Código TOTP
 */
export async function generateTOTP(secret, options = {}) {
  // Default options
  const { digits = 6, algorithm = "SHA1", period = 30 } = options

  // Calculate the counter value based on the current time
  const counter = Math.floor(Date.now() / 1000 / period)

  // Create a cache key
  const cacheKey = `${secret}-${counter}-${algorithm}-${digits}`

  // Check if we already calculated this code
  if (memoCache.has(cacheKey)) {
    return memoCache.get(cacheKey)
  }

  // Load jsSHA dynamically if not already loaded
  if (!jsSHA) {
    try {
      jsSHA = (await import("jssha")).default
    } catch (error) {
      console.error("Failed to load jsSHA:", error)
      return "".padStart(digits, "0")
    }
  }

  try {
    // Remove spaces and padding from the secret
    const cleanSecret = secret.replace(/\s/g, "").replace(/=+$/, "").toUpperCase()

    // Convert the secret from base32 to bytes
    const key = base32ToBytes(cleanSecret)

    // Convert counter to buffer
    const counterBuffer = new ArrayBuffer(8)
    const counterView = new DataView(counterBuffer)
    counterView.setBigUint64(0, BigInt(counter), false) // Big-endian

    // Create a Uint8Array from the counter buffer
    const counterBytes = new Uint8Array(counterBuffer)

    // Create HMAC
    const shaObj = new jsSHA(`SHA-${algorithm.replace("SHA", "")}`, "UINT8ARRAY")
    shaObj.setHMACKey(new Uint8Array(key), "UINT8ARRAY")
    shaObj.update(counterBytes)
    const hmac = shaObj.getHMAC("UINT8ARRAY")

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0xf
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)

    // Generate TOTP code
    const otp = binary % Math.pow(10, digits)

    // Pad with leading zeros if necessary
    const result = otp.toString().padStart(digits, "0")

    // Store in cache
    memoCache.set(cacheKey, result)

    // Clean up cache to prevent memory leaks (keep only last 10 entries)
    if (memoCache.size > 10) {
      const firstKey = memoCache.keys().next().value
      memoCache.delete(firstKey)
    }

    return result
  } catch (error) {
    console.error("Error generating TOTP:", error, "for secret:", secret)
    return "".padStart(digits, "0")
  }
}

/**
 * Converte uma string Base32 em um array de bytes
 * 
 * @param {string} base32 - String Base32
 * @returns {Uint8Array} - Array de bytes
 */
function base32ToBytes(base32) {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  const bytes = []

  // Remove spaces and padding
  base32 = base32.replace(/\s/g, "").replace(/=+$/, "").toUpperCase()

  // Convert base32 to a string of bits
  for (let i = 0; i < base32.length; i++) {
    const val = base32Chars.indexOf(base32.charAt(i))
    if (val === -1) continue // Skip invalid characters
    bits += val.toString(2).padStart(5, "0")
  }

  // Convert bits to bytes
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.substr(i, 8), 2))
  }

  return bytes
}

// Add memoization to avoid recalculating the same code multiple times
const memoCache = new Map()
