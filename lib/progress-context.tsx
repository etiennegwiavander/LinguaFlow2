"use client";

import { createContext, useState, useCallback, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface CompletedSubTopic {
  id: string;
  completedAt: string; // ISO timestamp
}

interface ProgressContextType {
  completedSubTopics: string[];
  completedSubTopicsWithTimestamps: CompletedSubTopic[];
  markSubTopicComplete: (subTopicId: string) => void;
  isSubTopicCompleted: (subTopicId: string) => boolean;
  getSubTopicCompletionDate: (subTopicId: string) => string | null;
  resetProgress: () => void;
  initializeFromLessonData: (lessonData: any) => void;
}

export const ProgressContext = createContext<ProgressContextType>({
  completedSubTopics: [],
  completedSubTopicsWithTimestamps: [],
  markSubTopicComplete: () => {},
  isSubTopicCompleted: () => false,
  getSubTopicCompletionDate: () => null,
  resetProgress: () => {},
  initializeFromLessonData: () => {},
});

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  // FIXED: User-specific localStorage to prevent data leakage
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Helper function to get user-specific localStorage keys
  const getUserSpecificKey = (baseKey: string) => {
    if (!currentUserId) return `${baseKey}_anonymous`;
    return `${baseKey}_${currentUserId}`;
  };

  // Store completed sub-topics with timestamps (user-specific)
  const [completedSubTopicsWithTimestamps, setCompletedSubTopicsWithTimestamps] = useState<CompletedSubTopic[]>([]);

  // Maintain backward compatibility - derive simple array from timestamped data
  const [completedSubTopics, setCompletedSubTopics] = useState<string[]>([]);

  // Load user-specific data when user changes
  useEffect(() => {
    const loadUserSpecificData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;
        
        if (userId !== currentUserId) {
          setCurrentUserId(userId);
          
          // Clean up old global localStorage data (data leakage fix)
          if (typeof window !== 'undefined') {
            try {
              const oldGlobalData = localStorage.getItem('completedSubTopicsWithTimestamps');
              const oldGlobalSimple = localStorage.getItem('completedSubTopics');
              
              if (oldGlobalData || oldGlobalSimple) {
                console.log('🧹 Cleaning up old global localStorage data to prevent data leakage');
                localStorage.removeItem('completedSubTopicsWithTimestamps');
                localStorage.removeItem('completedSubTopics');
              }
            } catch (error) {
              console.error('❌ Error cleaning up old localStorage data:', error);
            }
          }
          
          // Load user-specific data from localStorage
          if (typeof window !== 'undefined' && userId) {
            try {
              const timestampedKey = `completedSubTopicsWithTimestamps_${userId}`;
              const stored = localStorage.getItem(timestampedKey);
              
              if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                  setCompletedSubTopicsWithTimestamps(parsed);
                  setCompletedSubTopics(parsed.map((item: CompletedSubTopic) => item.id));
                  console.log('✅ Loaded user-specific progress data for user:', userId);
                  return;
                }
              }
              
              // If no user-specific data, start fresh
              setCompletedSubTopicsWithTimestamps([]);
              setCompletedSubTopics([]);
              console.log('🆕 Starting fresh progress for user:', userId);
            } catch (error) {
              console.error('❌ Error loading user-specific progress:', error);
              setCompletedSubTopicsWithTimestamps([]);
              setCompletedSubTopics([]);
            }
          } else {
            // No user, clear data
            setCompletedSubTopicsWithTimestamps([]);
            setCompletedSubTopics([]);
          }
        }
      } catch (error) {
        console.error('❌ Error in loadUserSpecificData:', error);
      }
    };

    loadUserSpecificData();
  }, [currentUserId]);

  // Function to initialize completed sub-topics from lesson data
  const initializeFromLessonData = useCallback((lessonData: any) => {
    // Prevent infinite loops by checking if we already have this data
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
  }, []);

  const markSubTopicComplete = useCallback((subTopicId: string) => {
    const completionTimestamp = new Date().toISOString();
    console.log('🎯 Marking sub-topic as complete:', subTopicId, 'at', completionTimestamp);
    
    // Update timestamped data
    setCompletedSubTopicsWithTimestamps(prev => {
      if (prev.some(item => item.id === subTopicId)) {
        console.log('⚠️ Sub-topic already marked as complete:', subTopicId);
        return prev;
      }
      const newCompleted = [...prev, { id: subTopicId, completedAt: completionTimestamp }];
      console.log('✅ Updated completed sub-topics with timestamps:', newCompleted);
      return newCompleted;
    });
    
    // Update simple array for backward compatibility
    setCompletedSubTopics(prev => {
      if (prev.includes(subTopicId)) {
        return prev;
      }
      return [...prev, subTopicId];
    });
  }, []);

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
    // Also clear from user-specific localStorage
    if (typeof window !== 'undefined' && currentUserId) {
      const timestampedKey = `completedSubTopicsWithTimestamps_${currentUserId}`;
      const simpleKey = `completedSubTopics_${currentUserId}`;
      localStorage.removeItem(simpleKey);
      localStorage.removeItem(timestampedKey);
      console.log('🗑️ Cleared user-specific completed sub-topics from localStorage for user:', currentUserId);
    }
  }, [currentUserId]);

  // Save to user-specific localStorage whenever completedSubTopics changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUserId && completedSubTopics.length > 0) {
      try {
        const userKey = `completedSubTopics_${currentUserId}`;
        localStorage.setItem(userKey, JSON.stringify(completedSubTopics));
        console.log('💾 Saved user-specific progress for user:', currentUserId);
      } catch (error) {
        console.error('❌ Error saving user-specific completed sub-topics to localStorage:', error);
      }
    }
  }, [completedSubTopics, currentUserId]);

  // Save timestamped data to user-specific localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUserId && completedSubTopicsWithTimestamps.length > 0) {
      try {
        const userKey = `completedSubTopicsWithTimestamps_${currentUserId}`;
        localStorage.setItem(userKey, JSON.stringify(completedSubTopicsWithTimestamps));
        console.log('💾 Saved user-specific timestamped progress for user:', currentUserId);
      } catch (error) {
        console.error('❌ Error saving user-specific completed sub-topics with timestamps to localStorage:', error);
      }
    }
  }, [completedSubTopicsWithTimestamps, currentUserId]);

  return (
    <ProgressContext.Provider 
      value={{ 
        completedSubTopics,
        completedSubTopicsWithTimestamps,
        markSubTopicComplete, 
        isSubTopicCompleted,
        getSubTopicCompletionDate,
        resetProgress,
        initializeFromLessonData
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}