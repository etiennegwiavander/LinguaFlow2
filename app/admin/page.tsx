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

interface TutorData {
  id: string;
  name: string | null;
  email: string;
  status: string;
  studentsCount: number;
  lessonsGenerated: number;
  is_admin: boolean;
}

interface SystemLog {
  id: number;
  timestamp: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  details: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [logFilter, setLogFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tutorList, setTutorList] = useState<TutorData[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState({
    totalTutors: 0,
    totalStudents: 0,
    totalLessons: 0,
    systemHealth: 0
  });

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
        fetchAdminData();
      } catch (error: any) {
        toast.error('Failed to verify admin status');
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch total tutors count
      const { count: tutorsCount, error: tutorsError } = await supabase
        .from('tutors')
        .select('*', { count: 'exact', head: true });
      
      if (tutorsError) throw tutorsError;
      
      // Fetch total students count
      const { count: studentsCount, error: studentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      if (studentsError) throw studentsError;
      
      // Fetch total lessons count
      const { count: lessonsCount, error: lessonsError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });
      
      if (lessonsError) throw lessonsError;
      
      // Fetch all tutors
      const { data: tutorsData, error: tutorsDataError } = await supabase
        .from('tutors')
        .select('id, name, email, is_admin, deleted_at, deletion_scheduled');
      
      if (tutorsDataError) throw tutorsDataError;
      
      // Fetch all students to calculate per-tutor counts
      const { data: studentsData, error: studentsDataError } = await supabase
        .from('students')
        .select('id, tutor_id');
      
      if (studentsDataError) throw studentsDataError;
      
      // Fetch all lessons to calculate per-tutor counts
      const { data: lessonsData, error: lessonsDataError } = await supabase
        .from('lessons')
        .select('id, tutor_id');
      
      if (lessonsDataError) throw lessonsDataError;
      
      // Process tutor data with student and lesson counts
      const processedTutors = tutorsData.map(tutor => {
        const tutorStudents = studentsData?.filter(student => student.tutor_id === tutor.id) || [];
        const tutorLessons = lessonsData?.filter(lesson => lesson.tutor_id === tutor.id) || [];
        
        return {
          id: tutor.id,
          name: tutor.name || 'Unnamed Tutor',
          email: tutor.email,
          status: tutor.deleted_at || tutor.deletion_scheduled ? 'inactive' : 'active',
          studentsCount: tutorStudents.length,
          lessonsGenerated: tutorLessons.length,
          is_admin: tutor.is_admin
        };
      });
      
      // Generate some sample system logs (in a real app, these would come from a logs table)
      const sampleLogs: SystemLog[] = [
        { 
          id: 1, 
          timestamp: new Date().toISOString(), 
          type: 'error', 
          message: 'Lesson Generation Failed for User #123', 
          details: 'API Timeout' 
        },
        { 
          id: 2, 
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(), 
          type: 'warning', 
          message: 'Calendar Sync Delayed', 
          details: 'Rate Limit Reached' 
        },
        { 
          id: 3, 
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(), 
          type: 'info', 
          message: 'New Tutor Registration', 
          details: `ID #${tutorsData[tutorsData.length - 1]?.id.slice(0, 8) || '456'}` 
        },
        { 
          id: 4, 
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(), 
          type: 'warning', 
          message: 'High API Usage Detected', 
          details: 'Approaching Rate Limit' 
        },
        { 
          id: 5, 
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(), 
          type: 'info', 
          message: 'System Backup Completed', 
          details: 'All Data Secured' 
        },
        { 
          id: 6, 
          timestamp: new Date(Date.now() - 180 * 60000).toISOString(), 
          type: 'error', 
          message: 'Database Connection Error', 
          details: 'Automatic Recovery Successful' 
        },
      ];
      
      // Update state with fetched data
      setStats({
        totalTutors: tutorsCount || 0,
        totalStudents: studentsCount || 0,
        totalLessons: lessonsCount || 0,
        systemHealth: 98.9 // Sample value, in a real app this would be calculated
      });
      
      setTutorList(processedTutors);
      setSystemLogs(sampleLogs);
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateDeactivateTutor = async (tutorId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      if (newStatus === 'inactive') {
        // Mark as scheduled for deletion (soft delete)
        const { error } = await supabase
          .from('tutors')
          .update({ 
            deletion_scheduled: true 
          })
          .eq('id', tutorId);
          
        if (error) throw error;
        toast.success('Tutor deactivated successfully');
      } else {
        // Reactivate tutor
        const { error } = await supabase
          .from('tutors')
          .update({ 
            deletion_scheduled: false,
            deleted_at: null
          })
          .eq('id', tutorId);
          
        if (error) throw error;
        toast.success('Tutor activated successfully');
      }
      
      // Refresh data
      fetchAdminData();
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tutor status');
    }
  };

  const handleDeleteTutor = async (tutorId: string) => {
    if (!confirm('Are you sure you want to delete this tutor? This action cannot be undone.')) {
      return;
    }

    try {
      // Hard delete the tutor
      const { error } = await supabase
        .from('tutors')
        .delete()
        .eq('id', tutorId);
        
      if (error) throw error;
      
      toast.success('Tutor deleted successfully');
      
      // Refresh data
      fetchAdminData();
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tutor');
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
              <div className="text-2xl font-bold">{stats.totalTutors}</div>
              <p className="text-xs text-muted-foreground">+5.4% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">+12.7% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLessons}</div>
              <p className="text-xs text-muted-foreground">+8.2% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.systemHealth}%</div>
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
                      {tutorList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No tutors found
                          </TableCell>
                        </TableRow>
                      ) : (
                        tutorList.map((tutor) => (
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
                                onClick={() => handleActivateDeactivateTutor(tutor.id, tutor.status)}
                              >
                                {tutor.status === "active" ? "Deactivate" : "Activate"}
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleDeleteTutor(tutor.id)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
                            {new Date(log.timestamp).toLocaleString()}
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