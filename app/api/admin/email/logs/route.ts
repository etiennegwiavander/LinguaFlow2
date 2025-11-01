import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailLogFilters {
  status?: string;
  type?: string;
  recipient?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: EmailLogFilters = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      recipient: searchParams.get('recipient') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    let query = supabase.from('email_logs').select('*', { count: 'exact' });
    
    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.type) {
      query = query.eq('template_type', filters.type);
    }
    
    if (filters.recipient) {
      query = query.ilike('recipient_email', `%${filters.recipient}%`);
    }
    
    if (filters.dateFrom) {
      query = query.gte('sent_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('sent_at', filters.dateTo);
    }
    
    // Apply pagination and ordering
    const offset = (filters.page - 1) * filters.limit;
    query = query
      .order('sent_at', { ascending: false })
      .range(offset, offset + filters.limit - 1);
    
    const { data: logs, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Get stats
    const { data: allLogs } = await supabase
      .from('email_logs')
      .select('status, template_type');
    
    const stats = {
      total: allLogs?.length || 0,
      delivered: allLogs?.filter(log => log.status === 'delivered').length || 0,
      failed: allLogs?.filter(log => log.status === 'failed').length || 0,
      pending: allLogs?.filter(log => log.status === 'pending').length || 0,
      bounced: allLogs?.filter(log => log.status === 'bounced').length || 0
    };
    
    const totalPages = Math.ceil((count || 0) / filters.limit);
    
    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: count || 0,
          totalPages,
          hasNext: filters.page < totalPages,
          hasPrev: filters.page > 1
        },
        stats,
        filters
      }
    });
  } catch (error) {
    console.error('Email logs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}