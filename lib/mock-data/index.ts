/**
 * Mock Data Services Index
 * Central export point for all email management mock data services
 */

// Email Analytics
export {
  generateMockEmailAnalytics,
  getMockAnalyticsWithFilters,
  getMockTrendingData,
  type EmailAnalytics
} from './email-analytics';

// Email Templates
export {
  generateMockEmailTemplates,
  getMockTemplatesWithFilters,
  getMockTemplateById,
  getMockTemplateTypes,
  createMockTemplate,
  updateMockTemplate,
  type EmailTemplate
} from './email-templates';

// SMTP Configurations
export {
  generateMockSMTPConfigs,
  getMockSMTPConfigsWithFilters,
  getMockSMTPConfigById,
  testMockSMTPConfig,
  createMockSMTPConfig,
  updateMockSMTPConfig,
  getSMTPProviderTemplates,
  type SMTPConfig
} from './smtp-configs';

// Email Logs
export {
  generateMockEmailLogs,
  getMockEmailLogsWithFilters,
  getMockEmailLogStats,
  getMockEmailLogById,
  getMockRecentEmailActivity,
  exportMockEmailLogs,
  type EmailLog
} from './email-logs';

// Dashboard Data
export {
  generateMockDashboardData,
  getMockDashboardDataWithUpdates,
  getMockSystemStatus,
  type DashboardData,
  type EmailType,
  type SystemHealth,
  type QuickStats,
  type Activity,
  type Alert
} from './dashboard-data';

/**
 * Initialize all mock data services
 * This can be used to pre-generate data or warm up caches
 */
export function initializeMockDataServices() {
  console.log('Initializing mock data services...');
  
  // Pre-generate some data to ensure consistency
  const analytics = generateMockEmailAnalytics();
  const templates = generateMockEmailTemplates();
  const smtpConfigs = generateMockSMTPConfigs();
  const dashboardData = generateMockDashboardData();
  
  console.log('Mock data services initialized:', {
    analytics: !!analytics,
    templates: templates.length,
    smtpConfigs: smtpConfigs.length,
    dashboardData: !!dashboardData
  });
  
  return {
    analytics,
    templates,
    smtpConfigs,
    dashboardData
  };
}

/**
 * Get all mock data for development/testing
 */
export function getAllMockData() {
  return {
    analytics: generateMockEmailAnalytics(),
    templates: generateMockEmailTemplates(),
    smtpConfigs: generateMockSMTPConfigs(),
    emailLogs: generateMockEmailLogs(50),
    dashboardData: generateMockDashboardData()
  };
}

/**
 * Reset all mock data (useful for testing)
 */
export function resetMockData() {
  console.log('Resetting mock data...');
  // In a real implementation, this would clear any cached data
  return getAllMockData();
}