import { supabase } from '@/lib/supabase';

export interface LessonSession {
  id: string;
  student_id: string;
  tutor_id: string;
  lesson_id?: string;
  lesson_template_id?: string;
  sub_topic_id: string;
  sub_topic_data: any;
  interactive_content?: any;
  lesson_materials?: any;
  status: 'completed' | 'in_progress' | 'cancelled';
  duration_minutes?: number;
  started_at: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  tutor_id: string;
  sub_topic_id: string;
  sub_topic_title?: string;
  sub_topic_category?: string;
  sub_topic_level?: string;
  completion_date: string;
  lesson_session_id?: string;
  score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonHistoryEntry {
  id: string;
  completedAt: string;
  completedSubTopic: any;
  interactive_lesson_content?: any;
  lesson_template_id?: string;
  student?: any;
  tutor?: any;
  lesson?: any;
  duration_minutes?: number;
  status: string;
}

class LessonHistoryService {
  private supabaseClient = supabase;

  /**
   * Get lesson history for a student
   */
  async getLessonHistory(
    studentId: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ sessions: LessonHistoryEntry[]; total: number; hasMore: boolean }> {
    const { limit = 50, offset = 0 } = options;

    try {
      const { data: sessions, error } = await this.supabaseClient
        .from('lesson_sessions')
        .select(`
          *,
          students!inner(id, name, level),
          tutors!inner(id, name),
          lessons(id, date, status)
        `)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching lesson history:', error);
        throw new Error('Failed to fetch lesson history');
      }

      // Transform data to match existing format
      const transformedSessions: LessonHistoryEntry[] = sessions?.map(session => ({
        id: session.id,
        completedAt: session.completed_at,
        completedSubTopic: session.sub_topic_data,
        interactive_lesson_content: session.interactive_content,
        lesson_template_id: session.lesson_template_id,
        student: session.students,
        tutor: session.tutors,
        lesson: session.lessons,
        duration_minutes: session.duration_minutes,
        status: session.status
      })) || [];

      return {
        sessions: transformedSessions,
        total: sessions?.length || 0,
        hasMore: sessions?.length === limit
      };
    } catch (error) {
      console.error('Error in getLessonHistory:', error);
      throw error;
    }
  }

  /**
   * Create a new lesson session
   */
  async createLessonSession(sessionData: {
    student_id: string;
    tutor_id: string;
    lesson_id?: string;
    lesson_template_id?: string;
    sub_topic_id: string;
    sub_topic_data: any;
    interactive_content?: any;
    lesson_materials?: any;
    duration_minutes?: number;
  }): Promise<string> {
    try {
      const { data: session, error } = await this.supabaseClient
        .from('lesson_sessions')
        .insert({
          ...sessionData,
          interactive_content: sessionData.interactive_content || {},
          lesson_materials: sessionData.lesson_materials || {},
          status: 'completed'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lesson session:', error);
        throw new Error('Failed to create lesson session');
      }

      // Also create progress entry
      await this.markSubTopicComplete({
        student_id: sessionData.student_id,
        tutor_id: sessionData.tutor_id,
        sub_topic_id: sessionData.sub_topic_id,
        sub_topic_title: sessionData.sub_topic_data.title,
        sub_topic_category: sessionData.sub_topic_data.category,
        sub_topic_level: sessionData.sub_topic_data.level,
        lesson_session_id: session.id
      });

      return session.id;
    } catch (error) {
      console.error('Error in createLessonSession:', error);
      throw error;
    }
  }

  /**
   * Get student progress
   */
  async getStudentProgress(studentId: string): Promise<{
    completedSubTopics: string[];
    completedSubTopicsWithTimestamps: { id: string; completedAt: string }[];
    progress: StudentProgress[];
  }> {
    try {
      const { data: progress, error } = await this.supabaseClient
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('completion_date', { ascending: false });

      if (error) {
        console.error('Error fetching student progress:', error);
        throw new Error('Failed to fetch student progress');
      }

      const completedSubTopics = progress?.map(p => p.sub_topic_id) || [];
      const completedSubTopicsWithTimestamps = progress?.map(p => ({
        id: p.sub_topic_id,
        completedAt: p.completion_date
      })) || [];

      return {
        completedSubTopics,
        completedSubTopicsWithTimestamps,
        progress: progress || []
      };
    } catch (error) {
      console.error('Error in getStudentProgress:', error);
      throw error;
    }
  }

  /**
   * Mark a sub-topic as complete
   */
  async markSubTopicComplete(progressData: {
    student_id: string;
    tutor_id: string;
    sub_topic_id: string;
    sub_topic_title?: string;
    sub_topic_category?: string;
    sub_topic_level?: string;
    lesson_session_id?: string;
    score?: number;
    notes?: string;
  }): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('student_progress')
        .upsert({
          ...progressData,
          completion_date: new Date().toISOString()
        }, {
          onConflict: 'student_id,sub_topic_id'
        });

      if (error) {
        console.error('Error marking sub-topic complete:', error);
        throw new Error('Failed to mark sub-topic complete');
      }
    } catch (error) {
      console.error('Error in markSubTopicComplete:', error);
      throw error;
    }
  }

  /**
   * Check if a sub-topic is completed
   */
  async isSubTopicCompleted(studentId: string, subTopicId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from('student_progress')
        .select('id')
        .eq('student_id', studentId)
        .eq('sub_topic_id', subTopicId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking sub-topic completion:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isSubTopicCompleted:', error);
      return false;
    }
  }

  /**
   * Get completion date for a sub-topic
   */
  async getSubTopicCompletionDate(studentId: string, subTopicId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('student_progress')
        .select('completion_date')
        .eq('student_id', studentId)
        .eq('sub_topic_id', subTopicId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting completion date:', error);
        return null;
      }

      return data?.completion_date || null;
    } catch (error) {
      console.error('Error in getSubTopicCompletionDate:', error);
      return null;
    }
  }

  /**
   * Migrate localStorage data to database
   */
  async migrateLocalStorageData(
    studentId: string,
    tutorId: string,
    localStorageData: { id: string; completedAt: string }[]
  ): Promise<void> {
    try {
      console.log('🔄 Migrating localStorage data to database for student:', studentId);
      
      const progressEntries = localStorageData.map(item => ({
        student_id: studentId,
        tutor_id: tutorId,
        sub_topic_id: item.id,
        completion_date: item.completedAt
      }));

      if (progressEntries.length > 0) {
        const { error } = await this.supabaseClient
          .from('student_progress')
          .upsert(progressEntries, {
            onConflict: 'student_id,sub_topic_id'
          });

        if (error) {
          console.error('Error migrating localStorage data:', error);
          throw new Error('Failed to migrate localStorage data');
        }

        console.log('✅ Successfully migrated', progressEntries.length, 'progress entries');
      }
    } catch (error) {
      console.error('Error in migrateLocalStorageData:', error);
      throw error;
    }
  }
}

export const lessonHistoryService = new LessonHistoryService();