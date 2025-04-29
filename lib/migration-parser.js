/**
 * Parser for Google Authenticator migration data
 * Based on the otpauth-migration:// protocol
 *
 * This implementation uses a proper approach to parse the protobuf format
 * used by Google Authenticator for migration QR codes.
 */

// Helper function to decode base64 with proper padding
function decodeBase64(data) {
  // Add padding if needed
  const paddingNeeded = data.length % 4
  if (paddingNeeded) {
    data += "=".repeat(4 - paddingNeeded)
  }

  try {
    // Try URL-safe base64 decode by replacing characters
    const safeData = data.replace(/-/g, "+").replace(/_/g, "/")

    // Use the built-in atob function to decode
    const binaryString = atob(safeData)

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return bytes
  } catch (e) {
    console.error("Failed to decode base64:", e)
    return null
  }
}

/**
 * Parse Google Authenticator migration URI
 * @param {string} uri - The otpauth-migration:// URI
 * @returns {Array} - Array of OTP items extracted from the migration data
 */
export function parseMigrationUri(uri) {
  if (!uri.startsWith("otpauth-migration://offline?data=")) {
    return null
  }

  try {
    // Extract data parameter
    const dataParam = uri.split("?data=")[1]

    // URL decode the data
    const decodedParam = decodeURIComponent(dataParam)

    // Decode base64 to binary
    const binaryData = decodeBase64(decodedParam)
    if (!binaryData) {
      throw new Error("Failed to decode base64 data")
    }

    console.log("Decoded binary data length:", binaryData.length)

    // Parse the protobuf data
    // Google Authenticator uses a specific protobuf format
    // We need to manually parse it since we don't have the .proto file
    return parseProtobufData(binaryData)
  } catch (error) {
    console.error("Error parsing migration data:", error)
    return null
  }
}

/**
 * Parse the protobuf binary data from Google Authenticator
 * @param {Uint8Array} data - The binary protobuf data
 * @returns {Array} - Array of OTP items
 */
function parseProtobufData(data) {
  // The result array that will hold all the parsed OTP accounts
  const otpAccounts = []

  // Current position in the binary data
  let pos = 0

  // Read a varint (variable-length integer) from the data
  function readVarint() {
    let result = 0
    let shift = 0
    let byte

    do {
      if (pos >= data.length) {
        throw new Error("Unexpected end of data while reading varint")
      }

      byte = data[pos++]
      result |= (byte & 0x7f) << shift
      shift += 7
    } while (byte & 0x80)

    return result
  }

  // Read a specific number of bytes from the data
  function readBytes(length) {
    if (pos + length > data.length) {
      throw new Error("Unexpected end of data while reading bytes")
    }

    const bytes = data.slice(pos, pos + length)
    pos += length
    return bytes
  }

  // Read a string from the data
  function readString(length) {
    const bytes = readBytes(length)
    return new TextDecoder().decode(bytes)
  }

  // Read a field from the protobuf data
  function readField() {
    if (pos >= data.length) {
      return null // End of data
    }

    const tag = readVarint()
    const fieldNumber = tag >> 3
    const wireType = tag & 0x7

    let value

    switch (wireType) {
      case 0: // Varint
        value = readVarint()
        break
      case 1: // 64-bit
        value = readBytes(8)
        break
      case 2: // Length-delimited
        const length = readVarint()
        value = { length, bytes: readBytes(length) }
        break
      case 5: // 32-bit
        value = readBytes(4)
        break
      default:
        throw new Error(`Unsupported wire type: ${wireType}`)
    }

    return { fieldNumber, wireType, value }
  }

  // Try to parse the outer message (MigrationPayload)
  try {
    // Read the outer message
    while (pos < data.length) {
      const field = readField()
      if (!field) break

      // Field 1 in the outer message is the OtpParameters repeated field
      if (field.fieldNumber === 1 && field.wireType === 2) {
        // This is a nested message (OtpParameters)
        const otpParamData = field.value.bytes
        const otpAccount = parseOtpParameters(otpParamData)
        if (otpAccount) {
          otpAccounts.push(otpAccount)
        }
      }
    }
  } catch (error) {
    console.error("Error parsing protobuf data:", error)
  }

  return otpAccounts
}

/**
 * Parse a single OtpParameters message from the protobuf data
 * @param {Uint8Array} data - The binary data for a single OTP account
 * @returns {Object} - An OTP account object
 */
function parseOtpParameters(data) {
  let secret = null
  let name = ""
  let issuer = ""
  let type = "totp"
  let algorithm = "SHA1"
  let digits = 6
  let counter = 0
  const period = 30

  // Current position in the binary data
  let pos = 0

  // Read a varint (variable-length integer) from the data
  function readVarint() {
    let result = 0
    let shift = 0
    let byte

    do {
      if (pos >= data.length) {
        throw new Error("Unexpected end of data while reading varint")
      }

      byte = data[pos++]
      result |= (byte & 0x7f) << shift
      shift += 7
    } while (byte & 0x80)

    return result
  }

  // Read a specific number of bytes from the data
  function readBytes(length) {
    if (pos + length > data.length) {
      throw new Error("Unexpected end of data while reading bytes")
    }

    const bytes = data.slice(pos, pos + length)
    pos += length
    return bytes
  }

  // Read a string from the data
  function readString(length) {
    const bytes = readBytes(length)
    return new TextDecoder().decode(bytes)
  }

  // Read a field from the protobuf data
  function readField() {
    if (pos >= data.length) {
      return null // End of data
    }

    const tag = readVarint()
    const fieldNumber = tag >> 3
    const wireType = tag & 0x7

    let value

    switch (wireType) {
      case 0: // Varint
        value = readVarint()
        break
      case 1: // 64-bit
        value = readBytes(8)
        break
      case 2: // Length-delimited
        const length = readVarint()
        value = { length, bytes: readBytes(length) }
        break
      case 5: // 32-bit
        value = readBytes(4)
        break
      default:
        throw new Error(`Unsupported wire type: ${wireType}`)
    }

    return { fieldNumber, wireType, value }
  }

  // Parse the OtpParameters message
  try {
    while (pos < data.length) {
      const field = readField()
      if (!field) break

      switch (field.fieldNumber) {
        case 1: // secret (bytes)
          if (field.wireType === 2) {
            secret = field.value.bytes
          }
          break
        case 2: // name (string)
          if (field.wireType === 2) {
            name = new TextDecoder().decode(field.value.bytes)
          }
          break
        case 3: // issuer (string)
          if (field.wireType === 2) {
            issuer = new TextDecoder().decode(field.value.bytes)
          }
          break
        case 4: // algorithm (enum)
          if (field.wireType === 0) {
            // 1 = SHA1, 2 = SHA256, 3 = SHA512, etc.
            const algoMap = {
              1: "SHA1",
              2: "SHA256",
              3: "SHA512",
            }
            algorithm = algoMap[field.value] || "SHA1"
          }
          break
        case 5: // digits (enum)
          if (field.wireType === 0) {
            // 1 = 6 digits, 2 = 8 digits
            digits = field.value === 2 ? 8 : 6
          }
          break
        case 6: // type (enum)
          if (field.wireType === 0) {
            // 1 = HOTP, 2 = TOTP
            type = field.value === 1 ? "hotp" : "totp"
          }
          break
        case 7: // counter (int64)
          if (field.wireType === 0) {
            counter = field.value
          }
          break
      }
    }

    // Convert secret to base32 for OTP generation
    if (secret) {
      const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
      let base32Secret = ""

      // Process 5 bits at a time
      let bits = 0
      let bitsCount = 0

      for (let i = 0; i < secret.length; i++) {
        bits = (bits << 8) | secret[i]
        bitsCount += 8

        while (bitsCount >= 5) {
          bitsCount -= 5
          base32Secret += base32Chars[(bits >> bitsCount) & 0x1f]
        }
      }

      // Handle remaining bits if any
      if (bitsCount > 0) {
        bits = bits << (5 - bitsCount)
        base32Secret += base32Chars[bits & 0x1f]
      }

      // Create the OTP account object
      return {
        type,
        issuer: issuer || "Unknown",
        name: name || "Account",
        secret: base32Secret,
        algorithm,
        digits,
        period: type === "totp" ? period : undefined,
        counter: type === "hotp" ? counter : undefined,
      }
    }
  } catch (error) {
    console.error("Error parsing OTP parameters:", error)
  }

  return null
}
