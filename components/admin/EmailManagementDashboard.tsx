"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Server,
  FileText,
  TestTube,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  Users,
  Send,
  Shield,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";

interface EmailType {
  type: 'welcome' | 'lesson_reminder' | 'password_reset' | 'newsletter' | 'notification';
  name: string;
  description: string;
  is_active: boolean;
  template_count: number;
  last_sent?: string;
  success_rate: number;
  total_sent_24h: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  smtpConnection: 'connected' | 'disconnected' | 'error';
  activeTemplates: number;
  totalTemplates: number;
  recentErrors: number;
  lastHealthCheck: string;
}

interface DashboardData {
  emailTypes: EmailType[];
  systemHealth: SystemHealth;
  quickStats: {
    emails_sent_24h: number;
    emails_delivered_24h: number;
    active_templates: number;
    pending_emails: number;
    bounce_rate_24h: number;
    delivery_rate_24h: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'email_sent' | 'template_updated' | 'smtp_configured' | 'error_occurred' | 'test_completed';
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
    details?: {
      email?: string;
      template_name?: string;
      error_message?: string;
    };
  }>;
  alerts: Array<{
    id: string;
    type: 'bounce_rate' | 'delivery_failure' | 'smtp_error' | 'template_error' | 'queue_backup';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    is_resolved: boolean;
    action_required?: string;
  }>;
  lastUpdated: string;
}

export default function EmailManagementDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/email/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      // API returns { success: true, data: dashboardData }
      setDashboardData(result.data || result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleToggleEmailType = async (emailType: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/email/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_email_type',
          data: { emailType, isActive }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle email type');
      }

      toast.success(`Email type ${isActive ? 'enabled' : 'disabled'}`);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error toggling email type:', error);
      toast.error('Failed to update email type');
    }
  };

  const handleSystemHealthCheck = async () => {
    try {
      const response = await fetch('/api/admin/email/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'system_health_check',
          data: {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to perform health check');
      }

      toast.success('System health check completed');
      await fetchDashboardData();
    } catch (error) {
      console.error('Error performing health check:', error);
      toast.error('Failed to perform health check');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Management Dashboard</h1>
            <p className="text-muted-foreground">Loading email system overview...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load email management dashboard. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActivityStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Management Dashboard</h1>
          <p className="text-muted-foreground">
            Central control panel for all email communications and system health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <Activity className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleSystemHealthCheck}
          >
            <Shield className="h-4 w-4 mr-2" />
            Health Check
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity === 'high' ? 'destructive' : 'default'}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="capitalize">{alert.type.replace('_', ' ')}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent (24h)</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.quickStats.emails_sent_24h}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.quickStats.active_templates}
              <span className="text-sm text-muted-foreground">
                /{dashboardData.systemHealth.totalTemplates}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Templates configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMTP Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {dashboardData.systemHealth.smtpConnection === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {dashboardData.systemHealth.smtpConnection === 'connected' ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Email delivery status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {getHealthStatusIcon(dashboardData.systemHealth.status)}
          </CardHeader>
          <CardContent>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getHealthStatusColor(dashboardData.systemHealth.status)}`}>
              {dashboardData.systemHealth.status.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.systemHealth.recentErrors} errors (24h)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="email-types">Email Types</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* System Health Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>System Health</span>
                </CardTitle>
                <CardDescription>
                  Overall email system status and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMTP Connection</span>
                  <Badge variant={dashboardData.systemHealth.smtpConnection === 'connected' ? 'default' : 'destructive'}>
                    {dashboardData.systemHealth.smtpConnection}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Templates</span>
                  <span className="text-sm font-medium">
                    {dashboardData.systemHealth.activeTemplates}/{dashboardData.systemHealth.totalTemplates}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recent Errors</span>
                  <span className="text-sm font-medium">{dashboardData.systemHealth.recentErrors}</span>
                </div>
                <div className="pt-2">
                  <Progress
                    value={dashboardData.systemHealth.totalTemplates > 0 ?
                      (dashboardData.systemHealth.activeTemplates / dashboardData.systemHealth.totalTemplates) * 100 : 0
                    }
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Template activation rate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>
                  Common email management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin-portal/email?tab=smtp">
                  <Button variant="outline" className="w-full justify-start">
                    <Server className="h-4 w-4 mr-2" />
                    Configure SMTP Settings
                  </Button>
                </Link>
                <Link href="/admin-portal/email?tab=templates">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Email Templates
                  </Button>
                </Link>
                <Link href="/admin-portal/email?tab=testing">
                  <Button variant="outline" className="w-full justify-start">
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Email Delivery
                  </Button>
                </Link>
                <Link href="/admin-portal/email?tab=analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email-types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Types Overview</CardTitle>
              <CardDescription>
                Manage different types of automated emails and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.emailTypes.map((emailType) => (
                  <div key={emailType.type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{emailType.name}</h3>
                          <p className="text-xs text-muted-foreground mb-1">{emailType.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {emailType.total_sent_24h} sent • {Math.round(emailType.success_rate * 100)}% success rate
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={emailType.is_active ? 'default' : 'secondary'}>
                        {emailType.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleEmailType(emailType.type, !emailType.is_active)}
                      >
                        {emailType.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest email system events and operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      {getActivityStatusIcon(activity.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}