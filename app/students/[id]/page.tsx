"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Student } from "@/types";
import { languages } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import StudentProfileClient from "@/components/students/StudentProfileClient";

export default function StudentProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !params.id) return;

    const fetchStudent = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', params.id)
          .eq('tutor_id', user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Student not found');

        setStudent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [user, params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-lg text-muted-foreground">
          {error || 'Student not found'}
        </p>
      </div>
    );
  }

  return <StudentProfileClient student={student} />;
}