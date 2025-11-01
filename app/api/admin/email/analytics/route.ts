import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalBounced: number;
  bounceRate: number;
  deliveryRate: number;
  timeRange: {
    start: string;
    end: string;
  };
  emailTypeBreakdown: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
  }>;
  dailyStats: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
  }>;
  alerts: Array<{
    type: 'bounce_rate' | 'delivery_failure' | 'high_volume';
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const type = searchParams.get('type');
    const provider = searchParams.get('provider');

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }
    
    let query = supabase
      .from('email_logs')
      .select('*')
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', now.toISOString());
    
    if (type) {
      query = query.eq('template_type', type);
    }
    
    if (provider) {
      query = query.eq('smtp_config_id', provider);
    }
    
    const { data: logs, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Process analytics data
    const totalEmails = logs?.length || 0;
    const deliveredEmails = logs?.filter(log => log.status === 'delivered').length || 0;
    const failedEmails = logs?.filter(log => log.status === 'failed').length || 0;
    const deliveryRate = totalEmails > 0 ? (deliveredEmails / totalEmails) * 100 : 0;
    
    // Group by date for chart data
    const dailyStats = logs?.reduce((acc: any, log) => {
      const date = log.sent_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, sent: 0, delivered: 0, failed: 0 };
      }
      acc[date].sent++;
      if (log.status === 'delivered') acc[date].delivered++;
      if (log.status === 'failed') acc[date].failed++;
      return acc;
    }, {}) || {};
    
    // Group by email type with detailed stats
    const emailTypeBreakdown = logs?.reduce((acc: any, log) => {
      const type = log.template_type || 'unknown';
      if (!acc[type]) {
        acc[type] = { sent: 0, delivered: 0, failed: 0, bounced: 0 };
      }
      acc[type].sent++;
      if (log.status === 'delivered') acc[type].delivered++;
      if (log.status === 'failed') acc[type].failed++;
      if (log.status === 'bounced') acc[type].bounced++;
      return acc;
    }, {}) || {};
    
    const bouncedEmails = logs?.filter(log => log.status === 'bounced').length || 0;
    const bounceRate = totalEmails > 0 ? (bouncedEmails / totalEmails) * 100 : 0;
    
    const analytics = {
      totalSent: totalEmails,
      totalDelivered: deliveredEmails,
      totalFailed: failedEmails,
      totalBounced: bouncedEmails,
      bounceRate: Math.round(bounceRate),
      deliveryRate: Math.round(deliveryRate),
      timeRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      emailTypeBreakdown: emailTypeBreakdown,
      dailyStats: Object.values(dailyStats).map((stat: any) => ({
        date: stat.date,
        sent: stat.sent,
        delivered: stat.delivered,
        failed: stat.failed,
        bounced: 0
      })),
      alerts: [],
      overview: {
        totalEmails,
        deliveredEmails,
        failedEmails,
        deliveryRate: Math.round(deliveryRate),
        avgDeliveryTime: '1.2s'
      },
      chartData: Object.values(dailyStats),
      typeBreakdown: Object.entries(emailTypeBreakdown).map(([type, stats]: [string, any]) => ({
        type,
        count: stats.sent,
        percentage: totalEmails > 0 ? Math.round((stats.sent / totalEmails) * 100) : 0
      })),
      trends: {
        deliveryRate: deliveryRate,
        volumeChange: 0,
        errorRate: totalEmails > 0 ? (failedEmails / totalEmails) * 100 : 0
      }
    };
    
    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}