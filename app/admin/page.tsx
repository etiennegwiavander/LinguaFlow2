"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MainLayout from "@/components/main-layout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Shield, Users, BarChart, Zap, Search, AlertTriangle, CheckCircle2, XCircle, UserRound, Eye } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Tutor {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  status: string;
  studentsCount: number;
  lessonsCount: number;
  created_at: string;
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
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState({
    tutorsCount: 0,
    studentsCount: 0,
    lessonsCount: 0,
    systemHealth: 0
  });
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

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
      // Fetch tutors with student and lesson counts
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('id, name, email, avatar_url, is_admin, created_at');

      if (tutorsError) throw tutorsError;

      // Get student counts for each tutor
      const tutorsWithCounts = await Promise.all(
        tutorsData.map(async (tutor) => {
          // Get student count
          const { count: studentsCount, error: studentsError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('tutor_id', tutor.id);

          if (studentsError) throw studentsError;

          // Get lesson count
          const { count: lessonsCount, error: lessonsError } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('tutor_id', tutor.id);

          if (lessonsError) throw lessonsError;

          return {
            ...tutor,
            studentsCount: studentsCount || 0,
            lessonsCount: lessonsCount || 0,
            status: Math.random() > 0.3 ? 'active' : 'inactive' // Simulated status for demo
          };
        })
      );

      setTutors(tutorsWithCounts);

      // Fetch overall stats
      const { count: totalStudents, error: studentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      if (studentsError) throw studentsError;

      const { count: totalLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      if (lessonsError) throw lessonsError;

      setStats({
        tutorsCount: tutorsWithCounts.length,
        studentsCount: totalStudents || 0,
        lessonsCount: totalLessons || 0,
        systemHealth: 98.9 // Simulated for demo
      });

      // Fetch system logs (simulated for demo)
      setSystemLogs([
        { id: 1, timestamp: "2024-03-20 14:30:00", type: 'error', message: "Lesson Generation Failed for User #123", details: "API Timeout" },
        { id: 2, timestamp: "2024-03-20 14:15:00", type: 'warning', message: "Calendar Sync Delayed", details: "Rate Limit Reached" },
        { id: 3, timestamp: "2024-03-20 14:00:00", type: 'info', message: "New Tutor Registration", details: "ID #456" },
        { id: 4, timestamp: "2024-03-19 23:45:00", type: 'error', message: "Database Connection Error", details: "Timeout after 30s" },
        { id: 5, timestamp: "2024-03-19 22:30:00", type: 'warning', message: "High CPU Usage Detected", details: "Server Load: 89%" },
        { id: 6, timestamp: "2024-03-19 21:15:00", type: 'info', message: "System Backup Completed", details: "Size: 2.3GB" },
        { id: 7, timestamp: "2024-03-19 18:20:00", type: 'info', message: "Scheduled Maintenance Completed", details: "Duration: 15min" }
      ]);

    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch admin data');
    }
  };

  const filteredLogs = systemLogs.filter(log => {
    if (logFilter !== "all" && log.type !== logFilter) return false;
    return log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.details.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredTutors = tutors.filter(tutor => 
    tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "error": return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "warning": return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "info": return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default: return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const handleViewProfile = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsProfileDialogOpen(true);
  };

  const handleStatusChange = async (tutorId: string, newStatus: string) => {
    try {
      // In a real app, you would update the database
      // For this demo, we'll just update the local state
      setTutors(tutors.map(tutor => 
        tutor.id === tutorId ? {...tutor, status: newStatus} : tutor
      ));
      
      toast.success(`Tutor status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tutor status');
    }
  };

  const handleDeleteTutor = async (tutorId: string) => {
    if (!confirm('Are you sure you want to delete this tutor? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real app, you would delete from the database
      // For this demo, we'll just update the local state
      setTutors(tutors.filter(tutor => tutor.id !== tutorId));
      
      toast.success('Tutor deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tutor');
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
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
              <div className="text-2xl font-bold">{stats.tutorsCount}</div>
              <p className="text-xs text-muted-foreground">+5.4% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.studentsCount}</div>
              <p className="text-xs text-muted-foreground">+12.7% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lessonsCount}</div>
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
                <div className="mb-4">
                  <Input
                    placeholder="Search tutors by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                    prefix={<Search className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>
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
                      {filteredTutors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No tutors found matching your search criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTutors.map((tutor) => (
                          <TableRow key={tutor.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={tutor.avatar_url || undefined} alt={tutor.name || tutor.email} />
                                  <AvatarFallback className="bg-primary/10">
                                    {getInitials(tutor.name, tutor.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{tutor.name || "Unnamed Tutor"}</p>
                                  <p className="text-sm text-muted-foreground">{tutor.email}</p>
                                </div>
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
                            <TableCell>{tutor.lessonsCount}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleViewProfile(tutor)}
                                        className="h-8 px-2 text-xs"
                                      >
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        <span>View Profile</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View tutor profile details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant={tutor.status === "active" ? "destructive" : "default"}
                                        size="sm"
                                        onClick={() => handleStatusChange(
                                          tutor.id, 
                                          tutor.status === "active" ? "inactive" : "active"
                                        )}
                                        className="h-8 px-2 text-xs"
                                      >
                                        {tutor.status === "active" ? "Deactivate" : "Activate"}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{tutor.status === "active" ? "Disable tutor account" : "Enable tutor account"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteTutor(tutor.id)}
                                        className="h-8 px-2 text-xs"
                                      >
                                        Delete
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Permanently delete tutor account</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
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

      {/* Tutor Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTutor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  <span>Tutor Profile</span>
                </DialogTitle>
                <DialogDescription>
                  Detailed information about {selectedTutor.name || selectedTutor.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={selectedTutor.avatar_url || undefined} alt={selectedTutor.name || selectedTutor.email} />
                    <AvatarFallback className="text-xl bg-primary/10">
                      {getInitials(selectedTutor.name, selectedTutor.email)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-bold">{selectedTutor.name || "Unnamed Tutor"}</h2>
                    <p className="text-muted-foreground">{selectedTutor.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                      <Badge variant={selectedTutor.status === "active" ? "default" : "secondary"} className="capitalize">
                        {selectedTutor.status}
                      </Badge>
                      {selectedTutor.is_admin && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Account ID</p>
                      <p className="font-mono text-sm">{selectedTutor.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Created At</p>
                      <p>{new Date(selectedTutor.created_at).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="capitalize">{selectedTutor.status}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p>{selectedTutor.is_admin ? "Admin" : "Tutor"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Students</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTutor.studentsCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Lessons</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTutor.lessonsCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Avg. Lessons/Student</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedTutor.studentsCount > 0 
                            ? (selectedTutor.lessonsCount / selectedTutor.studentsCount).toFixed(1) 
                            : "0"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Admin Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Admin Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant={selectedTutor.status === "active" ? "destructive" : "default"}
                      onClick={() => {
                        handleStatusChange(
                          selectedTutor.id, 
                          selectedTutor.status === "active" ? "inactive" : "active"
                        );
                        setSelectedTutor({
                          ...selectedTutor, 
                          status: selectedTutor.status === "active" ? "inactive" : "active"
                        });
                      }}
                    >
                      {selectedTutor.status === "active" ? "Deactivate Account" : "Activate Account"}
                    </Button>
                    
                    <Button 
                      variant={selectedTutor.is_admin ? "destructive" : "outline"}
                      onClick={() => {
                        // In a real app, you would update the database
                        setSelectedTutor({...selectedTutor, is_admin: !selectedTutor.is_admin});
                        toast.success(`Admin privileges ${selectedTutor.is_admin ? 'revoked' : 'granted'}`);
                      }}
                    >
                      {selectedTutor.is_admin ? "Revoke Admin Access" : "Grant Admin Access"}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // In a real app, you would implement password reset functionality
                        toast.success('Password reset email sent');
                      }}
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleDeleteTutor(selectedTutor.id);
                    setIsProfileDialogOpen(false);
                  }}
                >
                  Delete Account
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsProfileDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}