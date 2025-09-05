import { NextRequest, NextResponse } from 'next/server';
import { generateMockEmailAnalytics, getMockAnalyticsWithFilters } from '@/lib/mock-data';

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
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const emailType = searchParams.get('email_type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Generate analytics data with filters
    const analytics = getMockAnalyticsWithFilters({
      emailType: emailType || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error in email analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}