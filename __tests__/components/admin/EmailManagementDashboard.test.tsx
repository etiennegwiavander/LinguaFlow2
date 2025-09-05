import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import EmailManagementDashboard from '@/components/admin/EmailManagementDashboard';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the toast function
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockDashboardData = {
  emailTypes: [
    {
      type: 'welcome',
      name: 'Welcome Email',
      isActive: true,
      templateId: '1',
      lastModified: '2024-03-20T10:00:00Z',
      usageStats: {
        totalSent: 100,
        lastSent: '2024-03-20T09:00:00Z',
        successRate: 0.95,
      },
      schedulingConfig: {
        enabled: true,
        timing: 'immediate',
        triggerEvent: 'user_registration',
      },
    },
  ],
  systemHealth: {
    status: 'healthy' as const,
    smtpConnection: 'connected' as const,
    activeTemplates: 3,
    totalTemplates: 4,
    recentErrors: 0,
    lastHealthCheck: '2024-03-20T10:00:00Z',
  },
  quickStats: {
    totalEmailsSent24h: 50,
    activeTemplates: 3,
    configuredSMTP: true,
    pendingTests: 0,
  },
  recentActivity: [
    {
      id: '1',
      type: 'email_sent' as const,
      description: 'Welcome email sent to user@example.com',
      timestamp: '2024-03-20T09:30:00Z',
      status: 'success' as const,
    },
  ],
  alerts: [],
};

describe('EmailManagementDashboard', () => {
  beforeEach(() => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockDashboardData,
    } as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dashboard title', async () => {
    render(<EmailManagementDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Email Management Dashboard')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<EmailManagementDashboard />);
    
    expect(screen.getByText('Loading email system overview...')).toBeInTheDocument();
  });

  it('displays quick stats after loading', async () => {
    render(<EmailManagementDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument(); // totalEmailsSent24h
      expect(screen.getByText('3/4')).toBeInTheDocument(); // activeTemplates/totalTemplates
    });
  });

  it('displays system health status', async () => {
    render(<EmailManagementDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('displays email types in the email types tab', async () => {
    render(<EmailManagementDashboard />);
    
    await waitFor(() => {
      // Click on email types tab
      const emailTypesTab = screen.getByText('Email Types');
      emailTypesTab.click();
      
      expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      expect(screen.getByText('100 sent • 95% success rate')).toBeInTheDocument();
    });
  });

  it('displays recent activity', async () => {
    render(<EmailManagementDashboard />);
    
    await waitFor(() => {
      // Click on activity tab
      const activityTab = screen.getByText('Recent Activity');
      activityTab.click();
      
      expect(screen.getByText('Welcome email sent to user@example.com')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('API Error'));
    
    render(<EmailManagementDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load email management dashboard. Please try refreshing the page.')).toBeInTheDocument();
    });
  });
});