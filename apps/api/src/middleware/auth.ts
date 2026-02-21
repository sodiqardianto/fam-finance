import { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify, JWTVerifyResult, JWTPayload, decodeJwt } from 'jose';

// Supabase JWT Payload interface
interface SupabaseJwtPayload extends JWTPayload {
  sub: string;  // User UID
  email?: string;
  phone?: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: {
    avatar_url?: string;
    email?: string;
    email_verified?: boolean;
    full_name?: string;
    name?: string;
    picture?: string;
    provider_id?: string;
    sub?: string;
  };
  role?: string;
  aal?: string;
  amr?: { method: string; timestamp: number }[];
  session_id?: string;
  is_anonymous?: boolean;
}

// Load env vars
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// JWKS Initialization
// ============================================
const JWKS_URL = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` : '';
let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksInitialized = false;
let jwksError: string | null = null;

async function initJWKS(): Promise<boolean> {
  if (jwksInitialized) return JWKS !== null;
  
  if (!SUPABASE_URL || !JWKS_URL) {
    jwksError = 'SUPABASE_URL not configured';
    jwksInitialized = true;
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(JWKS_URL, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const jwksData = await response.json();
    
    if (!jwksData.keys || jwksData.keys.length === 0) {
      throw new Error('JWKS response has no keys');
    }
    
    JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    jwksInitialized = true;
    jwksError = null;
    return true;
    
  } catch (error: any) {
    jwksError = error.message;
    jwksInitialized = true;
    console.error('❌ Failed to fetch JWKS:', error.message);
    return false;
  }
}

// Initialize on module load
const jwksPromise = initJWKS();

// Extend Hono Context Variable types
declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: SupabaseJwtPayload;
  }
}

// ============================================
// Alternative: Verify via Supabase Auth API
// ============================================
async function verifyTokenViaSupabaseAPI(token: string): Promise<SupabaseJwtPayload | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const userData = await response.json();
    
    // Reconstruct JWT payload shape
    return {
      sub: userData.id,
      email: userData.email,
      user_metadata: userData.user_metadata || {},
      app_metadata: userData.app_metadata || {},
      role: userData.role,
    } as SupabaseJwtPayload;
    
  } catch (error: any) {
    console.error('Supabase API verification failed:', error.message);
    return null;
  }
}

// ============================================
// Main Auth Middleware
// ============================================
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  // Decode untuk debugging
  let decodedPayload: any;
  try {
    decodedPayload = decodeJwt(token);
  } catch (e) {
    return c.json({ error: 'Invalid JWT format' }, 401);
  }

  // Cek expiration
  if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
    return c.json({ error: 'Token expired' }, 401);
  }

  // ============================================
  // Method 1: JWKS Verification
  // ============================================
  if (!jwksInitialized) {
    await jwksPromise;
  }

  if (JWKS) {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: decodedPayload.iss, // Use issuer from token
        audience: decodedPayload.aud || 'authenticated',
      }) as JWTVerifyResult<SupabaseJwtPayload>;

      c.set('jwtPayload', payload);
      await next();
      return;
      
    } catch (jwksError: any) {
      // Continue to fallback
    }
  }

  // ============================================
  // Method 2: Supabase Auth API (Fallback)
  // ============================================
  const userData = await verifyTokenViaSupabaseAPI(token);
  
  if (userData) {
    c.set('jwtPayload', userData);
    await next();
    return;
  }

  // ============================================
  // Method 3: Development Mode (Skip verification)
  // ============================================
  if (NODE_ENV === 'development' && decodedPayload) {
    c.set('jwtPayload', decodedPayload as SupabaseJwtPayload);
    await next();
    return;
  }

  // All methods failed
  return c.json({ 
    error: 'Unauthorized - Invalid token',
    details: {
      jwksAvailable: !!JWKS,
      jwksError: jwksError,
      supabaseUrl: SUPABASE_URL ? 'configured' : 'missing',
    }
  }, 401);
}

// ============================================
// Helper Functions
// ============================================
export function getSupabaseUid(c: Context): string | null {
  const payload = c.get('jwtPayload') as SupabaseJwtPayload | undefined;
  return payload?.sub || null;
}

export function getUserEmail(c: Context): string | null {
  const payload = c.get('jwtPayload') as SupabaseJwtPayload | undefined;
  return payload?.email || payload?.user_metadata?.email || null;
}

export function getUserName(c: Context): string | null {
  const payload = c.get('jwtPayload') as SupabaseJwtPayload | undefined;
  return payload?.user_metadata?.full_name || 
         payload?.user_metadata?.name || 
         null;
}

export function getAvatarUrl(c: Context): string | null {
  const payload = c.get('jwtPayload') as SupabaseJwtPayload | undefined;
  return payload?.user_metadata?.avatar_url || 
         payload?.user_metadata?.picture || 
         null;
}
