"use client";

import { createContext, useState, useCallback, ReactNode } from "react";

interface ProgressContextType {
  completedSubTopics: string[];
  markSubTopicComplete: (subTopicId: string) => void;
  isSubTopicCompleted: (subTopicId: string) => boolean;
  resetProgress: () => void;
  initializeFromLessonData: (lessonData: any) => void;
}

export const ProgressContext = createContext<ProgressContextType>({
  completedSubTopics: [],
  markSubTopicComplete: () => {},
  isSubTopicCompleted: () => false,
  resetProgress: () => {},
  initializeFromLessonData: () => {},
});

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [completedSubTopics, setCompletedSubTopics] = useState<string[]>([]);

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
    console.log('🎯 Marking sub-topic as complete:', subTopicId);
    setCompletedSubTopics(prev => {
      if (prev.includes(subTopicId)) {
        console.log('⚠️ Sub-topic already marked as complete:', subTopicId);
        return prev;
      }
      const newCompleted = [...prev, subTopicId];
      console.log('✅ Updated completed sub-topics:', newCompleted);
      return newCompleted;
    });
  }, []);

  const isSubTopicCompleted = useCallback((subTopicId: string) => {
    return completedSubTopics.includes(subTopicId);
  }, [completedSubTopics]);

  const resetProgress = useCallback(() => {
    setCompletedSubTopics([]);
  }, []);

  return (
    <ProgressContext.Provider 
      value={{ 
        completedSubTopics, 
        markSubTopicComplete, 
        isSubTopicCompleted,
        resetProgress,
        initializeFromLessonData
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}