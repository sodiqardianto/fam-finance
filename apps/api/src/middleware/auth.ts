import { Context, Next } from 'hono';
import { jwtVerify, decodeJwt, JWTPayload } from 'jose';

interface AuthJwtPayload extends JWTPayload {
  sub: string;  // User External ID (Google ID)
  email?: string;
  name?: string;
  picture?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-fallback-secret-for-dev';
const NODE_ENV = process.env.NODE_ENV || 'development';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // 1. Coba verifikasi secara resmi jika di Production
    if (NODE_ENV === 'production') {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      c.set('jwtPayload', payload as AuthJwtPayload);
      await next();
      return;
    }

    // 2. Jika di Development, coba decode sebagai JWT standard
    try {
      const decoded = decodeJwt(token) as AuthJwtPayload;
      c.set('jwtPayload', decoded);
      await next();
      return;
    } catch (e) {
      // 3. Fallback Khusus Development: Decode Base64 JSON (Mock Token)
      // Ini menangani token yang dibuat dengan btoa(JSON.stringify(...)) di frontend
      const base64Payload = token;
      const jsonPayload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
      
      if (jsonPayload && jsonPayload.sub) {
        c.set('jwtPayload', jsonPayload as AuthJwtPayload);
        await next();
        return;
      }
      throw new Error('Invalid Mock Token structure');
    }
    
  } catch (error: any) {
    console.error('Auth verification failed:', error.message);
    return c.json({ 
      error: 'Unauthorized - Invalid token',
      details: NODE_ENV === 'development' ? error.message : undefined
    }, 401);
  }
}

export function getExternalId(c: Context): string | null {
  const payload = c.get('jwtPayload') as AuthJwtPayload | undefined;
  return payload?.sub || null;
}

export function getUserEmail(c: Context): string | null {
  const payload = c.get('jwtPayload') as AuthJwtPayload | undefined;
  return payload?.email || null;
}

export function getUserName(c: Context): string | null {
  const payload = c.get('jwtPayload') as AuthJwtPayload | undefined;
  return payload?.name || null;
}

export function getAvatarUrl(c: Context): string | null {
  const payload = c.get('jwtPayload') as AuthJwtPayload | undefined;
  return payload?.picture || null;
}
