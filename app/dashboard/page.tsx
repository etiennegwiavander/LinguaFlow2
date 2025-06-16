"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/main-layout";
import LessonCard from "@/components/dashboard/LessonCard";
import StatsCard from "@/components/dashboard/StatsCard";
import { Clock, Calendar, Sparkles, Loader2, TrendingUp, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Lesson, Stat } from "@/types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface TutorProfile {
  name: string | null;
  email: string;
  avatar_url: string | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch tutor profile
        const { data: tutorData, error: tutorError } = await supabase
          .from('tutors')
          .select('name, email, avatar_url')
          .eq('id', user.id)
          .single();

        if (tutorError) {
          console.error('Error fetching tutor profile:', tutorError);
        } else {
          setTutorProfile(tutorData);
        }

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
            icon: 'BarChart3'
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDisplayName = () => {
    if (tutorProfile?.name) {
      return tutorProfile.name.split(' ')[0];
    }
    return tutorProfile?.email?.split('@')[0] || 'there';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyber-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8 animate-slide-up">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-cyber-400/20 to-neon-400/20 text-cyber-600 dark:text-cyber-400 border-cyber-400/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Dashboard
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {getGreeting()}, <span className="gradient-text">{getDisplayName()}</span>!
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Here's what's happening with your language teaching today
            </p>
          </div>
          <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-lg border border-cyber-400/20">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-cyber-400" />
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
        <section aria-labelledby="stats-heading" className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center" id="stats-heading">
              <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-cyber-400" />
              Quick Stats
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div key={stat.id} className="animate-scale-in" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                <StatsCard stat={stat} />
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming lessons section */}
        <section aria-labelledby="lessons-heading" className="pt-4 animate-scale-in" style={{ animationDelay: '0.5s' }}>
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center" id="lessons-heading">
              <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-neon-400" />
              Upcoming Lessons
            </h2>
          </div>
          {upcomingLessons.length === 0 ? (
            <div className="text-center py-12 floating-card glass-effect border-cyber-400/20 rounded-lg">
              <div className="w-16 h-16 bg-cyber-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-cyber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No upcoming lessons</h3>
              <p className="text-muted-foreground">Schedule some lessons to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {upcomingLessons.map((lesson, index) => (
                <div key={lesson.id} className="animate-scale-in" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                  <LessonCard lesson={lesson} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}