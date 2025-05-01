import { NextResponse } from "next/server"
import admin from "@/lib/firebase-admin"
import { verifyToken } from "@/lib/jwt"

// Configuração para garantir que a rota seja dinâmica e não estática
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Função para buscar informações do usuário no banco de dados
async function getUserFromDatabase(userId) {
  if (!userId) return null;
  
  try {
    const db = admin.database();
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    if (!userData) {
      return null;
    }
    
    return {
      ...userData,
      userId
    };
  } catch (error) {
    console.error('Erro ao buscar usuário no banco:', error);
    return null;
  }
}

// GET - Fetch a specific OTP item
export async function GET(request, { params }) {
  try {
    // Obter o token de autorização
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null
    
    if (!token) {
      return NextResponse.json(
        { error: "Não autorizado. Token não fornecido." },
        { status: 401 }
      )
    }

    // Verificar o token
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: "Não autorizado. Token inválido." },
        { status: 401 }
      )
    }

    // Buscar as informações do usuário no banco de dados
    const userId = decoded.userId;
    const user = await getUserFromDatabase(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inválido" },
        { status: 401 }
      );
    }
    
    // Verificar se é admin
    const isAdmin = user.type === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso permitido apenas para administradores" },
        { status: 403 }
      );
    }

    const { id } = params
    
    const db = admin.database()
    const itemRef = db.ref(`otps/${id}`)
    
    const itemSnapshot = await itemRef.once("value")
    const item = itemSnapshot.val()
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    
    // Verificar se o usuário é dono do item ou é admin
    if (item.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar este item" },
        { status: 403 }
      )
    }

    return NextResponse.json({ id, ...item })
  } catch (error) {
    console.error("Error fetching OTP item:", error)
    return NextResponse.json(
      { error: "Failed to fetch OTP item" },
      { status: 500 }
    )
  }
}

// PATCH - Update an OTP item
export async function PATCH(request, { params }) {
  try {
    // Obter o token de autorização
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null
    
    if (!token) {
      return NextResponse.json(
        { error: "Não autorizado. Token não fornecido." },
        { status: 401 }
      )
    }

    // Verificar o token
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: "Não autorizado. Token inválido." },
        { status: 401 }
      )
    }

    // Buscar as informações do usuário no banco de dados
    const userId = decoded.userId;
    const user = await getUserFromDatabase(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inválido" },
        { status: 401 }
      );
    }
    
    // Verificar se é admin
    const isAdmin = user.type === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso permitido apenas para administradores" },
        { status: 403 }
      );
    }

    const { id } = params
    const body = await request.json()
    
    const db = admin.database()
    const itemRef = db.ref(`otps/${id}`)
    
    // Verificar se o item existe
    const itemSnapshot = await itemRef.once("value")
    const item = itemSnapshot.val()
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    
    // Verificar se o usuário é dono do item ou é admin
    if (item.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para atualizar este item" },
        { status: 403 }
      )
    }
    
    // Atualizar apenas os campos permitidos
    const update = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.issuer !== undefined && { issuer: body.issuer }),
      ...(body.algorithm !== undefined && { algorithm: body.algorithm }),
      ...(body.digits !== undefined && { digits: body.digits }),
      ...(body.period !== undefined && { period: body.period }),
      updatedAt: new Date().toISOString()
    }
    
    // Não permitir atualização do secret por questões de segurança
    
    await itemRef.update(update)
    
    // Obter o item atualizado
    const updatedSnapshot = await itemRef.once("value")
    const updatedItem = updatedSnapshot.val()
    
    return NextResponse.json({ id, ...updatedItem })
  } catch (error) {
    console.error("Error updating OTP item:", error)
    return NextResponse.json(
      { error: "Failed to update OTP item" },
      { status: 500 }
    )
  }
}

// DELETE - Remove an OTP item
export async function DELETE(request, { params }) {
  try {
    // Obter o token de autorização
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null
    
    if (!token) {
      return NextResponse.json(
        { error: "Não autorizado. Token não fornecido." },
        { status: 401 }
      )
    }

    // Verificar o token
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: "Não autorizado. Token inválido." },
        { status: 401 }
      )
    }

    // Buscar as informações do usuário no banco de dados
    const userId = decoded.userId;
    const user = await getUserFromDatabase(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inválido" },
        { status: 401 }
      );
    }
    
    // Verificar se é admin
    const isAdmin = user.type === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso permitido apenas para administradores" },
        { status: 403 }
      );
    }

    const { id } = params
    
    const db = admin.database()
    const itemRef = db.ref(`otps/${id}`)
    
    // Verificar se o item existe
    const itemSnapshot = await itemRef.once("value")
    const item = itemSnapshot.val()
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    
    // Verificar se o usuário é dono do item ou é admin
    if (item.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para excluir este item" },
        { status: 403 }
      )
    }
    
    await itemRef.remove()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting OTP item:", error)
    return NextResponse.json(
      { error: "Failed to delete OTP item" },
      { status: 500 }
    )
  }
}
