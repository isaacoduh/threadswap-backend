import jwt from 'jsonwebtoken'

export type JwtPayload = {
  sub: string
  email: string
}

const JWT_SECRET: any = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set')

const JWT_EXPIRES_IN: any = process.env.JWT_EXPIRES_IN ?? '7d'

export function signAcessToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}
