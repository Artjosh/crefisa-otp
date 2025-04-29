import { NextResponse } from "next/server"
import admin from "@/lib/firebase-admin"
import * as dotenv from "dotenv"

// Forçar o carregamento do arquivo .env.local
dotenv.config({ path: ".env.local" })
console.log('artjosh')
console.log('artjosh')
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)

// Configuração para garantir que a rota seja dinâmica e não estática
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all OTP items
export async function GET() {
  try {
    const db = admin.database()
    const ref = db.ref("otp-items")

    const snapshot = await ref.once("value")
    const data = snapshot.val() || {}

    // Convert object to array with keys as id
    const items = Object.entries(data).map(([id, item]) => ({
      id,
      ...item,
    }))

    return NextResponse.json({ items }, { status: 200 })
  } catch (error) {
    console.error("Error fetching OTP items:", error)
    return NextResponse.json({ error: "Failed to fetch OTP items" }, { status: 500 })
  }
}

// POST - Create a new OTP item
export async function POST(request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.secret) {
      return NextResponse.json({ error: "Secret is required" }, { status: 400 })
    }

    // Definir valores padrão para campos essenciais
    const newItem = {
      issuer: body.issuer || "Unknown",
      name: body.name || "OTP Code",
      secret: body.secret,
      algorithm: body.algorithm || "SHA1",
      digits: body.digits || 6,
      period: body.period || 30,
      createdAt: new Date().toISOString(),
    }

    const db = admin.database()
    const ref = db.ref("otp-items")

    // Create a new entry with a unique key
    const newItemRef = ref.push()
    await newItemRef.set(newItem)

    return NextResponse.json({ id: newItemRef.key, ...newItem }, { status: 201 })
  } catch (error) {
    console.error("Error creating OTP item:", error)
    return NextResponse.json({ error: "Failed to create OTP item" }, { status: 500 })
  }
}
