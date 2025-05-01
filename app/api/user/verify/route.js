import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import admin from "@/lib/firebase-admin";

// Configuração para garantir que a rota seja dinâmica e não estática
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Função para buscar informações do usuário no banco de dados
// Função interna não exportada
async function getUserFromDatabase(userId) {
  if (!userId) return null;
  
  try {
    const db = admin.database();
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    if (!userData) {
      console.log('API User Verify - Usuário não encontrado no banco:', userId);
      return null;
    }
    
    return {
      ...userData,
      userId
    };
  } catch (error) {
    console.error('API User Verify - Erro ao buscar usuário no banco:', error);
    return null;
  }
}

export async function GET(request) {
  try {
    // Obter o cabeçalho de autorização
    const authHeader = request.headers.get("authorization");
    console.log("API User Verify - Cabeçalho de autorização:", authHeader || "Não encontrado");
    
    // Extrair o token do cabeçalho
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;
    
    console.log("API User Verify - Token extraído:", token ? `${token.substring(0, 15)}...` : "Não encontrado");
    
    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      );
    }
    
    // Verificar o token (apenas assinatura e expiração)
    const decoded = verifyToken(token);
    console.log("API User Verify - Token verificado:", decoded ? "Válido" : "Inválido");
    
    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }
    
    // IMPORTANTE: Buscar as informações reais do usuário no banco de dados
    const userId = decoded.userId;
    console.log("API User Verify - Buscando dados do usuário no banco, ID:", userId);
    
    const user = await getUserFromDatabase(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inválido" },
        { status: 401 }
      );
    }
    
    // Retornar os dados reais do usuário
    console.log("API User Verify - Dados do usuário encontrados:", user.name, "Tipo:", user.type);
    
    return NextResponse.json({
      userId: user.userId,
      name: user.name,
      type: user.type,
      // Não incluir informações sensíveis como senha
    });
    
  } catch (error) {
    console.error("API User Verify - Erro ao verificar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno ao verificar usuário" },
      { status: 500 }
    );
  }
} 