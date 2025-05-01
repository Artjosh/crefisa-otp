// Importação simplificada do firebase-admin
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config("../../.env.local");

// Verificar se já está inicializado para evitar erros no middleware
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      client_email: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      private_key: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    });
    
    console.log("Firebase Admin inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin:", error);
  }
}

export default admin;
