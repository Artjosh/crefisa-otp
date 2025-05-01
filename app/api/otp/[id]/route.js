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
    const itemRef = db.ref(`otp-items/${id}`)
    
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
    // Atenção: deve usar await para acessar params.id (causa do erro no terminal)
    const id = decodeURIComponent(params.id);
    const body = await request.json();
    
    const db = admin.database();
    const otpRef = db.ref(`otp-items/${id}`);
    
    // Verificar se o item existe
    const snapshot = await otpRef.once('value');
    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }
    
    const existingItem = snapshot.val();
    
    // Extrair campos de atualização
    const updates = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    // Se o usuário está tentando alterar o ID (alias)
    if (updates.newId && updates.newId !== id) {
      console.log(`API OTP ID - Tentando alterar ID de "${id}" para "${updates.newId}"`);
      
      // Verificar se o novo ID já existe
      const newIdRef = db.ref(`otp-items/${updates.newId}`);
      const newIdSnapshot = await newIdRef.once('value');
      
      if (newIdSnapshot.exists()) {
        console.log(`API OTP ID - Erro: O alias "${updates.newId}" já está em uso`);
        return NextResponse.json({ error: "O alias já está em uso" }, { status: 400 });
      }
      
      // Criar objeto atualizado (sem o campo newId)
      const updatedItem = { ...existingItem, ...updates };
      delete updatedItem.newId; // Remover newId antes de salvar
      
      // Salvar no novo local
      await newIdRef.set(updatedItem);
      console.log(`API OTP ID - Item copiado para novo ID: ${updates.newId}`);
      
      // Remover o item antigo
      await otpRef.remove();
      console.log(`API OTP ID - Item antigo removido: ${id}`);
      
      // Retornar o item atualizado com o novo ID
      return NextResponse.json({ 
        ...updatedItem,
        id: updates.newId 
      });
    }
    
    // Para atualizações que não incluem mudança de ID
    delete updates.newId; // Remover campo newId se existir
    
    // Atualizar o item
    await otpRef.update(updates);
    console.log(`API OTP ID - Item atualizado com sucesso: ${id}`);
    
    // Obter item atualizado
    const updatedSnapshot = await otpRef.once('value');
    const updatedItem = updatedSnapshot.val();
    
    return NextResponse.json({
      ...updatedItem,
      id: id
    });
  } catch (error) {
    console.error("API OTP ID - Erro ao atualizar item:", error);
    return NextResponse.json({ error: "Falha ao atualizar o item OTP" }, { status: 500 });
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
    const itemRef = db.ref(`otp-items/${id}`)
    
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