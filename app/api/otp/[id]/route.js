import { NextResponse } from "next/server"
import admin from "@/lib/firebase-admin"

// Configuração para garantir que a rota seja dinâmica e não estática
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch a specific OTP item
export async function GET(request, { params }) {
  try {
    const { id } = params

    const db = admin.database()
    const ref = db.ref(`otp-items/${id}`)

    const snapshot = await ref.once("value")
    const item = snapshot.val()

    if (!item) {
      return NextResponse.json({ error: "OTP item not found" }, { status: 404 })
    }

    return NextResponse.json({ id, ...item }, { status: 200 })
  } catch (error) {
    console.error("Error fetching OTP item:", error)
    return NextResponse.json({ error: "Failed to fetch OTP item" }, { status: 500 })
  }
}

// PATCH - Update an OTP item
export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()

    const db = admin.database()
    const ref = db.ref(`otp-items/${id}`)

    // Check if item exists
    const snapshot = await ref.once("value")
    if (!snapshot.exists()) {
      return NextResponse.json({ error: "OTP item not found" }, { status: 404 })
    }

    // Don't allow updating the secret for security reasons
    const { secret, ...updateData } = body

    // Update the item
    await ref.update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })

    // Get the updated item
    const updatedSnapshot = await ref.once("value")
    const updatedItem = updatedSnapshot.val()

    return NextResponse.json({ id, ...updatedItem }, { status: 200 })
  } catch (error) {
    console.error("Error updating OTP item:", error)
    return NextResponse.json({ error: "Failed to update OTP item" }, { status: 500 })
  }
}

// DELETE - Delete an OTP item
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const db = admin.database()
    const ref = db.ref(`otp-items/${id}`)

    // Check if item exists
    const snapshot = await ref.once("value")
    if (!snapshot.exists()) {
      return NextResponse.json({ error: "OTP item not found" }, { status: 404 })
    }

    // Delete the item
    await ref.remove()

    return NextResponse.json({ message: "OTP item deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting OTP item:", error)
    return NextResponse.json({ error: "Failed to delete OTP item" }, { status: 500 })
  }
}
