import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '24h'

export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token) {
  console.log('JWT - Iniciando verificação, TOKEN:', token.substring(0, 20) + '...')
  console.log('JWT - SECRET:', JWT_SECRET.substring(0, 5) + '...')
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('JWT - Verificação bem-sucedida, payload:', JSON.stringify(decoded))
    return decoded
  } catch (error) {
    console.error('JWT - Erro na verificação:', error.message)
    return null
  }
}

export function decodeToken(token) {
  try {
    return jwt.decode(token)
  } catch (error) {
    return null
  }
} 