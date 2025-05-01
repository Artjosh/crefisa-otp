import { NextResponse } from "next/server"
import admin from "@/lib/firebase-admin"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { name, password } = await request.json()

    if (!name || !password) {
      return NextResponse.json(
        { error: "Nome e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const db = admin.database()
    const usersRef = db.ref("users")
    
    // Verificar se nome já existe
    const snapshot = await usersRef
      .orderByChild("name")
      .equalTo(name)
      .once("value")
    
    if (snapshot.val()) {
      return NextResponse.json(
        { error: "Nome já cadastrado" },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar novo usuário
    const newUserRef = usersRef.push()
    
    await newUserRef.set({
      name,
      password: hashedPassword,
      type: 'user', // Por padrão é usuário comum sem acesso
      createdAt: new Date().toISOString()
    })

    return NextResponse.json(
      { message: "Usuário criado com sucesso" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro no registro:", error)
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    )
  }
} 