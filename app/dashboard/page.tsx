"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/main-layout";
import LessonCard from "@/components/dashboard/LessonCard";
import StatsCard from "@/components/dashboard/StatsCard";
// import CalendarStatusCard from "@/components/dashboard/CalendarStatusCard";
import { Clock, Calendar, Sparkles, Loader2, TrendingUp, Users, BarChart3, ExternalLink, RefreshCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Lesson, Stat } from "@/types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, addHours, parseISO } from "date-fns";

interface TutorProfile {
  name: string | null;
  email: string;
  avatar_url: string | null;
}

interface CalendarEvent {
  id: string;
  tutor_id: string;
  google_event_id: string;
  summary: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: any[];
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;

    fetchDashboardData();

    // Set up automatic refresh every 30 minutes
    const refreshInterval = setInterval(() => {
      if (isCalendarConnected) {
        handleRefreshCalendar();
      } else {
        fetchDashboardData();
      }
      setLastRefreshTime(new Date());
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [user, isCalendarConnected]);

  const fetchDashboardData = async () => {
    // Add null check for user at the beginning of the function
    if (!user) return;

    try {
      setLoading(true);
      // Fetch tutor profile
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('name, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (tutorError) {
        // Error handling without console.error
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

      // Check if calendar is connected
      const { data: googleTokens, error: tokensError } = await supabase
        .from('google_tokens')
        .select('id')
        .eq('tutor_id', user.id)
        .maybeSingle();

      if (!tokensError && googleTokens) {
        setIsCalendarConnected(true);
        await fetchCalendarEvents();
      }

      // Fetch total students count
      const { count: studentsCount, error: studentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', user.id);

      if (studentsError) throw studentsError;

      // Fetch total lessons count (only lessons with interactive materials created)
      const { count: lessonsCount, error: totalLessonsError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', user.id)
        .not('interactive_lesson_content', 'is', null);

      if (totalLessonsError) throw totalLessonsError;

      // Calculate date ranges for current and previous month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Fetch lessons count for this month (only lessons with interactive materials)
      const { count: monthlyLessonsCount, error: monthlyError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', user.id)
        .gte('date', startOfMonth.toISOString())
        .not('interactive_lesson_content', 'is', null);

      if (monthlyError) throw monthlyError;

      // Fetch lessons count for last month (for comparison)
      const { count: lastMonthLessonsCount, error: lastMonthError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', user.id)
        .gte('date', startOfLastMonth.toISOString())
        .lte('date', endOfLastMonth.toISOString())
        .not('interactive_lesson_content', 'is', null);

      if (lastMonthError) throw lastMonthError;

      // Calculate historical data for students (compare with last month)
      const { count: lastMonthStudentsCount, error: lastMonthStudentsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', user.id)
        .lte('created_at', endOfLastMonth.toISOString());

      if (lastMonthStudentsError) throw lastMonthStudentsError;

      // Calculate historical data for total lessons (compare with last month)
      const { count: lastMonthTotalLessonsCount, error: lastMonthTotalError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', user.id)
        .lte('created_at', endOfLastMonth.toISOString())
        .not('interactive_lesson_content', 'is', null);

      if (lastMonthTotalError) throw lastMonthTotalError;

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const studentsChange = calculateChange(studentsCount || 0, lastMonthStudentsCount || 0);
      const totalLessonsChange = calculateChange(lessonsCount || 0, lastMonthTotalLessonsCount || 0);
      const monthlyLessonsChange = calculateChange(monthlyLessonsCount || 0, lastMonthLessonsCount || 0);

      setUpcomingLessons(lessonsData as Lesson[]);
      setStats([
        {
          id: '1',
          label: 'Total Students',
          value: studentsCount || 0,
          change: Math.round(studentsChange * 100) / 100, // Round to 2 decimal places
          icon: 'Users',
          clickable: true,
          onClick: () => router.push('/students')
        },
        {
          id: '2',
          label: 'Total Lessons',
          value: lessonsCount || 0,
          change: Math.round(totalLessonsChange * 100) / 100,
          icon: 'BarChart3'
        },
        {
          id: '3',
          label: 'Lessons This Month',
          value: monthlyLessonsCount || 0,
          change: Math.round(monthlyLessonsChange * 100) / 100,
          icon: 'Calendar'
        }
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    // Add null check for user at the beginning of the function
    if (!user) return;

    try {
      // Fetch calendar events for the next 48 hours
      const now = new Date();
      const fortyEightHoursFromNow = addHours(now, 48);

      const { data: calendarData, error: calendarError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('tutor_id', user.id)
        .gte('start_time', now.toISOString())
        .lte('start_time', fortyEightHoursFromNow.toISOString())
        .order('start_time', { ascending: true });

      if (calendarError) {
        // Error handling without console.error
      } else {
        setCalendarEvents(calendarData || []);
      }
    } catch (error: any) {
      // Error handling without console.error
    }
  };

  const handleRefreshCalendar = async () => {
    if (!user || !isCalendarConnected) return;

    try {
      setIsSyncingCalendar(true);

      // Import the googleCalendarService
      const { googleCalendarService } = await import('@/lib/google-calendar');

      // Sync calendar
      const result = await googleCalendarService.syncCalendar();

      // Fetch updated calendar events
      await fetchCalendarEvents();

      // Refresh dashboard data to update stats
      await fetchDashboardData();

      toast.success(`Calendar refreshed: ${result.events_count} events synced`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh calendar');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

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

  const formatCalendarEventTime = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    const now = new Date();

    const isToday = format(start, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    const isTomorrow = format(start, 'yyyy-MM-dd') === format(addHours(now, 24), 'yyyy-MM-dd');

    let dateLabel = '';
    if (isToday) {
      dateLabel = 'Today';
    } else if (isTomorrow) {
      dateLabel = 'Tomorrow';
    } else {
      dateLabel = format(start, 'EEE, MMM d');
    }

    return {
      dateLabel,
      timeRange: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
      isToday,
      isTomorrow
    };
  };

  const extractStudentNameFromEventSummary = (eventSummary: string): string => {
    // Split by " - " and take the first part as the student name
    // This handles cases like "Julia - preply lesson" -> "Julia"
    const parts = eventSummary.split(' - ');
    return parts[0].trim();
  };

  const handleCalendarEventClick = (eventSummary: string) => {
    // Extract just the student name from the event summary
    const studentName = extractStudentNameFromEventSummary(eventSummary);

    // Navigate to students page with the extracted student name as search parameter
    const searchParams = new URLSearchParams();
    searchParams.set('searchName', studentName);
    router.push(`/students?${searchParams.toString()}`);
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
              <Badge className="badge-cyber">
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
          <div className="section-header">
            <h2 className="section-title" id="stats-heading">
              <TrendingUp className="section-icon" />
              Quick Stats
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={stat.id} className="animate-scale-in" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                <StatsCard stat={stat} />
              </div>
            ))}
            {/* <div className="animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <CalendarStatusCard />
            </div> */}
          </div>
        </section>

        {/* Upcoming lessons section */}
        <section aria-labelledby="lessons-heading" className="pt-4 animate-scale-in" style={{ animationDelay: '0.5s' }}>
          <div className="section-header">
            <h2 className="section-title" id="lessons-heading">
              <Calendar className="section-icon text-neon-400" />
              Upcoming Lessons
            </h2>
          </div>

          {/* Calendar Events from Next 48 Hours */}
          {calendarEvents.length > 0 && (
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-medium text-muted-foreground">
                  Next 48 Hours - Calendar Events ({calendarEvents.length})
                </h3>
                {isCalendarConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshCalendar}
                    disabled={isSyncingCalendar}
                    className="text-xs border-cyber-400/30 hover:bg-cyber-400/10 hover:border-cyber-400 transition-all hover:dark:text-cyber-50 hover:text-cyan-950 duration-300 btn-ghost-cyber"
                  >
                    <RefreshCcw className={`h-3 w-3 mr-1.5 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
                    {isSyncingCalendar ? 'Refreshing...' : 'Refresh Calendar'}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {calendarEvents.map((event, index) => {
                  const timeInfo = formatCalendarEventTime(event.start_time, event.end_time);

                  return (
                    <div
                      key={event.id}
                      className={`cyber-card p-4 rounded-lg cursor-pointer hover-lift ${timeInfo.isToday ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' :
                        timeInfo.isTomorrow ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' : ''
                        }`}
                      style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                      onClick={() => handleCalendarEventClick(event.summary)}
                      title="Click to find or create student"
                    >
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/5 to-neon-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-sm group-hover:text-cyber-400 transition-colors duration-300 truncate">
                                {event.summary}
                              </h4>
                              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-cyber-400 transition-colors duration-300 opacity-0 group-hover:opacity-100" />
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          {(timeInfo.isToday || timeInfo.isTomorrow) && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ml-2 ${timeInfo.isToday ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                }`}
                            >
                              {timeInfo.dateLabel}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-2 text-cyber-400" />
                            <span>{timeInfo.dateLabel}</span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-2 text-neon-400" />
                            <span>{timeInfo.timeRange}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <div className="h-3 w-3 mr-2 flex items-center justify-center">
                                <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
                              </div>
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Click hint */}
                        <div className="mt-3 pt-2 border-t border-muted/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-xs text-cyber-400 font-medium">
                            Click to find or create student
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Lessons */}
          {upcomingLessons.length === 0 && calendarEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar className="w-8 h-8 text-cyber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No upcoming lessons</h3>
              <p className="text-muted-foreground mb-4">Schedule some lessons or sync your calendar to see them here</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {isCalendarConnected ? (
                  <Button
                    variant="outline"
                    onClick={handleRefreshCalendar}
                    disabled={isSyncingCalendar}
                    className="btn-ghost-cyber"
                  >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
                    {isSyncingCalendar ? 'Refreshing Calendar...' : 'Refresh Calendar'}
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-xs border-cyber-400/30">
                    Connect Google Calendar for automatic lesson detection
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <>
              {upcomingLessons.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-medium text-muted-foreground">
                      Scheduled Lessons ({upcomingLessons.length})
                    </h3>
                    <Badge variant="outline" className="text-xs border-cyber-400/30">
                      From Lesson Plans
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {upcomingLessons.map((lesson, index) => (
                      <div key={lesson.id} className="animate-scale-in" style={{ animationDelay: `${0.8 + index * 0.1}s` }}>
                        <LessonCard lesson={lesson} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </MainLayout>
  );
}