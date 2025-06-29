"use client";

import { createContext, useState, useCallback, ReactNode } from "react";

interface ProgressContextType {
  completedSubTopics: string[];
  markSubTopicComplete: (subTopicId: string) => void;
  isSubTopicCompleted: (subTopicId: string) => boolean;
  resetProgress: () => void;
}

export const ProgressContext = createContext<ProgressContextType>({
  completedSubTopics: [],
  markSubTopicComplete: () => {},
  isSubTopicCompleted: () => false,
  resetProgress: () => {},
});

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [completedSubTopics, setCompletedSubTopics] = useState<string[]>([]);

  const markSubTopicComplete = useCallback((subTopicId: string) => {
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

  const resetProgress = useCallback(() => {
    setCompletedSubTopics([]);
  }, []);

  return (
    <ProgressContext.Provider 
      value={{ 
        completedSubTopics, 
        markSubTopicComplete, 
        isSubTopicCompleted,
        resetProgress
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}