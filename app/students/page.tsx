"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/main-layout";
import { Student } from "@/types";
import { languages } from "@/lib/sample-data";
import { Plus, Users, MoreVertical, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
          <Button onClick={handleAddStudent}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Student
          </Button>
        </div>

        <section aria-labelledby="students-heading">
          <div className="mb-6 flex items-center">
            <h2 className="text-xl font-semibold flex items-center" id="students-heading">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Student List
            </h2>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableCaption>A list of all your language students.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <p className="text-muted-foreground">No students found</p>
                      <Button 
                        variant="link" 
                        onClick={handleAddStudent}
                        className="mt-2"
                      >
                        Add your first student
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const langInfo = getLanguageInfo(student.target_language);
                    return (
                      <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src={student.avatar_url || undefined} alt={student.name} />
                              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                            </Avatar>
                            <Link 
                              href={`/students/${student.id}`}
                              className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium"
                            >
                              {student.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-2 text-lg">{langInfo.flag}</span>
                            {langInfo.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {student.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProfile(student.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-destructive focus:text-destructive"
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