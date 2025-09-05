import { NextRequest, NextResponse } from 'next/server';
import { getMockEmailLogsWithFilters, getMockEmailLogStats } from '@/lib/mock-data';

interface EmailLogFilters {
  startDate?: string;
  endDate?: string;
  emailType?: string;
  status?: string;
  recipientEmail?: string;
  isTest?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'sent_at' | 'delivered_at' | 'status' | 'template_type';
  sortOrder?: 'asc' | 'desc';
}

interface EmailLogResponse {
  logs: Array<{
    id: string;
    templateId: string | null;
    templateType: string;
    recipientEmail: string;
    subject: string;
    status: string;
    sentAt: string;
    deliveredAt: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    isTest: boolean;
    metadata: any;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalBounced: number;
    totalPending: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const templateType = searchParams.get('template_type');
    const status = searchParams.get('status');
    const recipientEmail = searchParams.get('recipient_email');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Get filtered logs using mock data service
    const { logs, total } = getMockEmailLogsWithFilters({
      template_type: templateType || undefined,
      status: status || undefined,
      recipient_email: recipientEmail || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      limit,
      offset: (page - 1) * limit
    });

    // Get summary stats
    const stats = getMockEmailLogStats({
      template_type: templateType || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    });

    const response: EmailLogResponse = {
      logs: logs.map(log => ({
        id: log.id,
        templateId: log.template_id,
        templateType: log.template_type,
        recipientEmail: log.recipient_email,
        subject: log.subject,
        status: log.status,
        sentAt: log.sent_at,
        deliveredAt: log.delivered_at || null,
        errorCode: null,
        errorMessage: log.error_message || null,
        isTest: false,
        metadata: log.metadata || {}
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalSent: stats.total_sent,
        totalDelivered: stats.delivered,
        totalFailed: stats.failed,
        totalBounced: stats.bounced,
        totalPending: stats.pending
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in email logs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}