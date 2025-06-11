"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import LessonCard from "@/components/dashboard/LessonCard";
import StatsCard from "@/components/dashboard/StatsCard";
import { Clock, Calendar, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Lesson, Stat } from "@/types";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch upcoming lessons with student details
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select(`
            *,
            student:students(*)
          `)
          .eq('tutor_id', user.id)
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(6);

        if (lessonsError) throw lessonsError;

        // Fetch total students count
        const { count: studentsCount, error: studentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('tutor_id', user.id);

        if (studentsError) throw studentsError;

        // Fetch total lessons count
        const { count: lessonsCount, error: totalLessonsError } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('tutor_id', user.id);

        if (totalLessonsError) throw totalLessonsError;

        // Fetch completed lessons count for this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: monthlyLessonsCount, error: monthlyError } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('tutor_id', user.id)
          .eq('status', 'completed')
          .gte('date', startOfMonth.toISOString());

        if (monthlyError) throw monthlyError;

        setUpcomingLessons(lessonsData as Lesson[]);
        setStats([
          {
            id: '1',
            label: 'Total Students',
            value: studentsCount || 0,
            change: 5.4,
            icon: 'Users'
          },
          {
            id: '2',
            label: 'Total Lessons',
            value: lessonsCount || 0,
            change: 8.2,
            icon: 'BarChart'
          },
          {
            id: '3',
            label: 'Lessons This Month',
            value: monthlyLessonsCount || 0,
            change: 12.7,
            icon: 'Calendar'
          }
        ]);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
      <div className="space-y-6 sm:space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Stats section */}
        <section aria-labelledby="stats-heading">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center" id="stats-heading">
              <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Quick Stats
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <StatsCard key={stat.id} stat={stat} />
            ))}
          </div>
        </section>

        {/* Upcoming lessons section */}
        <section aria-labelledby="lessons-heading" className="pt-4">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center" id="lessons-heading">
              <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Upcoming Lessons
            </h2>
          </div>
          {upcomingLessons.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">No upcoming lessons scheduled</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {upcomingLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}