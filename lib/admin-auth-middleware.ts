/**
 * Admin Authentication and Authorization Middleware
 * Provides comprehensive security checks for email management endpoints
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
  statusCode?: number;
}

export interface PermissionCheck {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'test' | 'admin';
}

// Admin permission levels
export const ADMIN_PERMISSIONS = {
  EMAIL_CONFIG_READ: 'email:config:read',
  EMAIL_CONFIG_WRITE: 'email:config:write',
  EMAIL_CONFIG_DELETE: 'email:config:delete',
  EMAIL_TEMPLATE_READ: 'email:template:read',
  EMAIL_TEMPLATE_WRITE: 'email:template:write',
  EMAIL_TEMPLATE_DELETE: 'email:template:delete',
  EMAIL_TEST_SEND: 'email:test:send',
  EMAIL_ANALYTICS_READ: 'email:analytics:read',
  EMAIL_LOGS_READ: 'email:logs:read',
  EMAIL_LOGS_EXPORT: 'email:logs:export',
  SYSTEM_ADMIN: 'system:admin'
} as const;

// Rate limiting for admin operations
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Validate session and extract user
export async function validateAdminSession(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract token from Authorization header or cookie
    let token: string | null = null;
    
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie-based auth
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/sb-access-token=([^;]+)/);
        if (tokenMatch) {
          token = decodeURIComponent(tokenMatch[1]);
        }
      }
    }
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        statusCode: 401
      };
    }
    
    // Validate token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401
      };
    }
    
    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'admin_users')
      .single();
    
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return {
        success: false,
        error: 'Failed to verify admin status',
        statusCode: 500
      };
    }
    
    let adminUsers: any[] = [];
    if (adminCheck?.setting_value) {
      try {
        adminUsers = JSON.parse(adminCheck.setting_value as string);
      } catch (parseError) {
        console.error('Error parsing admin users:', parseError);
        return {
          success: false,
          error: 'Invalid admin configuration',
          statusCode: 500
        };
      }
    }
    
    const adminUser = adminUsers.find(admin => 
      admin.email === user.email || admin.id === user.id
    );
    
    if (!adminUser) {
      return {
        success: false,
        error: 'Insufficient permissions - admin access required',
        statusCode: 403
      };
    }
    
    // Check rate limiting
    if (!checkRateLimit(user.id)) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        statusCode: 429
      };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email!,
        role: adminUser.role || 'admin',
        permissions: adminUser.permissions || [ADMIN_PERMISSIONS.SYSTEM_ADMIN]
      }
    };
    
  } catch (error) {
    console.error('Error in validateAdminSession:', error);
    return {
      success: false,
      error: 'Internal authentication error',
      statusCode: 500
    };
  }
}

// Check specific permissions
export function hasPermission(user: AdminUser, permission: string): boolean {
  // System admin has all permissions
  if (user.permissions.includes(ADMIN_PERMISSIONS.SYSTEM_ADMIN)) {
    return true;
  }
  
  return user.permissions.includes(permission);
}

// Validate permissions for specific operations
export function validatePermissions(user: AdminUser, checks: PermissionCheck[]): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const check of checks) {
    const permission = `${check.resource}:${check.action}`;
    if (!hasPermission(user, permission)) {
      missing.push(permission);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Secure session handling for admin operations
export async function createSecureAdminSession(userId: string, permissions: string[]): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Create session token with expiration
  const sessionData = {
    userId,
    permissions,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
  };
  
  // Store session in database
  const { data: session, error } = await supabase
    .from('admin_sessions')
    .insert({
      user_id: userId,
      session_data: sessionData,
      expires_at: sessionData.expiresAt
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error('Failed to create admin session');
  }
  
  return session.id;
}

// Validate and refresh admin session
export async function validateSecureSession(sessionId: string): Promise<AuthResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('is_active', true)
    .single();
  
  if (error || !session) {
    return {
      success: false,
      error: 'Invalid session',
      statusCode: 401
    };
  }
  
  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    // Deactivate expired session
    await supabase
      .from('admin_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
    
    return {
      success: false,
      error: 'Session expired',
      statusCode: 401
    };
  }
  
  const sessionData = session.session_data;
  
  return {
    success: true,
    user: {
      id: sessionData.userId,
      email: '', // Will be populated from user lookup if needed
      role: 'admin',
      permissions: sessionData.permissions
    }
  };
}

// Log admin actions for audit trail
export async function logAdminAction(
  userId: string,
  action: string,
  resource: string,
  details: Record<string, any> = {},
  ipAddress?: string
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabase
      .from('admin_audit_logs')
      .insert({
        user_id: userId,
        action,
        resource,
        details,
        ip_address: ipAddress,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

// Extract IP address from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}