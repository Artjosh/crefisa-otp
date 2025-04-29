import admin from "firebase-admin"
import * as dotenv from "dotenv"

// Forçar o carregamento do arquivo .env.local
dotenv.config({ path: ".env.local" })

// Verificar as variáveis de ambiente
console.log("=== VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE ===")
console.log("ENV:", Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_FIREBASE')))
console.log("======================================")

// Check if Firebase is already initialized
if (!admin.apps.length) {
  try {
    // Usar as variáveis com prefixo NEXT_PUBLIC_
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    const rawPrivateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY
    
    // Validação básica
    if (!projectId || !clientEmail || !rawPrivateKey || !databaseURL) {
      console.error("Variáveis NEXT_PUBLIC_FIREBASE não encontradas:")
      console.error("projectId:", !!projectId)
      console.error("clientEmail:", !!clientEmail)
      console.error("privateKey:", !!rawPrivateKey)
      console.error("databaseURL:", !!databaseURL)
      throw new Error("Variáveis de ambiente do Firebase não encontradas")
    }
    
    // Processar a chave privada - substituir \n por quebras de linha reais
    const privateKey = rawPrivateKey.replace(/\\n/g, "\n")
    
    console.log("Inicializando Firebase com variáveis NEXT_PUBLIC_")
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL,
    })
    
    console.log("Firebase Admin initialized successfully")
  } catch (error) {
    console.error("Firebase admin initialization error:", error)
  }
}

export default admin
