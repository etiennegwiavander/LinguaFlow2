"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shield, Users, BarChart, Zap, Search, AlertTriangle, CheckCircle2, XCircle, UserRound, Eye, MoreHorizontal, UserCog, KeyRound, Trash2, ShieldAlert, ShieldCheck, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [logFilter, setLogFilter] = useState("all");
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState<string | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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

  const handleToggleAdminStatus = async (tutorId: string, isAdmin: boolean) => {
    try {
      // In a real app, you would update the database
      // For this demo, we'll just update the local state
      setTutors(tutors.map(tutor => 
        tutor.id === tutorId ? {...tutor, is_admin: !isAdmin} : tutor
      ));
      
      toast.success(`Admin privileges ${isAdmin ? 'revoked' : 'granted'}`);
      
      // Update selected tutor if dialog is open
      if (selectedTutor && selectedTutor.id === tutorId) {
        setSelectedTutor({...selectedTutor, is_admin: !isAdmin});
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update admin status');
    }
  };

  const handleResetPassword = async (tutorId: string) => {
    try {
      // In a real app, you would implement password reset functionality
      toast.success('Password reset email sent');
      setIsResetPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    }
  };

  const handleDeleteTutor = async (tutorId: string) => {
    try {
      // In a real app, you would delete from the database
      // For this demo, we'll just update the local state
      setTutors(tutors.filter(tutor => tutor.id !== tutorId));
      
      toast.success('Tutor deleted successfully');
      setIsDeleteDialogOpen(false);
      setIsProfileDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tutor');
    }
  };

  const confirmDelete = (tutorId: string) => {
    setTutorToDelete(tutorId);
    setIsDeleteDialogOpen(true);
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
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
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
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tutors by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                        <TableRow key={tutor.id} className="group">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/30">
                                <AvatarImage src={tutor.avatar_url || undefined} alt={tutor.name || tutor.email} />
                                <AvatarFallback className="bg-primary/10">
                                  {getInitials(tutor.name, tutor.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium group-hover:text-primary transition-colors duration-200">
                                  {tutor.name || "Unnamed Tutor"}
                                </p>
                                <p className="text-sm text-muted-foreground">{tutor.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={tutor.status === "active" ? "default" : "secondary"}
                              className={`capitalize ${tutor.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}`}
                            >
                              {tutor.status === "active" ? (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {tutor.status}
                            </Badge>
                            {tutor.is_admin && (
                              <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                Admin
                              </Badge>
                            )}
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
                                      size="icon"
                                      onClick={() => handleViewProfile(tutor)}
                                      className="h-8 w-8 transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Profile</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <DropdownMenu>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="icon"
                                          className="h-8 w-8 transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>More Actions</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuLabel>Tutor Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleViewProfile(tutor)}
                                    className="cursor-pointer"
                                  >
                                    <UserRound className="mr-2 h-4 w-4" />
                                    <span>View Profile</span>
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(
                                      tutor.id, 
                                      tutor.status === "active" ? "inactive" : "active"
                                    )}
                                    className="cursor-pointer"
                                  >
                                    {tutor.status === "active" ? (
                                      <>
                                        <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                        <span>Deactivate Account</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                        <span>Activate Account</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleAdminStatus(tutor.id, tutor.is_admin)}
                                    className="cursor-pointer"
                                  >
                                    {tutor.is_admin ? (
                                      <>
                                        <ShieldAlert className="mr-2 h-4 w-4 text-red-500" />
                                        <span>Revoke Admin Access</span>
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                                        <span>Grant Admin Access</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedTutor(tutor);
                                      setIsResetPasswordDialogOpen(true);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <KeyRound className="mr-2 h-4 w-4 text-amber-500" />
                                    <span>Reset Password</span>
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => confirmDelete(tutor.id)}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete Account</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                      <Badge 
                        variant={selectedTutor.status === "active" ? "default" : "secondary"} 
                        className={`capitalize ${selectedTutor.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}`}
                      >
                        {selectedTutor.status === "active" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {selectedTutor.status}
                      </Badge>
                      {selectedTutor.is_admin && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                          <ShieldCheck className="w-3 h-3 mr-1" />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          <UserCog className="h-4 w-4 mr-2 text-amber-600" />
                          Account Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant={selectedTutor.status === "active" ? "destructive" : "default"}
                            size="sm"
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
                            className="justify-start"
                          >
                            {selectedTutor.status === "active" ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Deactivate Account
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Activate Account
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsResetPasswordDialogOpen(true);
                            }}
                            className="justify-start"
                          >
                            <KeyRound className="h-4 w-4 mr-2 text-amber-600" />
                            Reset Password
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-purple-200 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-800/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-purple-600" />
                          Permissions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant={selectedTutor.is_admin ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => {
                              handleToggleAdminStatus(selectedTutor.id, selectedTutor.is_admin);
                            }}
                            className="justify-start"
                          >
                            {selectedTutor.is_admin ? (
                              <>
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Revoke Admin Access
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-2 text-purple-600" />
                                Grant Admin Access
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(selectedTutor.id)}
                            className="justify-start"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsProfileDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  variant="default"
                  onClick={() => {
                    // In a real app, you would implement email functionality
                    toast.success('Email sent to tutor');
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Tutor
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tutor account
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tutorToDelete && handleDeleteTutor(tutorToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to the tutor. They will be able to set a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTutor && handleResetPassword(selectedTutor.id)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Send Reset Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}