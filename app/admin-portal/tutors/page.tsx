"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Search, Eye, MoreHorizontal, UserCog, KeyRound, Trash2, ShieldAlert, ShieldCheck, Mail, CheckCircle2, XCircle, UserRound, Loader2, Filter } from "lucide-react";
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

export default function TutorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState<string | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch tutors');
    } finally {
      setLoading(false);
    }
  };

  const filteredTutors = tutors.filter(tutor => {
    // Apply status filter
    if (statusFilter !== "all" && tutor.status !== statusFilter) return false;
    
    // Apply search filter
    return tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tutor.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tutors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tutor Management</h1>
          <p className="text-muted-foreground">
            Manage tutors and their access across the platform
          </p>
        </div>
        <Button>
          Add New Tutor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tutors by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tutors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tutors</CardTitle>
          <CardDescription>
            {filteredTutors.length} {filteredTutors.length === 1 ? 'tutor' : 'tutors'} found
          </CardDescription>
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