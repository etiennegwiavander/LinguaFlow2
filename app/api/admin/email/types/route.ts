import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface EmailTypeConfig {
  type: string;
  isActive: boolean;
  schedulingConfig: {
    enabled: boolean;
    timing: string;
    triggerEvent: string;
    conditions?: Record<string, any>;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all email templates
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .order('type');

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Fetch scheduling configurations
    const { data: schedulingSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .like('setting_key', '%_scheduling');

    if (settingsError) {
      console.error('Error fetching scheduling settings:', settingsError);
    }

    // Build email type configurations
    const emailTypes = new Map<string, EmailTypeConfig>();

    // Add configured templates
    templates?.forEach(template => {
      const schedulingKey = `${template.type}_scheduling`;
      const schedulingConfig = schedulingSettings?.find(s => s.setting_key === schedulingKey);
      
      emailTypes.set(template.type, {
        type: template.type,
        isActive: template.is_active,
        schedulingConfig: schedulingConfig?.setting_value || getDefaultSchedulingConfig(template.type)
      });
    });

    // Add default email types if not present
    const defaultTypes = ['welcome', 'lesson_reminder', 'password_reset'];
    defaultTypes.forEach(type => {
      if (!emailTypes.has(type)) {
        emailTypes.set(type, {
          type,
          isActive: false,
          schedulingConfig: getDefaultSchedulingConfig(type)
        });
      }
    });

    return NextResponse.json({
      emailTypes: Array.from(emailTypes.values())
    });

  } catch (error) {
    console.error('Error in email types API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { emailType, isActive, schedulingConfig } = body;

    if (!emailType) {
      return NextResponse.json({ error: 'Email type is required' }, { status: 400 });
    }

    // Update template active status if template exists
    if (isActive !== undefined) {
      const { error: templateError } = await supabase
        .from('email_templates')
        .update({ is_active: isActive })
        .eq('type', emailType);

      if (templateError) {
        console.error('Error updating template:', templateError);
        return NextResponse.json({ error: 'Failed to update template status' }, { status: 500 });
      }
    }

    // Update scheduling configuration if provided
    if (schedulingConfig) {
      const { error: schedulingError } = await supabase
        .from('email_settings')
        .upsert({
          setting_key: `${emailType}_scheduling`,
          setting_value: schedulingConfig,
          description: `Scheduling configuration for ${emailType} emails`,
          updated_by: user.id
        });

      if (schedulingError) {
        console.error('Error updating scheduling config:', schedulingError);
        return NextResponse.json({ error: 'Failed to update scheduling configuration' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email type ${emailType} configuration updated successfully`
    });

  } catch (error) {
    console.error('Error in email types PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'bulk_toggle':
        return await bulkToggleEmailTypes(data);
      
      case 'reset_scheduling':
        return await resetSchedulingConfig(data);
      
      case 'validate_scheduling':
        return await validateSchedulingConfig(data);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in email types POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

function getDefaultSchedulingConfig(emailType: string) {
  const defaultConfigs: Record<string, any> = {
    welcome: {
      enabled: true,
      timing: 'immediate',
      triggerEvent: 'user_registration',
      conditions: {
        userType: 'all',
        delay: 0
      }
    },
    lesson_reminder: {
      enabled: true,
      timing: '15 minutes before lesson',
      triggerEvent: 'lesson_scheduled',
      conditions: {
        reminderType: 'before_lesson',
        delayMinutes: 15,
        userPreferences: true
      }
    },
    password_reset: {
      enabled: true,
      timing: 'immediate',
      triggerEvent: 'password_reset_requested',
      conditions: {
        securityLevel: 'standard',
        expirationMinutes: 60
      }
    },
    lesson_completion: {
      enabled: false,
      timing: '1 hour after lesson',
      triggerEvent: 'lesson_completed',
      conditions: {
        delayMinutes: 60,
        includeProgress: true
      }
    },
    weekly_summary: {
      enabled: false,
      timing: 'weekly on Sunday',
      triggerEvent: 'scheduled_weekly',
      conditions: {
        dayOfWeek: 0, // Sunday
        hour: 9,
        timezone: 'UTC'
      }
    }
  };

  return defaultConfigs[emailType] || {
    enabled: false,
    timing: 'manual',
    triggerEvent: 'manual',
    conditions: {}
  };
}

async function bulkToggleEmailTypes(data: { emailTypes: string[]; isActive: boolean }) {
  const { emailTypes, isActive } = data;

  if (!Array.isArray(emailTypes) || emailTypes.length === 0) {
    throw new Error('Email types array is required');
  }

  const { error } = await supabase
    .from('email_templates')
    .update({ is_active: isActive })
    .in('type', emailTypes);

  if (error) {
    throw new Error(`Failed to bulk toggle email types: ${error.message}`);
  }

  return NextResponse.json({
    success: true,
    message: `${emailTypes.length} email type(s) ${isActive ? 'enabled' : 'disabled'}`
  });
}

async function resetSchedulingConfig(data: { emailType: string }) {
  const { emailType } = data;

  const defaultConfig = getDefaultSchedulingConfig(emailType);

  const { error } = await supabase
    .from('email_settings')
    .upsert({
      setting_key: `${emailType}_scheduling`,
      setting_value: defaultConfig,
      description: `Default scheduling configuration for ${emailType} emails`
    });

  if (error) {
    throw new Error(`Failed to reset scheduling config: ${error.message}`);
  }

  return NextResponse.json({
    success: true,
    message: `Scheduling configuration reset to default for ${emailType}`,
    config: defaultConfig
  });
}

async function validateSchedulingConfig(data: { emailType: string; config: any }) {
  const { emailType, config } = data;

  // Validation rules
  const validationErrors: string[] = [];

  if (!config.timing) {
    validationErrors.push('Timing is required');
  }

  if (!config.triggerEvent) {
    validationErrors.push('Trigger event is required');
  }

  // Validate timing format for specific types
  if (config.timing && config.timing.includes('minutes')) {
    const minutes = parseInt(config.timing.match(/\d+/)?.[0] || '0');
    if (minutes < 1 || minutes > 1440) { // 1 minute to 24 hours
      validationErrors.push('Minutes must be between 1 and 1440');
    }
  }

  // Validate trigger events
  const validTriggerEvents = [
    'user_registration',
    'lesson_scheduled',
    'lesson_completed',
    'password_reset_requested',
    'scheduled_daily',
    'scheduled_weekly',
    'manual'
  ];

  if (config.triggerEvent && !validTriggerEvents.includes(config.triggerEvent)) {
    validationErrors.push(`Invalid trigger event. Must be one of: ${validTriggerEvents.join(', ')}`);
  }

  // Email type specific validations
  if (emailType === 'lesson_reminder' && config.conditions?.delayMinutes) {
    if (config.conditions.delayMinutes < 5 || config.conditions.delayMinutes > 1440) {
      validationErrors.push('Lesson reminder delay must be between 5 minutes and 24 hours');
    }
  }

  if (emailType === 'password_reset' && config.conditions?.expirationMinutes) {
    if (config.conditions.expirationMinutes < 15 || config.conditions.expirationMinutes > 1440) {
      validationErrors.push('Password reset expiration must be between 15 minutes and 24 hours');
    }
  }

  return NextResponse.json({
    valid: validationErrors.length === 0,
    errors: validationErrors,
    message: validationErrors.length === 0 ? 'Configuration is valid' : 'Configuration has validation errors'
  });
}