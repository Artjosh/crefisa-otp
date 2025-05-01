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
      console.log('API OTP ID - Usuário não encontrado no banco:', userId);
      return null;
    }
    
    return {
      ...userData,
      userId
    };
  } catch (error) {
    console.error('API OTP ID - Erro ao buscar usuário no banco:', error);
    return null;
  }
}

// GET - Fetch a specific OTP item
export async function GET(request, { params }) {
  console.log("API OTP ID - Requisição GET recebida")
  
  // Obter o cabeçalho de autorização
  const authHeader = request.headers.get("authorization")
  console.log("API OTP ID - Cabeçalho de autorização:", authHeader || "Não encontrado")
  
  // Extrair o token do cabeçalho
  const token = authHeader?.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : null
  
  console.log("API OTP ID - Token extraído:", token ? `${token.substring(0, 15)}...` : "Não encontrado")

  // Verificar token
  if (!token) {
    console.log("API OTP ID - Token não fornecido")
    return NextResponse.json(
      { error: "Não autorizado. Token não fornecido." },
      { status: 401 }
    )
  }

  // Verify token (no await here)
  const decoded = verifyToken(token)
  console.log("API OTP ID - Resultado da verificação do token:", decoded ? "Válido" : "Inválido")
  
  if (!decoded) {
    console.log("API OTP ID - Token inválido ou expirado")
    return NextResponse.json(
      { error: "Não autorizado. Token inválido." },
      { status: 401 }
    )
  }
    
  if (!decoded.userId) {
    console.log("API OTP ID - Token sem userId")
    return NextResponse.json(
      { error: "Não autorizado. Token inválido.", message: "Invalid Token" },
      { status: 401 },
    )
  }

  // IMPORTANTE: Buscar as informações reais do usuário no banco de dados
  const userId = decoded.userId;
  console.log("API OTP ID - Buscando dados do usuário no banco, ID:", userId);
  
  const user = await getUserFromDatabase(userId);
  
  if (!user) {
    console.log("API OTP ID - Usuário não encontrado no banco");
    return NextResponse.json(
      { error: "Usuário não encontrado ou inválido" },
      { status: 401 }
    );
  }
  
  // Verificar se usuário é admin USANDO DADOS DO BANCO
  const isAdmin = user.type === 'admin';
  console.log("API OTP ID - Usuário verificado do banco:", user.name, "Tipo:", user.type, "Admin:", isAdmin);
  
  // Se não for admin, negar acesso
  if (!isAdmin) {
    console.log("API OTP ID - Acesso negado: usuário não é admin");
    return NextResponse.json(
      { error: "Acesso permitido apenas para administradores" },
      { status: 403 }
    );
  }

  try {
    const { id } = params
    
    const db = admin.database()
    const itemRef = db.ref(`otps/${id}`)
    
    const itemSnapshot = await itemRef.once("value")
    const item = itemSnapshot.val()
    
    if (!item) {
      console.log("API OTP ID - Item não encontrado:", id);
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    
    // Verificar se o usuário é dono do item ou é admin
    if (item.userId !== userId && !isAdmin) {
      console.log("API OTP ID - Usuário não tem permissão para acessar o item");
      return NextResponse.json(
        { error: "Você não tem permissão para acessar este item" },
        { status: 403 }
      )
    }

    console.log("API OTP ID - Item recuperado com sucesso:", id);
    return NextResponse.json({ id, ...item })
  } catch (error) {
    console.error("API OTP ID - Erro ao recuperar item:", error)
    return NextResponse.json(
      { error: "Failed to fetch OTP item" },
      { status: 500 }
    )
  }
}

// PATCH - Update an OTP item
export async function PATCH(request, { params }) {
  console.log("API OTP ID - Requisição PATCH recebida")
  
  // Obter o cabeçalho de autorização
  const authHeader = request.headers.get("authorization")
  console.log("API OTP ID - Cabeçalho de autorização:", authHeader || "Não encontrado")
  
  // Extrair o token do cabeçalho
  const token = authHeader?.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : null
  
  console.log("API OTP ID - Token extraído:", token ? `${token.substring(0, 15)}...` : "Não encontrado")

  // Verificar token
  if (!token) {
    console.log("API OTP ID - Token não fornecido")
    return NextResponse.json(
      { error: "Não autorizado. Token não fornecido." },
      { status: 401 }
    )
  }

  // Verify token (no await here)
  const decoded = verifyToken(token)
  console.log("API OTP ID - Resultado da verificação do token:", decoded ? "Válido" : "Inválido")
  
  if (!decoded) {
    console.log("API OTP ID - Token inválido ou expirado")
    return NextResponse.json(
      { error: "Não autorizado. Token inválido." },
      { status: 401 }
    )
  }
    
  if (!decoded.userId) {
    console.log("API OTP ID - Token sem userId")
    return NextResponse.json(
      { error: "Não autorizado. Token inválido.", message: "Invalid Token" },
      { status: 401 },
    )
  }

  // IMPORTANTE: Buscar as informações reais do usuário no banco de dados
  const userId = decoded.userId;
  console.log("API OTP ID - Buscando dados do usuário no banco, ID:", userId);
  
  const user = await getUserFromDatabase(userId);
  
  if (!user) {
    console.log("API OTP ID - Usuário não encontrado no banco");
    return NextResponse.json(
      { error: "Usuário não encontrado ou inválido" },
      { status: 401 }
    );
  }
  
  // Verificar se usuário é admin USANDO DADOS DO BANCO
  const isAdmin = user.type === 'admin';
  console.log("API OTP ID - Usuário verificado do banco:", user.name, "Tipo:", user.type, "Admin:", isAdmin);
  
  // Se não for admin, negar acesso
  if (!isAdmin) {
    console.log("API OTP ID - Acesso negado: usuário não é admin");
    return NextResponse.json(
      { error: "Acesso permitido apenas para administradores" },
      { status: 403 }
    );
  }

  try {
    const { id } = params
    const body = await request.json()
    
    const db = admin.database()
    const itemRef = db.ref(`otps/${id}`)
    
    // Verificar se o item existe
    const itemSnapshot = await itemRef.once("value")
    const item = itemSnapshot.val()
    
    if (!item) {
      console.log("API OTP ID - Item não encontrado:", id);
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    
    // Verificar se o usuário é dono do item ou é admin
    if (item.userId !== userId && !isAdmin) {
      console.log("API OTP ID - Usuário não tem permissão para atualizar o item");
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
    
    console.log("API OTP ID - Item atualizado com sucesso:", id);
    return NextResponse.json({ id, ...updatedItem })
  } catch (error) {
    console.error("API OTP ID - Erro ao atualizar item:", error)
    return NextResponse.json(
      { error: "Failed to update OTP item" },
      { status: 500 }
    )
  }
}

// DELETE - Remove an OTP item
export async function DELETE(request, { params }) {
  console.log("API OTP ID - Requisição DELETE recebida")
  
  // Obter o cabeçalho de autorização
  const authHeader = request.headers.get("authorization")
  console.log("API OTP ID - Cabeçalho de autorização:", authHeader || "Não encontrado")
  
  // Extrair o token do cabeçalho
  const token = authHeader?.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : null
  
  console.log("API OTP ID - Token extraído:", token ? `${token.substring(0, 15)}...` : "Não encontrado")

  // Verificar token
  if (!token) {
    console.log("API OTP ID - Token não fornecido")
    return NextResponse.json(
      { error: "Não autorizado. Token não fornecido." },
      { status: 401 }
    )
  }

  // Verify token (no await here)
  const decoded = verifyToken(token)
  console.log("API OTP ID - Resultado da verificação do token:", decoded ? "Válido" : "Inválido")
  
  if (!decoded) {
    console.log("API OTP ID - Token inválido ou expirado")
    return NextResponse.json(
      { error: "Não autorizado. Token inválido." },
      { status: 401 }
    )
  }
    
  if (!decoded.userId) {
    console.log("API OTP ID - Token sem userId")
    return NextResponse.json(
      { error: "Não autorizado. Token inválido.", message: "Invalid Token" },
      { status: 401 },
    )
  }

  // IMPORTANTE: Buscar as informações reais do usuário no banco de dados
  const userId = decoded.userId;
  console.log("API OTP ID - Buscando dados do usuário no banco, ID:", userId);
  
  const user = await getUserFromDatabase(userId);
  
  if (!user) {
    console.log("API OTP ID - Usuário não encontrado no banco");
    return NextResponse.json(
      { error: "Usuário não encontrado ou inválido" },
      { status: 401 }
    );
  }
  
  // Verificar se usuário é admin USANDO DADOS DO BANCO
  const isAdmin = user.type === 'admin';
  console.log("API OTP ID - Usuário verificado do banco:", user.name, "Tipo:", user.type, "Admin:", isAdmin);
  
  // Se não for admin, negar acesso
  if (!isAdmin) {
    console.log("API OTP ID - Acesso negado: usuário não é admin");
    return NextResponse.json(
      { error: "Acesso permitido apenas para administradores" },
      { status: 403 }
    );
  }

  try {
    const { id } = params
    
    const db = admin.database()
    const itemRef = db.ref(`otps/${id}`)
    
    // Verificar se o item existe
    const itemSnapshot = await itemRef.once("value")
    const item = itemSnapshot.val()
    
    if (!item) {
      console.log("API OTP ID - Item não encontrado:", id);
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    
    // Verificar se o usuário é dono do item ou é admin
    if (item.userId !== userId && !isAdmin) {
      console.log("API OTP ID - Usuário não tem permissão para excluir o item");
      return NextResponse.json(
        { error: "Você não tem permissão para excluir este item" },
        { status: 403 }
      )
    }
    
    await itemRef.remove()
    
    console.log("API OTP ID - Item excluído com sucesso:", id);
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API OTP ID - Erro ao excluir item:", error)
    return NextResponse.json(
      { error: "Failed to delete OTP item" },
      { status: 500 }
    )
  }
}