/**
 * Mock Email Analytics Data Service
 * Provides realistic mock data for email analytics dashboard
 */

export interface EmailAnalytics {
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
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

/**
 * Generate realistic daily email statistics
 */
function generateDailyStats(days: number = 30): EmailAnalytics['dailyStats'] {
  const stats = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const baseSent = Math.floor(Math.random() * 30) + 20; // 20-50 emails per day
    const delivered = Math.floor(baseSent * (0.92 + Math.random() * 0.06)); // 92-98% delivery
    const failed = Math.floor((baseSent - delivered) * (0.6 + Math.random() * 0.3)); // 60-90% of undelivered are failed
    const bounced = baseSent - delivered - failed;
    
    stats.push({
      date: date.toISOString().split('T')[0],
      sent: baseSent,
      delivered,
      failed,
      bounced: Math.max(0, bounced)
    });
  }
  
  return stats;
}

/**
 * Generate email type breakdown statistics
 */
function generateEmailTypeBreakdown(): EmailAnalytics['emailTypeBreakdown'] {
  const types = ['welcome', 'lesson_reminder', 'password_reset', 'newsletter'];
  const breakdown: EmailAnalytics['emailTypeBreakdown'] = {};
  
  types.forEach(type => {
    const sent = Math.floor(Math.random() * 100) + 50;
    const delivered = Math.floor(sent * (0.90 + Math.random() * 0.08));
    const failed = Math.floor((sent - delivered) * (0.5 + Math.random() * 0.4));
    const bounced = sent - delivered - failed;
    
    breakdown[type] = {
      sent,
      delivered,
      failed,
      bounced: Math.max(0, bounced)
    };
  });
  
  return breakdown;
}

/**
 * Generate system alerts based on performance metrics
 */
function generateAlerts(analytics: Partial<EmailAnalytics>): EmailAnalytics['alerts'] {
  const alerts: EmailAnalytics['alerts'] = [];
  
  // High bounce rate alert
  if (analytics.bounceRate && analytics.bounceRate > 0.05) {
    alerts.push({
      type: 'bounce_rate',
      message: `Bounce rate (${(analytics.bounceRate * 100).toFixed(1)}%) is above recommended threshold`,
      severity: analytics.bounceRate > 0.1 ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    });
  }
  
  // Low delivery rate alert
  if (analytics.deliveryRate && analytics.deliveryRate < 0.9) {
    alerts.push({
      type: 'delivery_rate',
      message: `Delivery rate (${(analytics.deliveryRate * 100).toFixed(1)}%) is below optimal range`,
      severity: analytics.deliveryRate < 0.8 ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    });
  }
  
  // High volume alert (random)
  if (Math.random() > 0.7) {
    alerts.push({
      type: 'high_volume',
      message: 'Email volume is 20% higher than usual today',
      severity: 'low',
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
}

/**
 * Generate complete mock email analytics data
 */
export function generateMockEmailAnalytics(options: {
  days?: number;
  startDate?: string;
  endDate?: string;
} = {}): EmailAnalytics {
  const { days = 30, startDate, endDate } = options;
  
  // Generate daily statistics
  const dailyStats = generateDailyStats(days);
  
  // Calculate totals from daily stats
  const totalSent = dailyStats.reduce((sum, day) => sum + day.sent, 0);
  const totalDelivered = dailyStats.reduce((sum, day) => sum + day.delivered, 0);
  const totalFailed = dailyStats.reduce((sum, day) => sum + day.failed, 0);
  const totalBounced = dailyStats.reduce((sum, day) => sum + day.bounced, 0);
  
  // Calculate rates
  const bounceRate = totalSent > 0 ? totalBounced / totalSent : 0;
  const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;
  
  // Generate other data
  const emailTypeBreakdown = generateEmailTypeBreakdown();
  
  // Create analytics object
  const analytics: EmailAnalytics = {
    totalSent,
    totalDelivered,
    totalFailed,
    totalBounced,
    bounceRate,
    deliveryRate,
    timeRange: {
      start: startDate || dailyStats[0]?.date || new Date().toISOString().split('T')[0],
      end: endDate || dailyStats[dailyStats.length - 1]?.date || new Date().toISOString().split('T')[0]
    },
    emailTypeBreakdown,
    dailyStats,
    alerts: []
  };
  
  // Generate alerts based on the analytics
  analytics.alerts = generateAlerts(analytics);
  
  return analytics;
}

/**
 * Get mock analytics with specific filters
 */
export function getMockAnalyticsWithFilters(filters: {
  emailType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): EmailAnalytics {
  const baseAnalytics = generateMockEmailAnalytics();
  
  // Apply filters (simplified for mock data)
  if (filters.emailType) {
    // Filter to specific email type
    const typeData = baseAnalytics.emailTypeBreakdown[filters.emailType];
    if (typeData) {
      return {
        ...baseAnalytics,
        totalSent: typeData.sent,
        totalDelivered: typeData.delivered,
        totalFailed: typeData.failed,
        totalBounced: typeData.bounced,
        bounceRate: typeData.sent > 0 ? typeData.bounced / typeData.sent : 0,
        deliveryRate: typeData.sent > 0 ? typeData.delivered / typeData.sent : 0
      };
    }
  }
  
  return baseAnalytics;
}

/**
 * Get trending data for charts
 */
export function getMockTrendingData(period: 'day' | 'week' | 'month' = 'day') {
  const analytics = generateMockEmailAnalytics();
  
  switch (period) {
    case 'week':
      // Group daily stats by week
      const weeklyStats = [];
      for (let i = 0; i < analytics.dailyStats.length; i += 7) {
        const weekData = analytics.dailyStats.slice(i, i + 7);
        const weekTotal = weekData.reduce((sum, day) => ({
          sent: sum.sent + day.sent,
          delivered: sum.delivered + day.delivered,
          failed: sum.failed + day.failed,
          bounced: sum.bounced + day.bounced
        }), { sent: 0, delivered: 0, failed: 0, bounced: 0 });
        
        weeklyStats.push({
          period: `Week ${Math.floor(i / 7) + 1}`,
          ...weekTotal
        });
      }
      return weeklyStats;
      
    case 'month':
      // Return monthly totals
      return [{
        period: 'This Month',
        sent: analytics.totalSent,
        delivered: analytics.totalDelivered,
        failed: analytics.totalFailed,
        bounced: analytics.totalBounced
      }];
      
    default:
      return analytics.dailyStats.map(day => ({
        period: day.date,
        ...day
      }));
  }
}