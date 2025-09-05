import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface BulkOperationResult {
  success: boolean;
  message: string;
  processedCount: number;
  errors?: string[];
  results?: Array<{
    id: string;
    status: 'success' | 'error';
    message?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, templateIds, data } = body;

    if (!operation || !Array.isArray(templateIds) || templateIds.length === 0) {
      return NextResponse.json({ 
        error: 'Operation and template IDs are required' 
      }, { status: 400 });
    }

    let result: BulkOperationResult;

    switch (operation) {
      case 'activate':
        result = await bulkActivateTemplates(templateIds);
        break;
      
      case 'deactivate':
        result = await bulkDeactivateTemplates(templateIds);
        break;
      
      case 'delete':
        result = await bulkDeleteTemplates(templateIds);
        break;
      
      case 'duplicate':
        result = await bulkDuplicateTemplates(templateIds, user.id);
        break;
      
      case 'export':
        result = await bulkExportTemplates(templateIds);
        break;
      
      case 'update_metadata':
        result = await bulkUpdateMetadata(templateIds, data);
        break;
      
      case 'validate':
        result = await bulkValidateTemplates(templateIds);
        break;
      
      default:
        return NextResponse.json({ 
          error: 'Invalid operation. Supported operations: activate, deactivate, delete, duplicate, export, update_metadata, validate' 
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in bulk templates API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    if (operation === 'get_operations') {
      return NextResponse.json({
        operations: [
          {
            id: 'activate',
            name: 'Activate Templates',
            description: 'Enable selected templates for use',
            requiresConfirmation: false
          },
          {
            id: 'deactivate',
            name: 'Deactivate Templates',
            description: 'Disable selected templates',
            requiresConfirmation: true
          },
          {
            id: 'delete',
            name: 'Delete Templates',
            description: 'Permanently delete selected templates',
            requiresConfirmation: true,
            destructive: true
          },
          {
            id: 'duplicate',
            name: 'Duplicate Templates',
            description: 'Create copies of selected templates',
            requiresConfirmation: false
          },
          {
            id: 'export',
            name: 'Export Templates',
            description: 'Export selected templates as JSON',
            requiresConfirmation: false
          },
          {
            id: 'validate',
            name: 'Validate Templates',
            description: 'Check templates for errors and issues',
            requiresConfirmation: false
          }
        ]
      });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });

  } catch (error) {
    console.error('Error in bulk templates GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk operation implementations

async function bulkActivateTemplates(templateIds: string[]): Promise<BulkOperationResult> {
  const { data, error } = await supabase
    .from('email_templates')
    .update({ is_active: true })
    .in('id', templateIds)
    .select('id, name');

  if (error) {
    return {
      success: false,
      message: `Failed to activate templates: ${error.message}`,
      processedCount: 0,
      errors: [error.message]
    };
  }

  return {
    success: true,
    message: `Successfully activated ${data?.length || 0} template(s)`,
    processedCount: data?.length || 0
  };
}

async function bulkDeactivateTemplates(templateIds: string[]): Promise<BulkOperationResult> {
  const { data, error } = await supabase
    .from('email_templates')
    .update({ is_active: false })
    .in('id', templateIds)
    .select('id, name');

  if (error) {
    return {
      success: false,
      message: `Failed to deactivate templates: ${error.message}`,
      processedCount: 0,
      errors: [error.message]
    };
  }

  return {
    success: true,
    message: `Successfully deactivated ${data?.length || 0} template(s)`,
    processedCount: data?.length || 0
  };
}

async function bulkDeleteTemplates(templateIds: string[]): Promise<BulkOperationResult> {
  // First check if any templates are currently active and being used
  const { data: activeTemplates, error: checkError } = await supabase
    .from('email_templates')
    .select('id, name, type, is_active')
    .in('id', templateIds)
    .eq('is_active', true);

  if (checkError) {
    return {
      success: false,
      message: `Failed to check template status: ${checkError.message}`,
      processedCount: 0,
      errors: [checkError.message]
    };
  }

  // Warn about active templates
  const warnings: string[] = [];
  if (activeTemplates && activeTemplates.length > 0) {
    warnings.push(`${activeTemplates.length} active template(s) will be deleted and email sending for those types will be disabled`);
  }

  // Check for recent usage (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentUsage, error: usageError } = await supabase
    .from('email_logs')
    .select('template_id')
    .in('template_id', templateIds)
    .gte('sent_at', sevenDaysAgo);

  if (usageError) {
    warnings.push('Could not check recent usage');
  } else if (recentUsage && recentUsage.length > 0) {
    warnings.push(`Templates have been used ${recentUsage.length} time(s) in the last 7 days`);
  }

  // Perform deletion
  const { data, error } = await supabase
    .from('email_templates')
    .delete()
    .in('id', templateIds)
    .select('id, name');

  if (error) {
    return {
      success: false,
      message: `Failed to delete templates: ${error.message}`,
      processedCount: 0,
      errors: [error.message, ...warnings]
    };
  }

  return {
    success: true,
    message: `Successfully deleted ${data?.length || 0} template(s)`,
    processedCount: data?.length || 0,
    errors: warnings.length > 0 ? warnings : undefined
  };
}

async function bulkDuplicateTemplates(templateIds: string[], userId: string): Promise<BulkOperationResult> {
  const results: Array<{ id: string; status: 'success' | 'error'; message?: string }> = [];
  let successCount = 0;
  const errors: string[] = [];

  for (const templateId of templateIds) {
    try {
      // Fetch original template
      const { data: originalTemplate, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError || !originalTemplate) {
        results.push({
          id: templateId,
          status: 'error',
          message: `Failed to fetch template: ${fetchError?.message || 'Not found'}`
        });
        errors.push(`Template ${templateId}: ${fetchError?.message || 'Not found'}`);
        continue;
      }

      // Create duplicate
      const duplicateData = {
        type: originalTemplate.type,
        name: `${originalTemplate.name} (Copy)`,
        subject: originalTemplate.subject,
        html_content: originalTemplate.html_content,
        text_content: originalTemplate.text_content,
        placeholders: originalTemplate.placeholders,
        is_active: false, // Duplicates start as inactive
        created_by: userId
      };

      const { data: newTemplate, error: createError } = await supabase
        .from('email_templates')
        .insert(duplicateData)
        .select('id, name')
        .single();

      if (createError) {
        results.push({
          id: templateId,
          status: 'error',
          message: `Failed to create duplicate: ${createError.message}`
        });
        errors.push(`Template ${templateId}: ${createError.message}`);
      } else {
        results.push({
          id: templateId,
          status: 'success',
          message: `Duplicated as "${newTemplate.name}"`
        });
        successCount++;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        id: templateId,
        status: 'error',
        message: errorMessage
      });
      errors.push(`Template ${templateId}: ${errorMessage}`);
    }
  }

  return {
    success: successCount > 0,
    message: `Successfully duplicated ${successCount} of ${templateIds.length} template(s)`,
    processedCount: successCount,
    errors: errors.length > 0 ? errors : undefined,
    results
  };
}

async function bulkExportTemplates(templateIds: string[]): Promise<BulkOperationResult> {
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .in('id', templateIds);

  if (error) {
    return {
      success: false,
      message: `Failed to export templates: ${error.message}`,
      processedCount: 0,
      errors: [error.message]
    };
  }

  // Remove sensitive/internal fields for export
  const exportData = templates?.map(template => ({
    type: template.type,
    name: template.name,
    subject: template.subject,
    html_content: template.html_content,
    text_content: template.text_content,
    placeholders: template.placeholders,
    version: template.version,
    exported_at: new Date().toISOString()
  }));

  return {
    success: true,
    message: `Successfully exported ${templates?.length || 0} template(s)`,
    processedCount: templates?.length || 0,
    results: [{
      id: 'export_data',
      status: 'success',
      message: JSON.stringify(exportData, null, 2)
    }]
  };
}

async function bulkUpdateMetadata(templateIds: string[], updateData: any): Promise<BulkOperationResult> {
  if (!updateData || typeof updateData !== 'object') {
    return {
      success: false,
      message: 'Update data is required',
      processedCount: 0,
      errors: ['Invalid update data provided']
    };
  }

  // Only allow safe metadata updates
  const allowedFields = ['name', 'subject', 'is_active'];
  const safeUpdateData: any = {};
  
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key)) {
      safeUpdateData[key] = updateData[key];
    }
  });

  if (Object.keys(safeUpdateData).length === 0) {
    return {
      success: false,
      message: 'No valid fields to update',
      processedCount: 0,
      errors: [`Allowed fields: ${allowedFields.join(', ')}`]
    };
  }

  const { data, error } = await supabase
    .from('email_templates')
    .update(safeUpdateData)
    .in('id', templateIds)
    .select('id, name');

  if (error) {
    return {
      success: false,
      message: `Failed to update templates: ${error.message}`,
      processedCount: 0,
      errors: [error.message]
    };
  }

  return {
    success: true,
    message: `Successfully updated ${data?.length || 0} template(s)`,
    processedCount: data?.length || 0
  };
}

async function bulkValidateTemplates(templateIds: string[]): Promise<BulkOperationResult> {
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .in('id', templateIds);

  if (error) {
    return {
      success: false,
      message: `Failed to fetch templates for validation: ${error.message}`,
      processedCount: 0,
      errors: [error.message]
    };
  }

  const results: Array<{ id: string; status: 'success' | 'error'; message?: string }> = [];
  let validCount = 0;
  const errors: string[] = [];

  templates?.forEach(template => {
    const validationErrors: string[] = [];

    // Validate required fields
    if (!template.subject || template.subject.trim() === '') {
      validationErrors.push('Subject is required');
    }

    if (!template.html_content || template.html_content.trim() === '') {
      validationErrors.push('HTML content is required');
    }

    // Validate HTML structure (basic check)
    if (template.html_content) {
      const htmlTagCount = (template.html_content.match(/<[^>]+>/g) || []).length;
      const closingTagCount = (template.html_content.match(/<\/[^>]+>/g) || []).length;
      
      if (htmlTagCount > 0 && closingTagCount === 0) {
        validationErrors.push('HTML appears to have unclosed tags');
      }
    }

    // Validate placeholders
    if (template.placeholders && Array.isArray(template.placeholders)) {
      const contentPlaceholders = [
        ...(template.html_content?.match(/\{\{[^}]+\}\}/g) || []),
        ...(template.subject?.match(/\{\{[^}]+\}\}/g) || [])
      ].map(p => p.replace(/[{}]/g, ''));

      const undefinedPlaceholders = contentPlaceholders.filter(
        p => !template.placeholders.includes(p)
      );

      if (undefinedPlaceholders.length > 0) {
        validationErrors.push(`Undefined placeholders: ${undefinedPlaceholders.join(', ')}`);
      }
    }

    if (validationErrors.length === 0) {
      results.push({
        id: template.id,
        status: 'success',
        message: 'Template is valid'
      });
      validCount++;
    } else {
      results.push({
        id: template.id,
        status: 'error',
        message: validationErrors.join('; ')
      });
      errors.push(`Template "${template.name}": ${validationErrors.join('; ')}`);
    }
  });

  return {
    success: validCount === templates?.length,
    message: `${validCount} of ${templates?.length || 0} template(s) are valid`,
    processedCount: templates?.length || 0,
    errors: errors.length > 0 ? errors : undefined,
    results
  };
}