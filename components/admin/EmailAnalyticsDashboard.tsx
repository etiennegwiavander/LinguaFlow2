"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Mail,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

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

interface EmailLog {
  id: string;
  templateId: string | null;
  templateType: string;
  recipientEmail: string;
  subject: string;
  status: string;
  sentAt: string;
  deliveredAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  isTest: boolean;
  metadata: any;
}

interface EmailLogResponse {
  logs: EmailLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalBounced: number;
    totalPending: number;
  };
}

const EmailAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [logs, setLogs] = useState<EmailLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [emailTypeFilter, setEmailTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // Chart configurations
  const chartConfig = {
    sent: {
      label: "Sent",
      color: "hsl(var(--chart-1))",
    },
    delivered: {
      label: "Delivered", 
      color: "hsl(var(--chart-2))",
    },
    failed: {
      label: "Failed",
      color: "hsl(var(--chart-3))",
    },
    bounced: {
      label: "Bounced",
      color: "hsl(var(--chart-4))",
    },
  };

  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const fetchAnalytics = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        start_date: `${dateRange.start}T00:00:00.000Z`,
        end_date: `${dateRange.end}T23:59:59.999Z`,
      });
      
      if (emailTypeFilter && emailTypeFilter !== 'all') {
        params.append('email_type', emailTypeFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/email/analytics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const result = await response.json();
      // API returns { success: true, data: analytics }
      setAnalytics(result.data || result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load email analytics');
    }
  }, [dateRange, emailTypeFilter, statusFilter]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: `${dateRange.start}T00:00:00.000Z`,
        end_date: `${dateRange.end}T23:59:59.999Z`,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_by: 'sent_at',
        sort_order: 'desc'
      });
      
      if (emailTypeFilter && emailTypeFilter !== 'all') {
        params.append('email_type', emailTypeFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('recipient_email', searchQuery);
      }

      const response = await fetch(`/api/admin/email/logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load email logs');
    } finally {
      setLogsLoading(false);
    }
  }, [dateRange, emailTypeFilter, statusFilter, searchQuery, currentPage, pageSize]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalytics(), fetchLogs()]);
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const exportData: any = {
        startDate: `${dateRange.start}T00:00:00.000Z`,
        endDate: `${dateRange.end}T23:59:59.999Z`,
        format,
        includeMetadata: true
      };
      
      if (emailTypeFilter && emailTypeFilter !== 'all') {
        exportData.emailType = emailTypeFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        exportData.status = statusFilter;
      }
      if (searchQuery) {
        exportData.recipientEmail = searchQuery;
      }

      const response = await fetch('/api/admin/email/logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `email-logs-${dateRange.start}-to-${dateRange.end}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export report');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAnalytics(), fetchLogs()]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchAnalytics, fetchLogs]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'bounced':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'bounced':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load email analytics. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare chart data
  const emailTypeData = analytics.emailTypeBreakdown 
    ? Object.entries(analytics.emailTypeBreakdown).map(([type, stats]) => ({
        name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        sent: stats.sent,
        delivered: stats.delivered,
        failed: stats.failed,
        bounced: stats.bounced
      }))
    : [];

  const pieData = [
    { name: 'Delivered', value: analytics.totalDelivered, color: pieColors[0] },
    { name: 'Failed', value: analytics.totalFailed, color: pieColors[1] },
    { name: 'Bounced', value: analytics.totalBounced, color: pieColors[2] },
    { name: 'Pending', value: analytics.totalSent - analytics.totalDelivered - analytics.totalFailed - analytics.totalBounced, color: pieColors[3] }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Analytics</h2>
          <p className="text-muted-foreground">
            Monitor email delivery performance and system health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {analytics.alerts.length > 0 && (
        <div className="space-y-2">
          {analytics.alerts.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
              {getSeverityIcon(alert.severity)}
              <AlertTitle className="capitalize">{alert.severity} Priority Alert</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Type</Label>
              <Select value={emailTypeFilter} onValueChange={setEmailTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="lesson_reminder">Lesson Reminder</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Email</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange.start} to {dateRange.end}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(analytics.deliveryRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalDelivered.toLocaleString()} delivered
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.bounceRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
              {(analytics.bounceRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalBounced.toLocaleString()} bounced
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.totalFailed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalSent > 0 ? ((analytics.totalFailed / analytics.totalSent) * 100).toFixed(1) : 0}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Email Trends</CardTitle>
            <CardDescription>
              Email volume and delivery status over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={analytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="var(--color-sent)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="delivered" 
                  stroke="var(--color-delivered)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="var(--color-failed)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of email delivery statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Email Type Breakdown */}
      {emailTypeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Email Type Performance</CardTitle>
            <CardDescription>
              Delivery statistics by email type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <BarChart data={emailTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="sent" fill="var(--color-sent)" />
                <Bar dataKey="delivered" fill="var(--color-delivered)" />
                <Bar dataKey="failed" fill="var(--color-failed)" />
                <Bar dataKey="bounced" fill="var(--color-bounced)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Activity</CardTitle>
          <CardDescription>
            Detailed log of email delivery attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs && logs.logs && logs.logs.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Test</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(log.status)}
                            <Badge variant={getStatusBadgeVariant(log.status)}>
                              {log.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.templateType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.recipientEmail}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.subject}
                        </TableCell>
                        <TableCell>
                          {new Date(log.sentAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {log.isTest && (
                            <Badge variant="secondary">Test</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {logs.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((logs.pagination.page - 1) * logs.pagination.limit) + 1} to{' '}
                    {Math.min(logs.pagination.page * logs.pagination.limit, logs.pagination.total)} of{' '}
                    {logs.pagination.total} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {logs.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(logs.pagination.totalPages, prev + 1))}
                      disabled={currentPage === logs.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No email logs found for the selected criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAnalyticsDashboard;