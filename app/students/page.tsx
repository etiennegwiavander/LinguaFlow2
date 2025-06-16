"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/main-layout";
import { Student } from "@/types";
import { languages } from "@/lib/sample-data";
import { Plus, Users, MoreVertical, Eye, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
              <Badge className="bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
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
            className="bg-gradient-to-r from-cyber-400 to-neon-400 hover:from-cyber-500 hover:to-neon-500 text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 group"
          >
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            Add New Student
          </Button>
        </div>

        <section aria-labelledby="students-heading" className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="mb-6 flex items-center">
            <h2 className="text-xl font-semibold flex items-center" id="students-heading">
              <Users className="mr-2 h-5 w-5 text-cyber-400" />
              Student List
              {students.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {students.length}
                </Badge>
              )}
            </h2>
          </div>
          
          <div className="floating-card glass-effect border-cyber-400/20 rounded-lg overflow-hidden">
            <Table>
              <TableCaption className="text-muted-foreground py-4">
                A list of all your language students and their learning progress.
              </TableCaption>
              <TableHeader>
                <TableRow className="border-cyber-400/20 hover:bg-cyber-400/5">
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Language</TableHead>
                  <TableHead className="font-semibold">Level</TableHead>
                  <TableHead className="w-[80px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-cyber-400/10 rounded-full flex items-center justify-center mx-auto">
                          <Users className="w-8 h-8 text-cyber-400" />
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-2">No students found</p>
                          <Button 
                            variant="outline" 
                            onClick={handleAddStudent}
                            className="border-cyber-400/30 hover:bg-cyber-400/10 hover:border-cyber-400 transition-all duration-300"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add your first student
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student, index) => {
                    const langInfo = getLanguageInfo(student.target_language);
                    return (
                      <TableRow 
                        key={student.id} 
                        className="hover:bg-cyber-400/5 transition-colors duration-300 border-cyber-400/10 group animate-scale-in"
                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3 ring-2 ring-cyber-400/20 group-hover:ring-cyber-400/50 transition-all duration-300">
                              <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
                              <AvatarFallback className="bg-gradient-to-br from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400">
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
                                className="h-8 w-8 hover:bg-cyber-400/10 hover:text-cyber-400 transition-all duration-300"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-effect border-cyber-400/30">
                              <DropdownMenuItem 
                                onClick={() => handleViewProfile(student.id)}
                                className="hover:bg-cyber-400/10"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEditStudent(student)}
                                className="hover:bg-cyber-400/10"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-destructive focus:text-destructive hover:bg-red-400/10"
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