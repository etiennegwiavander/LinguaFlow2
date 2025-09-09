/**
 * Admin Permissions Management API
 * Handles admin user permissions and role management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminSession, getClientIP, ADMIN_PERMISSIONS, hasPermission } from '@/lib/admin-auth-middleware';
import { logSecurityEvent, AUDIT_ACTIONS } from '@/lib/audit-logging-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

// GET /api/admin/security/permissions - Get admin users and permissions
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      await logSecurityEvent(
        'unknown',
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        { resource: 'admin_permissions', action: 'read' },
        getClientIP(request),
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Check system admin permission
    if (!hasPermission(authResult.user, ADMIN_PERMISSIONS.SYSTEM_ADMIN)) {
      await logSecurityEvent(
        authResult.user.id,
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        { resource: 'admin_permissions', action: 'read' },
        getClientIP(request),
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 });
    }

    // Get admin users configuration
    const { data: adminSettings, error } = await supabase
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'admin_users')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching admin users:', error);
      return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
    }

    let adminUsers: AdminUser[] = [];
    if (adminSettings?.setting_value) {
      try {
        const rawAdminUsers = JSON.parse(adminSettings.setting_value as string);
        adminUsers = rawAdminUsers.map((user: any) => ({
          id: user.id,
          email: user.email,
          role: user.role || 'admin',
          permissions: user.permissions || [ADMIN_PERMISSIONS.SYSTEM_ADMIN],
          createdAt: new Date(user.createdAt || Date.now()),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
          isActive: user.isActive !== false
        }));
      } catch (parseError) {
        console.error('Error parsing admin users:', parseError);
        return NextResponse.json({ error: 'Invalid admin configuration' }, { status: 500 });
      }
    }

    // Log access
    await logSecurityEvent(
      authResult.user.id,
      'admin_permissions_accessed',
      { count: adminUsers.length },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      adminUsers,
      availablePermissions: Object.values(ADMIN_PERMISSIONS),
      currentUser: authResult.user
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/security/permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/security/permissions - Add new admin user
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      await logSecurityEvent(
        'unknown',
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        { resource: 'admin_permissions', action: 'create' },
        getClientIP(request),
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Check system admin permission
    if (!hasPermission(authResult.user, ADMIN_PERMISSIONS.SYSTEM_ADMIN)) {
      await logSecurityEvent(
        authResult.user.id,
        AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
        { resource: 'admin_permissions', action: 'create' },
        getClientIP(request),
        request.headers.get('user-agent') || undefined
      );
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, permissions } = body;

    // Validate required fields
    if (!email || !role || !Array.isArray(permissions)) {
      return NextResponse.json({
        error: 'Missing required fields: email, role, permissions'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate permissions
    const validPermissions = Object.values(ADMIN_PERMISSIONS);
    const invalidPermissions = permissions.filter((perm: string) => !validPermissions.includes(perm as any));
    if (invalidPermissions.length > 0) {
      return NextResponse.json({
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`
      }, { status: 400 });
    }

    // Get current admin users
    const { data: adminSettings } = await supabase
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'admin_users')
      .single();

    let adminUsers: any[] = [];
    if (adminSettings?.setting_value) {
      try {
        adminUsers = JSON.parse(adminSettings.setting_value as string);
      } catch (parseError) {
        console.error('Error parsing admin users:', parseError);
        return NextResponse.json({ error: 'Invalid admin configuration' }, { status: 500 });
      }
    }

    // Check if user already exists
    const existingUser = adminUsers.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists as admin' }, { status: 409 });
    }

    // Add new admin user
    const newAdminUser = {
      id: crypto.randomUUID(),
      email,
      role,
      permissions,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    adminUsers.push(newAdminUser);

    // Update admin users setting
    const { error: updateError } = await supabase
      .from('email_settings')
      .upsert({
        setting_key: 'admin_users',
        setting_value: JSON.stringify(adminUsers),
        updated_at: new Date().toISOString(),
        updated_by: authResult.user.id
      });

    if (updateError) {
      console.error('Error updating admin users:', updateError);
      return NextResponse.json({ error: 'Failed to add admin user' }, { status: 500 });
    }

    // Log admin user addition
    await logSecurityEvent(
      authResult.user.id,
      AUDIT_ACTIONS.ADMIN_USER_ADDED,
      {
        new_admin_email: email,
        role,
        permissions
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: 'Admin user added successfully',
      user: newAdminUser
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/security/permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/security/permissions - Update admin user permissions
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Check system admin permission
    if (!hasPermission(authResult.user, ADMIN_PERMISSIONS.SYSTEM_ADMIN)) {
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email, role, permissions, isActive } = body;

    // Validate required fields
    if (!userId && !email) {
      return NextResponse.json({
        error: 'Either userId or email is required'
      }, { status: 400 });
    }

    // Get current admin users
    const { data: adminSettings } = await supabase
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'admin_users')
      .single();

    if (!adminSettings?.setting_value) {
      return NextResponse.json({ error: 'No admin users found' }, { status: 404 });
    }

    let adminUsers: any[];
    try {
      adminUsers = JSON.parse(adminSettings.setting_value as string);
    } catch (parseError) {
      console.error('Error parsing admin users:', parseError);
      return NextResponse.json({ error: 'Invalid admin configuration' }, { status: 500 });
    }

    // Find user to update
    const userIndex = adminUsers.findIndex(user => 
      (userId && user.id === userId) || (email && user.email === email)
    );

    if (userIndex === -1) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const oldUser = { ...adminUsers[userIndex] };

    // Update user properties
    if (role !== undefined) adminUsers[userIndex].role = role;
    if (permissions !== undefined) adminUsers[userIndex].permissions = permissions;
    if (isActive !== undefined) adminUsers[userIndex].isActive = isActive;
    adminUsers[userIndex].updatedAt = new Date().toISOString();

    // Prevent self-deactivation
    if (authResult.user.id === adminUsers[userIndex].id && isActive === false) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    // Update admin users setting
    const { error: updateError } = await supabase
      .from('email_settings')
      .update({
        setting_value: JSON.stringify(adminUsers),
        updated_at: new Date().toISOString(),
        updated_by: authResult.user.id
      })
      .eq('setting_key', 'admin_users');

    if (updateError) {
      console.error('Error updating admin users:', updateError);
      return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 });
    }

    // Log permission change
    await logSecurityEvent(
      authResult.user.id,
      AUDIT_ACTIONS.PERMISSIONS_CHANGED,
      {
        target_user: adminUsers[userIndex].email,
        old_permissions: oldUser.permissions,
        new_permissions: adminUsers[userIndex].permissions,
        old_role: oldUser.role,
        new_role: adminUsers[userIndex].role,
        old_active: oldUser.isActive,
        new_active: adminUsers[userIndex].isActive
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: 'Admin user updated successfully',
      user: adminUsers[userIndex]
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/security/permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/security/permissions - Remove admin user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced admin authentication
    const authResult = await validateAdminSession(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Check system admin permission
    if (!hasPermission(authResult.user, ADMIN_PERMISSIONS.SYSTEM_ADMIN)) {
      return NextResponse.json({ error: 'System admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({
        error: 'Either userId or email parameter is required'
      }, { status: 400 });
    }

    // Get current admin users
    const { data: adminSettings } = await supabase
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'admin_users')
      .single();

    if (!adminSettings?.setting_value) {
      return NextResponse.json({ error: 'No admin users found' }, { status: 404 });
    }

    let adminUsers: any[];
    try {
      adminUsers = JSON.parse(adminSettings.setting_value as string);
    } catch (parseError) {
      console.error('Error parsing admin users:', parseError);
      return NextResponse.json({ error: 'Invalid admin configuration' }, { status: 500 });
    }

    // Find user to remove
    const userIndex = adminUsers.findIndex(user => 
      (userId && user.id === userId) || (email && user.email === email)
    );

    if (userIndex === -1) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const userToRemove = adminUsers[userIndex];

    // Prevent self-removal
    if (authResult.user.id === userToRemove.id) {
      return NextResponse.json({ error: 'Cannot remove your own admin access' }, { status: 400 });
    }

    // Ensure at least one admin remains
    if (adminUsers.length <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last admin user' }, { status: 400 });
    }

    // Remove user
    adminUsers.splice(userIndex, 1);

    // Update admin users setting
    const { error: updateError } = await supabase
      .from('email_settings')
      .update({
        setting_value: JSON.stringify(adminUsers),
        updated_at: new Date().toISOString(),
        updated_by: authResult.user.id
      })
      .eq('setting_key', 'admin_users');

    if (updateError) {
      console.error('Error updating admin users:', updateError);
      return NextResponse.json({ error: 'Failed to remove admin user' }, { status: 500 });
    }

    // Log admin user removal
    await logSecurityEvent(
      authResult.user.id,
      AUDIT_ACTIONS.ADMIN_USER_REMOVED,
      {
        removed_admin_email: userToRemove.email,
        removed_admin_role: userToRemove.role
      },
      getClientIP(request),
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      message: 'Admin user removed successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/security/permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}