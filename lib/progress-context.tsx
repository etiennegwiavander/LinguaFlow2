"use client";

import { createContext, useState, useCallback, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { lessonHistoryService } from "@/lib/lesson-history-service";

interface CompletedSubTopic {
  id: string;
  completedAt: string; // ISO timestamp
}

interface ProgressContextType {
  completedSubTopics: string[];
  completedSubTopicsWithTimestamps: CompletedSubTopic[];
  markSubTopicComplete: (subTopicId: string, subTopicData?: any, lessonSessionData?: any) => Promise<void>;
  isSubTopicCompleted: (subTopicId: string) => boolean;
  getSubTopicCompletionDate: (subTopicId: string) => string | null;
  resetProgress: () => void;
  initializeFromLessonData: (lessonData: any) => void;
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  setStudentContext: (studentId: string, tutorId: string) => void;
}

export const ProgressContext = createContext<ProgressContextType>({
  completedSubTopics: [],
  completedSubTopicsWithTimestamps: [],
  markSubTopicComplete: async () => {},
  isSubTopicCompleted: () => false,
  getSubTopicCompletionDate: () => null,
  resetProgress: () => {},
  initializeFromLessonData: () => {},
  isLoading: false,
  refreshProgress: async () => {},
  setStudentContext: () => {},
});

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  // State management
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [currentTutorId, setCurrentTutorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Store completed sub-topics with timestamps
  const [completedSubTopicsWithTimestamps, setCompletedSubTopicsWithTimestamps] = useState<CompletedSubTopic[]>([]);

  // Maintain backward compatibility - derive simple array from timestamped data
  const [completedSubTopics, setCompletedSubTopics] = useState<string[]>([]);

  // Helper function to get user-specific localStorage keys (for migration)
  const getUserSpecificKey = (baseKey: string) => {
    if (!currentUserId) return `${baseKey}_anonymous`;
    return `${baseKey}_${currentUserId}`;
  };

  // Load progress data from database when user changes
  useEffect(() => {
    const loadProgressData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;
        
        if (userId !== currentUserId) {
          setCurrentUserId(userId);
          setIsLoading(true);
          
          if (userId) {
            // Get current student and tutor context
            const { data: tutorData } = await supabase
              .from('tutors')
              .select('id')
              .eq('user_id', userId)
              .single();
            
            if (tutorData) {
              setCurrentTutorId(tutorData.id);
            }

            // Try to load from database first
            await refreshProgressFromDatabase();
            
            // Check for localStorage migration
            await migrateLocalStorageIfNeeded(userId);
          } else {
            // No user, clear data
            setCompletedSubTopicsWithTimestamps([]);
            setCompletedSubTopics([]);
            setCurrentStudentId(null);
            setCurrentTutorId(null);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Error in loadProgressData:', error);
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [currentUserId]);

  // Refresh progress from database
  const refreshProgressFromDatabase = async (studentId?: string) => {
    if (!currentUserId) return;
    
    try {
      const targetStudentId = studentId || currentStudentId;
      if (!targetStudentId) return;

      const progressData = await lessonHistoryService.getStudentProgress(targetStudentId);
      
      setCompletedSubTopicsWithTimestamps(progressData.completedSubTopicsWithTimestamps);
      setCompletedSubTopics(progressData.completedSubTopics);
      
      console.log('✅ Loaded progress from database:', progressData.completedSubTopics.length, 'completed sub-topics');
    } catch (error) {
      console.error('❌ Error loading progress from database:', error);
      // Fallback to localStorage if database fails
      await loadFromLocalStorageFallback();
    }
  };

  // Migrate localStorage data to database if needed
  const migrateLocalStorageIfNeeded = async (userId: string) => {
    if (!currentTutorId || !currentStudentId) return;
    
    try {
      const timestampedKey = `completedSubTopicsWithTimestamps_${userId}`;
      const stored = localStorage.getItem(timestampedKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('🔄 Migrating localStorage data to database...');
          
          await lessonHistoryService.migrateLocalStorageData(
            currentStudentId,
            currentTutorId,
            parsed
          );
          
          // Clean up localStorage after successful migration
          localStorage.removeItem(timestampedKey);
          localStorage.removeItem(`completedSubTopics_${userId}`);
          
          console.log('✅ Successfully migrated localStorage data to database');
        }
      }
    } catch (error) {
      console.error('❌ Error migrating localStorage data:', error);
    }
  };

  // Fallback to localStorage if database fails
  const loadFromLocalStorageFallback = async () => {
    if (!currentUserId || typeof window === 'undefined') return;
    
    try {
      const timestampedKey = `completedSubTopicsWithTimestamps_${currentUserId}`;
      const stored = localStorage.getItem(timestampedKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCompletedSubTopicsWithTimestamps(parsed);
          setCompletedSubTopics(parsed.map((item: CompletedSubTopic) => item.id));
          console.log('⚠️ Loaded from localStorage fallback');
        }
      }
    } catch (error) {
      console.error('❌ Error loading localStorage fallback:', error);
    }
  };

  // Function to initialize completed sub-topics from lesson data
  const initializeFromLessonData = useCallback((lessonData: any) => {
    // Set student context if available
    if (lessonData?.student_id && lessonData.student_id !== currentStudentId) {
      setCurrentStudentId(lessonData.student_id);
      // Refresh progress for this student
      refreshProgressFromDatabase(lessonData.student_id);
    }
    
    // Legacy support - prevent infinite loops by checking if we already have this data
    if (!lessonData?.interactive_lesson_content) {
      return;
    }
    
    const completedIds: string[] = [];
    
    // Method 1: Check for selected_sub_topic in interactive content
    if (lessonData.interactive_lesson_content.selected_sub_topic?.id) {
      completedIds.push(lessonData.interactive_lesson_content.selected_sub_topic.id);
    }
    
    // Method 2: Check for sub_topic_id field (alternative storage method)
    if (lessonData.interactive_lesson_content.sub_topic_id) {
      completedIds.push(lessonData.interactive_lesson_content.sub_topic_id);
    }
    
    if (completedIds.length > 0) {
      setCompletedSubTopics(prev => {
        // Only update if the new IDs are not already in the array
        const newIds = completedIds.filter(id => !prev.includes(id));
        if (newIds.length === 0) {
          return prev; // No new IDs, don't update state
        }
        return Array.from(new Set([...prev, ...newIds]));
      });
    }
  }, [currentStudentId]);

  const markSubTopicComplete = useCallback(async (
    subTopicId: string, 
    subTopicData?: any, 
    lessonSessionData?: any
  ) => {
    const completionTimestamp = new Date().toISOString();
    console.log('🎯 Marking sub-topic as complete:', subTopicId, 'at', completionTimestamp);
    
    // Update local state immediately for responsive UI
    setCompletedSubTopicsWithTimestamps(prev => {
      if (prev.some(item => item.id === subTopicId)) {
        console.log('⚠️ Sub-topic already marked as complete:', subTopicId);
        return prev;
      }
      const newCompleted = [...prev, { id: subTopicId, completedAt: completionTimestamp }];
      return newCompleted;
    });
    
    setCompletedSubTopics(prev => {
      if (prev.includes(subTopicId)) {
        return prev;
      }
      return [...prev, subTopicId];
    });

    // Save to database
    try {
      if (currentStudentId && currentTutorId) {
        // Create lesson session if we have full data
        if (lessonSessionData && subTopicData) {
          await lessonHistoryService.createLessonSession({
            student_id: currentStudentId,
            tutor_id: currentTutorId,
            sub_topic_id: subTopicId,
            sub_topic_data: subTopicData,
            ...lessonSessionData
          });
        } else {
          // Just mark progress
          await lessonHistoryService.markSubTopicComplete({
            student_id: currentStudentId,
            tutor_id: currentTutorId,
            sub_topic_id: subTopicId,
            sub_topic_title: subTopicData?.title,
            sub_topic_category: subTopicData?.category,
            sub_topic_level: subTopicData?.level
          });
        }
        
        console.log('✅ Successfully saved progress to database');
      } else {
        console.warn('⚠️ Missing student or tutor context, saving to localStorage fallback');
        // Fallback to localStorage
        if (typeof window !== 'undefined' && currentUserId) {
          const timestampedKey = `completedSubTopicsWithTimestamps_${currentUserId}`;
          const currentData = completedSubTopicsWithTimestamps;
          const newData = [...currentData, { id: subTopicId, completedAt: completionTimestamp }];
          localStorage.setItem(timestampedKey, JSON.stringify(newData));
        }
      }
    } catch (error) {
      console.error('❌ Error saving progress to database, using localStorage fallback:', error);
      
      // Fallback to localStorage
      if (typeof window !== 'undefined' && currentUserId) {
        const timestampedKey = `completedSubTopicsWithTimestamps_${currentUserId}`;
        const currentData = completedSubTopicsWithTimestamps;
        const newData = [...currentData, { id: subTopicId, completedAt: completionTimestamp }];
        localStorage.setItem(timestampedKey, JSON.stringify(newData));
      }
    }
  }, [currentStudentId, currentTutorId, currentUserId, completedSubTopicsWithTimestamps]);

  const isSubTopicCompleted = useCallback((subTopicId: string) => {
    return completedSubTopics.includes(subTopicId);
  }, [completedSubTopics]);

  const getSubTopicCompletionDate = useCallback((subTopicId: string): string | null => {
    const completedItem = completedSubTopicsWithTimestamps.find(item => item.id === subTopicId);
    return completedItem ? completedItem.completedAt : null;
  }, [completedSubTopicsWithTimestamps]);

  const resetProgress = useCallback(() => {
    setCompletedSubTopics([]);
    setCompletedSubTopicsWithTimestamps([]);
    
    // Clear from localStorage (fallback)
    if (typeof window !== 'undefined' && currentUserId) {
      const timestampedKey = `completedSubTopicsWithTimestamps_${currentUserId}`;
      const simpleKey = `completedSubTopics_${currentUserId}`;
      localStorage.removeItem(simpleKey);
      localStorage.removeItem(timestampedKey);
    }
    
    console.log('🗑️ Cleared progress data');
  }, [currentUserId]);

  // Refresh progress function
  const refreshProgress = useCallback(async () => {
    if (currentStudentId) {
      await refreshProgressFromDatabase(currentStudentId);
    }
  }, [currentStudentId, refreshProgressFromDatabase]);

  // Set student context when it changes
  const setStudentContext = useCallback((studentId: string, tutorId?: string) => {
    let contextChanged = false;
    
    if (studentId !== currentStudentId) {
      setCurrentStudentId(studentId);
      contextChanged = true;
    }
    
    if (tutorId && tutorId !== currentTutorId) {
      setCurrentTutorId(tutorId);
      contextChanged = true;
    }
    
    if (contextChanged) {
      console.log('🎯 Setting student context:', { studentId: studentId.substring(0, 8), tutorId: tutorId?.substring(0, 8) });
      // Refresh progress for this student
      refreshProgressFromDatabase(studentId);
    }
  }, [currentStudentId, currentTutorId, refreshProgressFromDatabase]);

  return (
    <ProgressContext.Provider 
      value={{ 
        completedSubTopics,
        completedSubTopicsWithTimestamps,
        markSubTopicComplete, 
        isSubTopicCompleted,
        getSubTopicCompletionDate,
        resetProgress,
        initializeFromLessonData,
        isLoading,
        refreshProgress,
        setStudentContext
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}