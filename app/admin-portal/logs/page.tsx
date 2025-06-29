"use client";

import { useState, useEffect } from "react";
import { Search, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SystemLog {
  id: number;
  timestamp: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  details: string;
}

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logFilter, setLogFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch logs from your database
      // For this demo, we'll use simulated data
      
      // Simulated API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSystemLogs([
        { id: 1, timestamp: "2024-03-20 14:30:00", type: 'error', message: "Lesson Generation Failed for User #123", details: "API Timeout" },
        { id: 2, timestamp: "2024-03-20 14:15:00", type: 'warning', message: "Calendar Sync Delayed", details: "Rate Limit Reached" },
        { id: 3, timestamp: "2024-03-20 14:00:00", type: 'info', message: "New Tutor Registration", details: "ID #456" },
        { id: 4, timestamp: "2024-03-19 23:45:00", type: 'error', message: "Database Connection Error", details: "Timeout after 30s" },
        { id: 5, timestamp: "2024-03-19 22:30:00", type: 'warning', message: "High CPU Usage Detected", details: "Server Load: 89%" },
        { id: 6, timestamp: "2024-03-19 21:15:00", type: 'info', message: "System Backup Completed", details: "Size: 2.3GB" },
        { id: 7, timestamp: "2024-03-19 18:20:00", type: 'info', message: "Scheduled Maintenance Completed", details: "Duration: 15min" },
        { id: 8, timestamp: "2024-03-19 15:10:00", type: 'warning', message: "API Rate Limit Warning", details: "90% of quota used" },
        { id: 9, timestamp: "2024-03-19 12:05:00", type: 'error', message: "Payment Processing Failed", details: "Gateway Timeout" },
        { id: 10, timestamp: "2024-03-19 10:30:00", type: 'info', message: "New Feature Deployed", details: "v2.3.0" },
        { id: 11, timestamp: "2024-03-18 22:15:00", type: 'error', message: "Email Delivery Failed", details: "SMTP Connection Error" },
        { id: 12, timestamp: "2024-03-18 18:45:00", type: 'warning', message: "Storage Space Low", details: "85% Used" },
        { id: 13, timestamp: "2024-03-18 14:20:00", type: 'info', message: "User Password Changed", details: "User ID #789" },
        { id: 14, timestamp: "2024-03-18 09:10:00", type: 'info', message: "Daily Backup Completed", details: "Success" },
        { id: 15, timestamp: "2024-03-17 23:55:00", type: 'error', message: "Authentication Service Error", details: "JWT Validation Failed" }
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch system logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchLogs();
      toast.success('Logs refreshed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh logs');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredLogs = systemLogs.filter(log => {
    if (logFilter !== "all" && log.type !== logFilter) return false;
    return log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.details.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "error": return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "warning": return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "info": return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default: return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case "error": return <XCircle className="w-4 h-4 mr-1" />;
      case "warning": return <AlertTriangle className="w-4 h-4 mr-1" />;
      case "info": return <CheckCircle2 className="w-4 h-4 mr-1" />;
      default: return null;
    }
  };

  const getLogCounts = () => {
    const counts = {
      total: systemLogs.length,
      error: systemLogs.filter(log => log.type === 'error').length,
      warning: systemLogs.filter(log => log.type === 'warning').length,
      info: systemLogs.filter(log => log.type === 'info').length
    };
    return counts;
  };

  const logCounts = getLogCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading system logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">
            Monitor system activities and error logs
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Logs
            </>
          )}
        </Button>
      </div>

      {/* Log Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logCounts.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{logCounts.error}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{logCounts.warning}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{logCounts.info}</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>
            Monitor system activities and error logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No logs found matching your search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge className={getLogTypeColor(log.type)}>
                          {getLogTypeIcon(log.type)}
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>{log.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}