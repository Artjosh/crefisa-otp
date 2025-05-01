import { NextResponse } from "next/server"
import admin from "@/lib/firebase-admin"
import * as dotenv from "dotenv"
import { verifyToken } from "@/lib/jwt"

// Forçar o carregamento do arquivo .env.local
dotenv.config({ path: ".env" })
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)

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
      console.log('API OTP - Usuário não encontrado no banco:', userId);
      return null;
    }
    
    return {
      ...userData,
      userId
    };
  } catch (error) {
    console.error('API OTP - Erro ao buscar usuário no banco:', error);
    return null;
  }
}

// Helper para obter os OTPs baseados no userId
async function getOtpsByUserId(userId) {
  const db = admin.database()
  const otpsRef = db.ref("otps")
  
  try {
    const snapshot = await otpsRef
      .orderByChild("userId")
      .equalTo(userId)
      .once("value")
    
    const otps = snapshot.val() || {}
    return Object.entries(otps).map(([id, otp]) => ({
      id,
      ...otp,
    }))
  } catch (error) {
    console.error("Erro ao buscar OTPs:", error)
    return []
  }
}

// GET - Fetch all OTP items
export async function GET(request) {
  console.log("API OTP - Requisição GET recebida")
  
  try {
    // Obter o cabeçalho de autorização
    const authHeader = request.headers.get("authorization")
    console.log("API OTP - Cabeçalho de autorização:", authHeader ? "Presente" : "Não encontrado")
    
    // Extrair o token do cabeçalho
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null
    
    console.log("API OTP - Token extraído:", token ? `${token.substring(0, 15)}...` : "Não encontrado")

    // Verificar token
    if (!token) {
      console.log("API OTP - Token não fornecido")
      return NextResponse.json(
        { error: "Não autorizado. Token não fornecido." },
        { status: 401 }
      )
    }

    // Verificar o token (apenas assinatura e expiração)
    const decoded = verifyToken(token)
    console.log("API OTP - Resultado da verificação do token:", decoded ? "Válido" : "Inválido")
    
    if (!decoded) {
      console.log("API OTP - Token inválido ou expirado")
      return NextResponse.json(
        { error: "Não autorizado. Token inválido." },
        { status: 401 }
      )
    }

    // IMPORTANTE: Buscar as informações reais do usuário no banco de dados
    const userId = decoded.userId;
    console.log("API OTP - Buscando dados do usuário no banco, ID:", userId);
    
    const user = await getUserFromDatabase(userId);
    
    if (!user) {
      console.log("API OTP - Usuário não encontrado no banco");
      return NextResponse.json(
        { error: "Usuário não encontrado ou inválido" },
        { status: 401 }
      );
    }
    
    // Verificar se usuário é admin USANDO DADOS DO BANCO
    const isAdmin = user.type === 'admin';
    console.log("API OTP - Usuário verificado do banco:", user.name, "Tipo:", user.type, "Admin:", isAdmin);
    
    // Se não for admin, negar acesso
    if (!isAdmin) {
      console.log("API OTP - Acesso negado: usuário não é admin");
      return NextResponse.json(
        { error: "Acesso permitido apenas para administradores" },
        { status: 403 }
      );
    }

    const otps = await getOtpsByUserId(userId)
    console.log("API OTP - Dados recuperados com sucesso, quantidade:", otps.length)
    
    // Retornar os dados no formato esperado pelo frontend: { items: [...] }
    return NextResponse.json({ items: otps })
  } catch (error) {
    console.error("API OTP - Erro grave na requisição:", error.message);
    console.error("API OTP - Stack:", error.stack);
    
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar requisição" },
      { status: 500 }
    )
  }
}

// POST - Create a new OTP item
export async function POST(request) {
  try {
    // Obter o cabeçalho de autorização
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

    // Verificar usuário no banco de dados
    const userId = decoded.userId;
    const user = await getUserFromDatabase(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inválido" },
        { status: 401 }
      );
    }
    
    // Verificar se é admin usando dados do banco
    if (user.type !== 'admin') {
      return NextResponse.json(
        { error: "Acesso permitido apenas para administradores" },
        { status: 403 }
      );
    }

    const body = await request.json()

    // Validate required fields
    if (!body.secret) {
      return NextResponse.json({ error: "Secret is required" }, { status: 400 })
    }

    // Definir valores padrão para campos essenciais
    const newItem = {
      userId: user.userId, // Usar o ID verificado do banco de dados
      issuer: body.issuer || "Unknown",
      name: body.name || "OTP Code",
      secret: body.secret,
      algorithm: body.algorithm || "SHA1",
      digits: body.digits || 6,
      period: body.period || 30,
      createdAt: new Date().toISOString(),
    }

    const db = admin.database()
    const ref = db.ref("otps")

    // Create a new entry with a unique key
    const newItemRef = ref.push()
    await newItemRef.set(newItem)

    return NextResponse.json({ id: newItemRef.key, ...newItem }, { status: 201 })
  } catch (error) {
    console.error("Error creating OTP item:", error)
    return NextResponse.json({ error: "Failed to create OTP item" }, { status: 500 })
  }
}
