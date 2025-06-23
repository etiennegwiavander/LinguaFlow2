"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MainLayout from "@/components/main-layout";
import { Student } from "@/types";
import { languages } from "@/lib/sample-data";
import { Plus, Users, MoreVertical, Eye, Pencil, Trash2, Loader2, Sparkles, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StudentForm from "@/components/students/StudentForm";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  // Initialize search term from URL parameter
  useEffect(() => {
    const searchName = searchParams.get('searchName');
    if (searchName) {
      setSearchTerm(searchName);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('tutor_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStudents(data || []);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleViewProfile = (studentId: string) => {
    router.push(`/students/${studentId}`);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      setStudents(students.filter(s => s.id !== studentId));
      toast.success('Student deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    // Clear URL parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('searchName');
    router.replace(newUrl.pathname);
  };

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code) || { code, name: code, flag: '🌐' };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyber-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your students...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-slide-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge className="badge-cyber">
                <Users className="w-3 h-3 mr-1" />
                Students
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              My <span className="gradient-text">Students</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your language learning students and track their progress
            </p>
          </div>
          <Button 
            onClick={handleAddStudent}
            className="btn-cyber hover-lift"
          >
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            Add New Student
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-cyber focus-cyber"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {searchTerm && (
            <div className="text-sm text-muted-foreground">
              {filteredStudents.length} of {students.length} students
            </div>
          )}
        </div>

        <section aria-labelledby="students-heading" className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <h2 className="section-title" id="students-heading">
              <Users className="section-icon" />
              Student List
              {filteredStudents.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredStudents.length}
                </Badge>
              )}
            </h2>
          </div>
          
          <div className="table-container">
            <Table>
              <TableCaption className="text-muted-foreground py-4">
                {searchTerm ? (
                  filteredStudents.length === 0 ? (
                    `No students found matching "${searchTerm}"`
                  ) : (
                    `Showing ${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'} matching "${searchTerm}"`
                  )
                ) : (
                  "A list of all your language students and their learning progress."
                )}
              </TableCaption>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Language</TableHead>
                  <TableHead className="font-semibold">Level</TableHead>
                  <TableHead className="w-[80px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Users className="w-8 h-8 text-cyber-400" />
                        </div>
                        <div>
                          {searchTerm ? (
                            <>
                              <p className="text-muted-foreground mb-2">
                                No students found matching "{searchTerm}"
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <Button 
                                  variant="outline" 
                                  onClick={handleClearSearch}
                                  className="btn-ghost-cyber"
                                >
                                  Clear search
                                </Button>
                                <Button 
                                  onClick={handleAddStudent}
                                  className="btn-ghost-cyber"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create "{searchTerm}"
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-muted-foreground mb-2">No students found</p>
                              <Button 
                                variant="outline" 
                                onClick={handleAddStudent}
                                className="btn-ghost-cyber"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add your first student
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => {
                    const langInfo = getLanguageInfo(student.target_language);
                    return (
                      <TableRow 
                        key={student.id} 
                        className="table-row animate-scale-in hover-lift"
                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3 ring-2 ring-cyber-400/20 group-hover:ring-cyber-400/50 transition-all duration-300">
                              <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
                              <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 font-semibold">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <Link 
                              href={`/students/${student.id}`}
                              className="text-primary hover:text-cyber-400 hover:underline transition-colors font-medium group-hover:text-cyber-400"
                            >
                              {student.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-2 text-lg">{langInfo.flag}</span>
                            <span className="group-hover:text-cyber-400 transition-colors duration-300">
                              {langInfo.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="capitalize border-cyber-400/30 group-hover:border-cyber-400/50 group-hover:text-cyber-400 transition-all duration-300"
                          >
                            {student.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-cyber-400/10 hover:text-cyber-400 transition-all duration-300 focus-cyber"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-effect border-cyber-400/30">
                              <DropdownMenuItem 
                                onClick={() => handleViewProfile(student.id)}
                                className="hover:bg-cyber-400/10 focus-cyber"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEditStudent(student)}
                                className="hover:bg-cyber-400/10 focus-cyber"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-destructive focus:text-destructive hover:bg-red-400/10 focus:bg-red-400/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <StudentForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        student={selectedStudent}
        initialName={searchTerm}
        onSuccess={() => {
          setIsFormOpen(false);
          // Refresh the students list
          if (user) {
            supabase
              .from('students')
              .select('*')
              .eq('tutor_id', user.id)
              .order('created_at', { ascending: false })
              .then(({ data, error }) => {
                if (!error && data) {
                  setStudents(data);
                }
              });
          }
        }}
      />
    </MainLayout>
  );
}