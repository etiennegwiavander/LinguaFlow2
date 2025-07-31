"use client";

import { createContext, useState, useCallback, ReactNode, useEffect } from "react";

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
  // Store completed sub-topics with timestamps
  const [completedSubTopicsWithTimestamps, setCompletedSubTopicsWithTimestamps] = useState<CompletedSubTopic[]>(() => {
    // Initialize from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('completedSubTopicsWithTimestamps');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Debug logging removed to prevent infinite loop
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.error('❌ Error loading completed sub-topics with timestamps from localStorage:', error);
      }
    }
    return [];
  });

  // Maintain backward compatibility - derive simple array from timestamped data
  const [completedSubTopics, setCompletedSubTopics] = useState<string[]>(() => {
    // Initialize from localStorage on mount (backward compatibility)
    if (typeof window !== 'undefined') {
      try {
        const storedWithTimestamps = localStorage.getItem('completedSubTopicsWithTimestamps');
        if (storedWithTimestamps) {
          const parsed = JSON.parse(storedWithTimestamps);
          return Array.isArray(parsed) ? parsed.map((item: CompletedSubTopic) => item.id) : [];
        }
        
        // Fallback to old format
        const stored = localStorage.getItem('completedSubTopics');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Debug logging removed to prevent infinite loop
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.error('❌ Error loading completed sub-topics from localStorage:', error);
      }
    }
    return [];
  });

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
    // Also clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('completedSubTopics');
      localStorage.removeItem('completedSubTopicsWithTimestamps');
      console.log('🗑️ Cleared completed sub-topics from localStorage');
    }
  }, []);

  // Save to localStorage whenever completedSubTopics changes
  useEffect(() => {
    if (typeof window !== 'undefined' && completedSubTopics.length > 0) {
      try {
        localStorage.setItem('completedSubTopics', JSON.stringify(completedSubTopics));
        // Debug logging removed to prevent infinite loop
      } catch (error) {
        console.error('❌ Error saving completed sub-topics to localStorage:', error);
      }
    }
  }, [completedSubTopics]);

  // Save timestamped data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && completedSubTopicsWithTimestamps.length > 0) {
      try {
        localStorage.setItem('completedSubTopicsWithTimestamps', JSON.stringify(completedSubTopicsWithTimestamps));
        // Debug logging removed to prevent infinite loop
      } catch (error) {
        console.error('❌ Error saving completed sub-topics with timestamps to localStorage:', error);
      }
    }
  }, [completedSubTopicsWithTimestamps]);

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