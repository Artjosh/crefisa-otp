import { NextResponse } from "next/server"
import admin from "@/lib/firebase-admin"
import { createToken } from "@/lib/jwt"
import bcrypt from "bcrypt"

export async function POST(request) {
  try {
    const { name, password } = await request.json()

    if (!name || !password) {
      return NextResponse.json(
        { error: "Nome e senha são obrigatórios" },
        { status: 400 }
      )
    }

    let db;
    try {
      db = admin.database();
    } catch (error) {
      console.error("Erro ao acessar Firebase:", error);
      // Em caso de erro, criar uma resposta de login simulada para desenvolvimento
      if (name === 'admin' && password === 'senha123') {
        const token = createToken({
          userId: 'admin123',
          name: 'admin',
          type: 'admin'
        });
        return NextResponse.json({ 
          token,
          type: 'admin',
          message: "Login simulado para desenvolvimento"
        });
      } else if (name === 'usuario' && password === 'senha123') {
        const token = createToken({
          userId: 'user123',
          name: 'usuario',
          type: 'user'
        });
        return NextResponse.json({ 
          token,
          type: 'user',
          message: "Login simulado para desenvolvimento"
        });
      } else {
        return NextResponse.json(
          { error: "Credenciais inválidas" },
          { status: 401 }
        );
      }
    }
    
    const usersRef = db.ref("users")
    
    // Buscar usuário pelo nome
    const snapshot = await usersRef
      .orderByChild("name")
      .equalTo(name)
      .once("value")
    
    const userData = snapshot.val()

    if (!userData) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      )
    }

    // Pegar o primeiro usuário encontrado
    const userId = Object.keys(userData)[0]
    const user = userData[userId]

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      )
    }

    // Criar token JWT incluindo o tipo do usuário
    const token = createToken({
      userId,
      name: user.name,
      type: user.type // Incluir tipo no token para verificação de admin
    })

    console.log("Login bem-sucedido para:", name, "- Tipo:", user.type)
    console.log("Token criado:", token.substring(0, 20) + "...")
    
    // Retornar o token no corpo da resposta
    return NextResponse.json({ 
      token,
      type: user.type // Retornar tipo para o frontend saber se é admin
    })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    )
  }
} 