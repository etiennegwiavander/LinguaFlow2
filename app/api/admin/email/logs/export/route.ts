import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  emailType?: string;
  status?: string;
  recipientEmail?: string;
  isTest?: boolean;
  format: 'csv' | 'json';
  includeMetadata?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const filters: ExportFilters = {
      startDate: body.startDate,
      endDate: body.endDate,
      emailType: body.emailType,
      status: body.status,
      recipientEmail: body.recipientEmail,
      isTest: body.isTest,
      format: body.format || 'csv',
      includeMetadata: body.includeMetadata || false
    };

    // Validate format
    if (!['csv', 'json'].includes(filters.format)) {
      return NextResponse.json({ error: 'Invalid format. Must be csv or json' }, { status: 400 });
    }

    // Build query
    const selectFields = [
      'id',
      'template_id',
      'template_type',
      'recipient_email',
      'subject',
      'status',
      'sent_at',
      'delivered_at',
      'error_code',
      'error_message',
      'is_test'
    ];
    
    if (filters.includeMetadata) {
      selectFields.push('metadata');
    }
    
    let query = supabase
      .from('email_logs')
      .select(selectFields.join(','));

    // Apply filters
    if (filters.startDate) {
      query = query.gte('sent_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('sent_at', filters.endDate);
    }
    if (filters.emailType) {
      query = query.eq('template_type', filters.emailType);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.recipientEmail) {
      query = query.ilike('recipient_email', `%${filters.recipientEmail}%`);
    }
    if (filters.isTest !== undefined) {
      query = query.eq('is_test', filters.isTest);
    }

    // Order by sent_at descending
    query = query.order('sent_at', { ascending: false });

    // Limit to prevent excessive data export (max 10,000 records)
    query = query.limit(10000);

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching email logs for export:', logsError);
      return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({ error: 'No data found for the specified filters' }, { status: 404 });
    }

    // Type assertion for the logs data
    const typedLogs = logs as any[];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `email-logs-${timestamp}.${filters.format}`;

    if (filters.format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Template ID',
        'Template Type',
        'Recipient Email',
        'Subject',
        'Status',
        'Sent At',
        'Delivered At',
        'Error Code',
        'Error Message',
        'Is Test'
      ];

      if (filters.includeMetadata) {
        headers.push('Metadata');
      }

      const csvRows = [
        headers.join(','),
        ...typedLogs.map(log => {
          const row = [
            `"${log.id}"`,
            `"${log.template_id || ''}"`,
            `"${log.template_type}"`,
            `"${log.recipient_email}"`,
            `"${log.subject.replace(/"/g, '""')}"`, // Escape quotes in subject
            `"${log.status}"`,
            `"${log.sent_at}"`,
            `"${log.delivered_at || ''}"`,
            `"${log.error_code || ''}"`,
            `"${log.error_message?.replace(/"/g, '""') || ''}"`, // Escape quotes in error message
            `"${log.is_test}"`
          ];

          if (filters.includeMetadata) {
            row.push(`"${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`);
          }

          return row.join(',');
        })
      ];

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      });

    } else if (filters.format === 'json') {
      // Generate JSON
      const jsonData = {
        exportInfo: {
          generatedAt: new Date().toISOString(),
          totalRecords: typedLogs.length,
          filters: filters,
          generatedBy: user.email
        },
        logs: typedLogs.map(log => ({
          id: log.id,
          templateId: log.template_id,
          templateType: log.template_type,
          recipientEmail: log.recipient_email,
          subject: log.subject,
          status: log.status,
          sentAt: log.sent_at,
          deliveredAt: log.delivered_at,
          errorCode: log.error_code,
          errorMessage: log.error_message,
          isTest: log.is_test,
          ...(filters.includeMetadata && { metadata: log.metadata })
        }))
      };

      const jsonContent = JSON.stringify(jsonData, null, 2);

      return new NextResponse(jsonContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid format specified' }, { status: 400 });

  } catch (error) {
    console.error('Error in email logs export API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}