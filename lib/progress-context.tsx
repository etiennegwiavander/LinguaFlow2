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
    if (lessonData?.interactive_lesson_content) {
      // If there's interactive content, we can assume at least one sub-topic was completed
      // This is a simple approach - you might want to store more detailed completion data
      const completedIds: string[] = [];
      
      // You can enhance this logic based on how you want to track completion
      // For now, we'll mark any sub-topic that has been used to create interactive material
      if (lessonData.interactive_lesson_content.selected_sub_topic?.id) {
        completedIds.push(lessonData.interactive_lesson_content.selected_sub_topic.id);
      }
      
      setCompletedSubTopics(prev => {
        const combined = [...prev, ...completedIds];
        return Array.from(new Set(combined)); // Remove duplicates
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
    const isCompleted = completedSubTopics.includes(subTopicId);
    console.log('🔍 Checking completion for sub-topic:', subTopicId, 'Result:', isCompleted, 'All completed:', completedSubTopics);
    return isCompleted;
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