import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Supabase first before importing the service
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn()
          }))
        }))
      })),
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn()
        }))
      })),
      in: jest.fn()
    }))
  }))
};

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabaseClient
}));

// Import after mocking
import { EmailAnalyticsService } from '@/lib/email-analytics-service';

describe('EmailAnalyticsService', () => {
  let service: EmailAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmailAnalyticsService();
  });

  describe('getMonitoringConfig', () => {
    it('should return default config when no settings exist', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          in: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      });

      const config = await service.getMonitoringConfig();

      expect(config).toEqual({
        bounceRateThreshold: 0.05,
        failureRateThreshold: 0.10,
        dailyVolumeThreshold: 1000,
        monitoringWindowHours: 24
      });
    });

    it('should return custom config from settings', async () => {
      const mockSettings = [
        { setting_key: 'bounce_rate_threshold', setting_value: '0.03' },
        { setting_key: 'failure_rate_threshold', setting_value: '0.08' },
        { setting_key: 'daily_email_limit', setting_value: '2000' },
        { setting_key: 'monitoring_window_hours', setting_value: '12' }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          in: jest.fn().mockResolvedValue({
            data: mockSettings,
            error: null
          })
        }))
      });

      const config = await service.getMonitoringConfig();

      expect(config).toEqual({
        bounceRateThreshold: 0.03,
        failureRateThreshold: 0.08,
        dailyVolumeThreshold: 2000,
        monitoringWindowHours: 12
      });
    });
  });

  describe('calculateBounceRate', () => {
    it('should calculate bounce rate correctly', async () => {
      const mockLogs = [
        { status: 'delivered' },
        { status: 'bounced' },
        { status: 'delivered' },
        { status: 'bounced' },
        { status: 'failed' }
      ];

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await service.calculateBounceRate(startDate, endDate);

      expect(result).toEqual({
        bounceRate: 0.4, // 2 bounced out of 5 total
        totalSent: 5,
        totalBounced: 2
      });
    });

    it('should handle empty logs', async () => {
      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: [],
        error: null
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await service.calculateBounceRate(startDate, endDate);

      expect(result).toEqual({
        bounceRate: 0,
        totalSent: 0,
        totalBounced: 0
      });
    });

    it('should throw error on database error', async () => {
      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      await expect(service.calculateBounceRate(startDate, endDate))
        .rejects.toThrow('Failed to calculate bounce rate: Database error');
    });
  });

  describe('calculateFailureRate', () => {
    it('should calculate failure rate correctly', async () => {
      const mockLogs = [
        { status: 'delivered' },
        { status: 'failed' },
        { status: 'delivered' },
        { status: 'failed' },
        { status: 'bounced' }
      ];

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const result = await service.calculateFailureRate(startDate, endDate);

      expect(result).toEqual({
        failureRate: 0.4, // 2 failed out of 5 total
        totalSent: 5,
        totalFailed: 2
      });
    });
  });

  describe('checkVolumeAlerts', () => {
    it('should generate high volume alert when threshold exceeded', async () => {
      const mockLogs = new Array(950).fill({ id: '1' }); // 950 emails

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const config = {
        bounceRateThreshold: 0.05,
        failureRateThreshold: 0.10,
        dailyVolumeThreshold: 1000,
        monitoringWindowHours: 24
      };

      const alerts = await service.checkVolumeAlerts(config);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('high_volume');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].message).toContain('950/1000');
    });

    it('should generate medium volume alert when 80% threshold exceeded', async () => {
      const mockLogs = new Array(850).fill({ id: '1' }); // 850 emails

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const config = {
        bounceRateThreshold: 0.05,
        failureRateThreshold: 0.10,
        dailyVolumeThreshold: 1000,
        monitoringWindowHours: 24
      };

      const alerts = await service.checkVolumeAlerts(config);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('high_volume');
      expect(alerts[0].severity).toBe('medium');
      expect(alerts[0].message).toContain('850/1000');
    });

    it('should not generate alert when volume is below threshold', async () => {
      const mockLogs = new Array(500).fill({ id: '1' }); // 500 emails

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const config = {
        bounceRateThreshold: 0.05,
        failureRateThreshold: 0.10,
        dailyVolumeThreshold: 1000,
        monitoringWindowHours: 24
      };

      const alerts = await service.checkVolumeAlerts(config);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('checkBounceRateAlerts', () => {
    it('should generate bounce rate alert when threshold exceeded', async () => {
      const mockLogs = [
        ...new Array(80).fill({ status: 'delivered' }),
        ...new Array(20).fill({ status: 'bounced' })
      ]; // 20% bounce rate

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const config = {
        bounceRateThreshold: 0.05, // 5%
        failureRateThreshold: 0.10,
        dailyVolumeThreshold: 1000,
        monitoringWindowHours: 24
      };

      const alerts = await service.checkBounceRateAlerts(config);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('bounce_rate');
      expect(alerts[0].severity).toBe('high'); // 20% is > 2 * 5%
      expect(alerts[0].message).toContain('20.00%');
    });

    it('should not generate alert for low volume', async () => {
      const mockLogs = [
        { status: 'delivered' },
        { status: 'bounced' }
      ]; // 50% bounce rate but only 2 emails

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const config = {
        bounceRateThreshold: 0.05,
        failureRateThreshold: 0.10,
        dailyVolumeThreshold: 1000,
        monitoringWindowHours: 24
      };

      const alerts = await service.checkBounceRateAlerts(config);

      expect(alerts).toHaveLength(0); // Should not alert for low volume
    });
  });

  describe('checkSMTPAlerts', () => {
    it('should generate SMTP alert for failed configurations', async () => {
      const mockFailedConfigs = [
        {
          id: 'config-1',
          provider: 'gmail',
          test_status: 'failed',
          last_tested: new Date().toISOString()
        }
      ];

      const mockQuery = {
        eq: jest.fn(() => mockQuery),
        gte: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.gte.mockResolvedValue({
        data: mockFailedConfigs,
        error: null
      });

      const alerts = await service.checkSMTPAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('smtp_error');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].message).toContain('gmail');
    });
  });

  describe('getEmailStatistics', () => {
    it('should return comprehensive email statistics', async () => {
      const mockLogs = [
        { status: 'delivered' },
        { status: 'delivered' },
        { status: 'failed' },
        { status: 'bounced' },
        { status: 'pending' }
      ];

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockLogs,
        error: null
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const stats = await service.getEmailStatistics(startDate, endDate);

      expect(stats).toEqual({
        totalSent: 5,
        totalDelivered: 2,
        totalFailed: 1,
        totalBounced: 1,
        totalPending: 1,
        deliveryRate: 0.4, // 2/5
        bounceRate: 0.2,   // 1/5
        failureRate: 0.2   // 1/5
      });
    });
  });
});