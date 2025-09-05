import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EmailAnalyticsService } from '@/lib/email-analytics-service';

export async function GET(request: NextRequest) {
  try {
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analyticsService = new EmailAnalyticsService();
    
    // Generate current alerts
    const alerts = await analyticsService.generateAlerts();

    return NextResponse.json({
      alerts,
      generatedAt: new Date().toISOString(),
      totalAlerts: alerts.length,
      alertsBySeverity: {
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      }
    });

  } catch (error) {
    console.error('Error in email alerts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}