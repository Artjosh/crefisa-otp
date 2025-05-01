import { NextResponse } from "next/server"
import admin from "@/lib/firebase-admin"
import { verifyToken } from "@/lib/jwt"
import { parseOtpAuthUri } from "@/lib/qr-decoder" 
import { parseMigrationUri } from "@/lib/migration-parser"

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

// POST - Parse QR code data and save to database
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
    
    // Continuar com a lógica existente
    const { qrData } = await request.json()
    
    if (!qrData) {
      return NextResponse.json({ error: "QR code data is required" }, { status: 400 })
    }
    
    const db = admin.database()
    const otpRef = db.ref("otp-items")
    let results = []
    
    if (qrData.startsWith("otpauth://")) {
      // Handle standard OTP Auth URI
      const otpData = parseOtpAuthUri(qrData)
      if (!otpData || !otpData.secret) {
        return NextResponse.json({ error: "Invalid OTP URI format" }, { status: 400 })
      }
      
      // Cria um novo item OTP
      const newItem = {
        userId: userId, // Adiciona o ID do usuário verificado
        issuer: otpData.issuer || "Unknown",
        name: otpData.name || "OTP Code",
        secret: otpData.secret,
        algorithm: otpData.algorithm || "SHA1",
        digits: otpData.digits || 6,
        period: otpData.period || 30,
        type: otpData.type || "totp",
        createdAt: new Date().toISOString(),
      }
      
      // Salva no banco de dados
      const newItemRef = otpRef.push()
      await newItemRef.set(newItem)
      
      // Retorna o resultado sem o segredo
      const { secret, ...safeItem } = newItem
      results.push({ id: newItemRef.key, ...safeItem })
      
      return NextResponse.json({ 
        message: `Added ${otpData.issuer || "OTP"} account successfully!`,
        items: results 
      }, { status: 201 })
      
    } else if (qrData.startsWith("otpauth-migration://")) {
      // Handle Google Authenticator migration data
      const migrationData = parseMigrationUri(qrData)
      
      if (!migrationData || migrationData.length === 0) {
        return NextResponse.json({ error: "No valid accounts found in migration data" }, { status: 400 })
      }
      
      // Adiciona todos os items da migração
      for (const account of migrationData) {
        if (account && account.secret) {
          const newItem = {
            userId: userId, // Adiciona o ID do usuário verificado
            issuer: account.issuer || "Unknown",
            name: account.name || "Account",
            secret: account.secret,
            algorithm: account.algorithm || "SHA1",
            digits: account.digits || 6,
            period: account.period || 30,
            type: account.type || "totp",
            createdAt: new Date().toISOString(),
          }
          
          // Salva no banco de dados
          const newItemRef = otpRef.push()
          await newItemRef.set(newItem)
          
          // Adiciona aos resultados sem o segredo
          const { secret, ...safeItem } = newItem
          results.push({ id: newItemRef.key, ...safeItem })
        }
      }
      
      return NextResponse.json({ 
        message: `Added ${results.length} account(s) from Google Authenticator!`,
        items: results 
      }, { status: 201 })
      
    } else {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing QR code:", error)
    return NextResponse.json({ error: "Failed to process QR code" }, { status: 500 })
  }
} 