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
      console.log('API OTP Parse - Usuário não encontrado no banco:', userId);
      return null;
    }
    
    return {
      ...userData,
      userId
    };
  } catch (error) {
    console.error('API OTP Parse - Erro ao buscar usuário no banco:', error);
    return null;
  }
}

// POST - Parse QR code data and save to database
export async function POST(request) {
  console.log("API OTP Parse - Requisição POST recebida")
  
  // Obter o cabeçalho de autorização
  const authHeader = request.headers.get("authorization")
  console.log("API OTP Parse - Cabeçalho de autorização:", authHeader || "Não encontrado")
  
  // Extrair o token do cabeçalho
  const token = authHeader?.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : null
  
  console.log("API OTP Parse - Token extraído:", token ? `${token.substring(0, 15)}...` : "Não encontrado")

  // Verificar token
  if (!token) {
    console.log("API OTP Parse - Token não fornecido")
    return NextResponse.json(
      { error: "Não autorizado. Token não fornecido." },
      { status: 401 }
    )
  }

  // Verify token (no await here)
  const decoded = verifyToken(token)
  console.log("API OTP Parse - Resultado da verificação do token:", decoded ? "Válido" : "Inválido")
  
  if (!decoded) {
    console.log("API OTP Parse - Token inválido ou expirado")
    return NextResponse.json(
      { error: "Não autorizado. Token inválido." },
      { status: 401 }
    )
  }
    
  if (!decoded.userId) {
    console.log("API OTP Parse - Token sem userId")
    return NextResponse.json(
      { error: "Não autorizado. Token inválido.", message: "Invalid Token" },
      { status: 401 },
    )
  }

  // IMPORTANTE: Buscar as informações reais do usuário no banco de dados
  const userId = decoded.userId;
  console.log("API OTP Parse - Buscando dados do usuário no banco, ID:", userId);
  
  const user = await getUserFromDatabase(userId);
  
  if (!user) {
    console.log("API OTP Parse - Usuário não encontrado no banco");
    return NextResponse.json(
      { error: "Usuário não encontrado ou inválido" },
      { status: 401 }
    );
  }
  
  // Verificar se usuário é admin USANDO DADOS DO BANCO
  const isAdmin = user.type === 'admin';
  console.log("API OTP Parse - Usuário verificado do banco:", user.name, "Tipo:", user.type, "Admin:", isAdmin);
  
  // Se não for admin, negar acesso
  if (!isAdmin) {
    console.log("API OTP Parse - Acesso negado: usuário não é admin");
    return NextResponse.json(
      { error: "Acesso permitido apenas para administradores" },
      { status: 403 }
    );
  }

  try {
    // Extrair todos os dados da requisição, incluindo forceOverwrite
    const { qrData, analyzeOnly, aliases, forceOverwrite } = await request.json();

    if (!qrData) {
      return NextResponse.json({ error: "QR code data is required" }, { status: 400 });
    }

    // Se for apenas análise, processar sem salvar no banco
    if (analyzeOnly) {
      try {
        let preview = [];
        
        if (qrData.startsWith("otpauth://")) {
          // Handle standard OTP Auth URI
          const otpData = parseOtpAuthUri(qrData);
          if (!otpData || !otpData.secret) {
            return NextResponse.json({ error: "Invalid OTP URI format" }, { status: 400 });
          }
          
          // Retornar informações sobre o OTP (sem o segredo)
          const { secret, ...safeData } = otpData;
          preview = [safeData];
          
        } else if (qrData.startsWith("otpauth-migration://")) {
          // Handle Google Authenticator migration data
          const migrationData = parseMigrationUri(qrData);
          
          if (!migrationData || migrationData.length === 0) {
            return NextResponse.json({ error: "No valid accounts found in migration data" }, { status: 400 });
          }
          
          // Preparar informações sobre os OTPs (sem segredos)
          preview = migrationData.map(item => {
            const { secret, ...safeItem } = item;
            return safeItem;
          });
        } else {
          return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 });
        }
        
        return NextResponse.json({ preview });
      } catch (error) {
        console.error("API OTP Parse - Erro ao analisar QR code:", error);
        return NextResponse.json({ error: "Failed to analyze QR code" }, { status: 500 });
      }
    }

    // Continuar com o código existente para processamento e salvamento
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
        userId: userId,
        issuer: otpData.issuer || "Unknown",
        name: otpData.name || "OTP Code",
        secret: otpData.secret,
        algorithm: otpData.algorithm || "SHA1",
        digits: otpData.digits || 6,
        period: otpData.period || 30,
        type: otpData.type || "totp",
        createdAt: new Date().toISOString(),
      }
      
      // Usar o alias fornecido (se disponível)
      let itemKey = aliases && aliases[0] ? aliases[0] : null;
      
      // Verificar se o alias já existe antes de salvar
      if (itemKey) {
        const existingRef = otpRef.child(itemKey);
        const existingSnapshot = await existingRef.once('value');
        
        // Verificar se existe E se não está forçando sobrescrever
        if (existingSnapshot.exists() && forceOverwrite !== true) {
          return NextResponse.json({ 
            error: "Alias já existe", 
            existingAlias: itemKey,
            code: "ALIAS_EXISTS"
          }, { status: 409 }); // Conflict
        }
        
        await existingRef.set(newItem);
      } else {
        const newItemRef = otpRef.push();
        itemKey = newItemRef.key;
        await newItemRef.set(newItem);
      }
      
      // Retorna o resultado sem o segredo
      const { secret, ...safeItem } = newItem;
      results.push({ id: itemKey, ...safeItem });
      
      return NextResponse.json({ 
        message: `Added ${otpData.issuer || "OTP"} account successfully!`,
        items: results 
      }, { status: 201 });
      
    } else if (qrData.startsWith("otpauth-migration://")) {
      // Handle Google Authenticator migration data
      const migrationData = parseMigrationUri(qrData)
      
      if (!migrationData || migrationData.length === 0) {
        return NextResponse.json({ error: "No valid accounts found in migration data" }, { status: 400 })
      }
      
      // Adiciona todos os items da migração
      for (let i = 0; i < migrationData.length; i++) {
        const account = migrationData[i];
        if (account && account.secret) {
          const newItem = {
            userId: userId,
            issuer: account.issuer || "Unknown",
            name: account.name || "Account",
            secret: account.secret,
            algorithm: account.algorithm || "SHA1",
            digits: account.digits || 6,
            period: account.period || 30,
            type: account.type || "totp",
            createdAt: new Date().toISOString(),
          };
          
          // Usar alias fornecido para este item (se disponível)
          let itemKey = aliases && aliases[i] ? aliases[i] : null;
          
          // Verificar se o alias já existe antes de salvar
          if (itemKey) {
            const existingRef = otpRef.child(itemKey);
            const existingSnapshot = await existingRef.once('value');
            
            // Verificar se existe E se não está forçando sobrescrever
            if (existingSnapshot.exists() && forceOverwrite !== true) {
              return NextResponse.json({ 
                error: "Um ou mais aliases já existem", 
                existingAlias: itemKey,
                code: "ALIAS_EXISTS"
              }, { status: 409 }); // Conflict
            }
            
            await existingRef.set(newItem);
          } else {
            const newItemRef = otpRef.push();
            itemKey = newItemRef.key;
            await newItemRef.set(newItem);
          }
          
          // Adiciona aos resultados sem o segredo
          const { secret, ...safeItem } = newItem;
          results.push({ id: itemKey, ...safeItem });
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
    console.error("API OTP Parse - Erro ao processar QR code:", error)
    return NextResponse.json({ error: "Failed to process QR code" }, { status: 500 })
  }
}