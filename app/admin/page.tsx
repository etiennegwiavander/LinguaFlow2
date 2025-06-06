"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MainLayout from "@/components/main-layout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Shield, Users, BarChart, Zap, Search, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Sample data for demonstration
const tutors = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "active", studentsCount: 15, lessonsGenerated: 45 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "inactive", studentsCount: 8, lessonsGenerated: 23 },
  // Add more sample tutors as needed
];

const systemLogs = [
  { id: 1, timestamp: "2024-03-20 14:30:00", type: "error", message: "Lesson Generation Failed for User #123", details: "API Timeout" },
  { id: 2, timestamp: "2024-03-20 14:15:00", type: "warning", message: "Calendar Sync Delayed", details: "Rate Limit Reached" },
  { id: 3, timestamp: "2024-03-20 14:00:00", type: "info", message: "New Tutor Registration", details: "ID #456" },
  // Add more sample logs as needed
];

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [logFilter, setLogFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tutors')
          .select('id, is_admin')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        // If no tutor record found or user is not admin
        if (!data || !data.is_admin) {
          toast.error('Access denied. Admin privileges required.');
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error: any) {
        toast.error('Failed to verify admin status');
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Verifying admin access...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <Button>Generate Reports</Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tutors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">+5.4% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,842</div>
              <p className="text-xs text-muted-foreground">+12.7% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24,389</div>
              <p className="text-xs text-muted-foreground">+8.2% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">98.9%</div>
              <p className="text-xs text-muted-foreground">API Uptime</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin tabs */}
        <Tabs defaultValue="tutors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="tutors" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Manage Tutors</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">System Logs</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Tutors Management Tab */}
          <TabsContent value="tutors" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tutor Management</CardTitle>
                  <CardDescription>
                    Manage tutors and their access across the platform.
                  </CardDescription>
                </div>
                <Button>
                  Add New Tutor
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name/Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Lessons</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tutors.map((tutor) => (
                        <TableRow key={tutor.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tutor.name}</p>
                              <p className="text-sm text-muted-foreground">{tutor.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={tutor.status === "active" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {tutor.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{tutor.studentsCount}</TableCell>
                          <TableCell>{tutor.lessonsGenerated}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" className="mr-2">View</Button>
                            <Button 
                              variant={tutor.status === "active" ? "destructive" : "default"}
                              className="mr-2"
                            >
                              {tutor.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                            <Button variant="destructive">Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* System Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>
                  Monitor system activities and error logs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
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
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {log.timestamp}
                          </TableCell>
                          <TableCell>
                            <Badge className={getLogTypeColor(log.type)}>
                              {log.type === "error" && <XCircle className="w-4 h-4 mr-1" />}
                              {log.type === "warning" && <AlertTriangle className="w-4 h-4 mr-1" />}
                              {log.type === "info" && <CheckCircle2 className="w-4 h-4 mr-1" />}
                              {log.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.message}</TableCell>
                          <TableCell>{log.details}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}