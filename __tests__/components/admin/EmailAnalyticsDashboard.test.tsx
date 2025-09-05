import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailAnalyticsDashboard } from '@/components/admin/EmailAnalyticsDashboard';

// Mock the analytics service
jest.mock('@/lib/email-analytics-service', () => ({
  EmailAnalyticsService: {
    getDeliveryStatistics: jest.fn(),
    getEmailLogs: jest.fn(),
    exportLogs: jest.fn(),
    getPerformanceMetrics: jest.fn(),
  },
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} />
  ),
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

const mockAnalyticsData = {
  deliveryStats: {
    totalSent: 1250,
    delivered: 1180,
    bounced: 45,
    failed: 25,
    deliveryRate: 94.4,
    bounceRate: 3.6,
  },
  performanceMetrics: {
    averageDeliveryTime: 2.3,
    peakSendingHours: [9, 10, 14, 15],
    emailTypeDistribution: {
      welcome: 450,
      lesson_reminder: 600,
      password_reset: 150,
      custom: 50,
    },
  },
  recentLogs: [
    {
      id: '1',
      emailType: 'welcome',
      recipient: 'user1@example.com',
      status: 'delivered',
      sentAt: '2024-08-31T10:00:00Z',
      deliveredAt: '2024-08-31T10:02:00Z',
    },
    {
      id: '2',
      emailType: 'lesson_reminder',
      recipient: 'user2@example.com',
      status: 'bounced',
      sentAt: '2024-08-31T11:00:00Z',
      bounceReason: 'Invalid email address',
    },
  ],
};

describe('EmailAnalyticsDashboard', () => {
  beforeEach(() => {
    const { EmailAnalyticsService } = require('@/lib/email-analytics-service');
    EmailAnalyticsService.getDeliveryStatistics.mockResolvedValue(mockAnalyticsData.deliveryStats);
    EmailAnalyticsService.getPerformanceMetrics.mockResolvedValue(mockAnalyticsData.performanceMetrics);
    EmailAnalyticsService.getEmailLogs.mockResolvedValue({
      logs: mockAnalyticsData.recentLogs,
      pagination: { total: 2, page: 1, limit: 10 },
    });
    jest.clearAllMocks();
  });

  it('should render analytics dashboard with key metrics', async () => {
    render(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Email Analytics Dashboard')).toBeInTheDocument();
    });

    // Check for key metrics
    expect(screen.getByText('1,250')).toBeInTheDocument(); // Total sent
    expect(screen.getByText('1,180')).toBeInTheDocument(); // Delivered
    expect(screen.getByText('94.4%')).toBeInTheDocument(); // Delivery rate
    expect(screen.getByText('3.6%')).toBeInTheDocument(); // Bounce rate
  });

  it('should display delivery statistics chart', async () => {
    render(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });

    const chartElement = screen.getByTestId('doughnut-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}');
    
    expect(chartData.labels).toContain('Delivered');
    expect(chartData.labels).toContain('Bounced');
    expect(chartData.labels).toContain('Failed');
  });

  it('should display performance metrics', async () => {
    render(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('2.3s')).toBeInTheDocument(); // Average delivery time
    });

    // Check email type distribution
    expect(screen.getByText('450')).toBeInTheDocument(); // Welcome emails
    expect(screen.getByText('600')).toBeInTheDocument(); // Lesson reminders
  });

  it('should show recent email logs', async () => {
    render(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Email Activity')).toBeInTheDocument();
    });

    // Check for log entries
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getByText('delivered')).toBeInTheDocument();
    expect(screen.getByText('bounced')).toBeInTheDocument();
  });

  it('should handle date range filtering', async () => {
    render(<EmailAnalyticsDashboard />);

    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    const applyButton = screen.getByText('Apply Filter');

    fireEvent.change(startDateInput, { target: { value: '2024-08-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-08-31' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      const { EmailAnalyticsService } = require('@/lib/email-analytics-service');
      expect(EmailAnalyticsService.getDeliveryStatistics).toHaveBeenCalledWith({
        startDate: '2024-08-01',
        endDate: '2024-08-31',
      });
    });
  });

  it('should support email type filtering', async () => {
    render(<EmailAnalyticsDashboard />);

    const emailTypeSelect = screen.getByLabelText(/email type/i);
    fireEvent.change(emailTypeSelect, { target: { value: 'welcome' } });

    const applyButton = screen.getByText('Apply Filter');
    fireEvent.click(applyButton);

    await waitFor(() => {
      const { EmailAnalyticsService } = require('@/lib/email-analytics-service');
      expect(EmailAnalyticsService.getEmailLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          emailType: 'welcome',
        })
      );
    });
  });

  it('should export analytics data', async () => {
    const { EmailAnalyticsService } = require('@/lib/email-analytics-service');
    EmailAnalyticsService.exportLogs.mockResolvedValue(new Blob(['csv,data'], { type: 'text/csv' }));

    render(<EmailAnalyticsDashboard />);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    // Select CSV format
    const csvOption = screen.getByText('CSV');
    fireEvent.click(csvOption);

    const confirmExportButton = screen.getByText('Export');
    fireEvent.click(confirmExportButton);

    await waitFor(() => {
      expect(EmailAnalyticsService.exportLogs).toHaveBeenCalledWith({
        format: 'csv',
        filters: expect.any(Object),
      });
    });
  });

  it('should handle real-time updates', async () => {
    const { EmailAnalyticsService } = require('@/lib/email-analytics-service');
    
    render(<EmailAnalyticsDashboard />);

    // Enable real-time updates
    const realTimeToggle = screen.getByLabelText(/real-time updates/i);
    fireEvent.click(realTimeToggle);

    // Wait for initial load
    await waitFor(() => {
      expect(EmailAnalyticsService.getDeliveryStatistics).toHaveBeenCalled();
    });

    // Mock updated data
    const updatedStats = {
      ...mockAnalyticsData.deliveryStats,
      totalSent: 1260,
      delivered: 1190,
    };
    EmailAnalyticsService.getDeliveryStatistics.mockResolvedValue(updatedStats);

    // Wait for auto-refresh (mocked timer)
    jest.advanceTimersByTime(30000); // 30 seconds

    await waitFor(() => {
      expect(screen.getByText('1,260')).toBeInTheDocument();
      expect(screen.getByText('1,190')).toBeInTheDocument();
    });
  });

  it('should display error states gracefully', async () => {
    const { EmailAnalyticsService } = require('@/lib/email-analytics-service');
    EmailAnalyticsService.getDeliveryStatistics.mockRejectedValue(new Error('API Error'));

    render(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error loading analytics data/i)).toBeInTheDocument();
    });

    // Should show retry button
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(EmailAnalyticsService.getDeliveryStatistics).toHaveBeenCalledTimes(2);
    });
  });

  it('should show loading states', () => {
    render(<EmailAnalyticsDashboard />);

    // Should show loading indicators initially
    expect(screen.getByTestId('analytics-loading')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-loading')).toBeInTheDocument();
    expect(screen.getByTestId('logs-loading')).toBeInTheDocument();
  });

  it('should handle empty data states', async () => {
    const { EmailAnalyticsService } = require('@/lib/email-analytics-service');
    EmailAnalyticsService.getEmailLogs.mockResolvedValue({
      logs: [],
      pagination: { total: 0, page: 1, limit: 10 },
    });

    render(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no email activity found/i)).toBeInTheDocument();
    });
  });

  it('should support pagination for email logs', async () => {
    const { EmailAnalyticsService } = require('@/lib/email-analytics-service');
    
    render(<EmailAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Email Activity')).toBeInTheDocument();
    });

    // Mock pagination response
    EmailAnalyticsService.getEmailLogs.mockResolvedValue({
      logs: [
        {
          id: '3',
          emailType: 'custom',
          recipient: 'user3@example.com',
          status: 'delivered',
          sentAt: '2024-08-31T12:00:00Z',
        },
      ],
      pagination: { total: 3, page: 2, limit: 10 },
    });

    const nextPageButton = screen.getByText('Next');
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(EmailAnalyticsService.getEmailLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });
});