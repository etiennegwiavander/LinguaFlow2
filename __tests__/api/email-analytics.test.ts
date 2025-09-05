import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EmailAnalyticsService } from '@/lib/email-analytics-service';

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
            order: jest.fn(() => ({
              range: jest.fn(),
              limit: jest.fn()
            })),
            ilike: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn()
              }))
            }))
          })),
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn(),
            limit: jest.fn()
          })),
          ilike: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn()
            }))
          }))
        })),
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            range: jest.fn(),
            limit: jest.fn()
          })),
          ilike: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn()
            }))
          }))
        })),
        single: jest.fn(),
        order: jest.fn(() => ({
          range: jest.fn(),
          limit: jest.fn()
        })),
        ilike: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn()
          }))
        }))
      })),
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          range: jest.fn(),
          limit: jest.fn()
        })),
        ilike: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn()
          }))
        }))
      })),
      single: jest.fn(),
      order: jest.fn(() => ({
        range: jest.fn(),
        limit: jest.fn()
      })),
      ilike: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn()
        }))
      })),
      in: jest.fn(() => ({
        select: jest.fn()
      }))
    }))
  }))
};

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabaseClient
}));

describe('Email Analytics API Integration', () => {
  let analyticsService: EmailAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new EmailAnalyticsService();
    
    // Mock successful authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user', email: 'admin@test.com' } },
      error: null
    });
  });

  describe('Analytics Service Integration', () => {
    it('should calculate analytics correctly with real data structure', async () => {
      const mockLogs = [
        { status: 'delivered' },
        { status: 'delivered' },
        { status: 'bounced' },
        { status: 'failed' },
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
      
      const stats = await analyticsService.getEmailStatistics(startDate, endDate);

      expect(stats.totalSent).toBe(5);
      expect(stats.totalDelivered).toBe(2);
      expect(stats.totalFailed).toBe(1);
      expect(stats.totalBounced).toBe(1);
      expect(stats.totalPending).toBe(1);
      expect(stats.deliveryRate).toBe(0.4);
      expect(stats.bounceRate).toBe(0.2);
      expect(stats.failureRate).toBe(0.2);
    });

    it('should generate appropriate alerts based on thresholds', async () => {
      // Mock high volume scenario
      const mockHighVolumeLogs = new Array(950).fill({ id: '1' });

      const mockQuery = {
        gte: jest.fn(() => mockQuery),
        lte: jest.fn(() => mockQuery),
        eq: jest.fn(() => mockQuery)
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => mockQuery)
      });

      mockQuery.eq.mockResolvedValue({
        data: mockHighVolumeLogs,
        error: null
      });

      const config = {
        bounceRateThreshold: 0.05,
        failureRateThreshold: 0.10,
        dailyVolumeThreshold: 1000,
        monitoringWindowHours: 24
      };

      const alerts = await analyticsService.checkVolumeAlerts(config);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('high_volume');
      expect(alerts[0].severity).toBe('high');
      expect(alerts[0].message).toContain('950/1000');
    });

    it('should handle filtering by email type', async () => {
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
      
      await analyticsService.calculateBounceRate(startDate, endDate, 'welcome');

      expect(mockQuery.eq).toHaveBeenCalledWith('template_type', 'welcome');
    });

    it('should handle database errors gracefully', async () => {
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
        error: { message: 'Database connection failed' }
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      await expect(analyticsService.calculateBounceRate(startDate, endDate))
        .rejects.toThrow('Failed to calculate bounce rate: Database connection failed');
    });
  });
});