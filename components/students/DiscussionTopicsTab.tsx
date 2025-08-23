"use client";

import React, { useState, useEffect } from "react";
import { Student, DiscussionTopic, Question } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import TopicsList from "./TopicsList";
import { FlashcardInterface } from "./FlashcardInterface";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ErrorBoundary } from "./ErrorBoundary";
import { 
  AIGenerationErrorFallback, 
  NetworkErrorFallback, 
  GenericErrorFallback 
} from "./ErrorFallbacks";
import { 
  DiscussionTopicsTabSkeleton, 
  QuestionGenerationSkeleton, 
  ProgressBar 
} from "./SkeletonLoaders";
import { AIGenerationLoading } from "./LoadingStates";

import { 
  getQuestionsByTopicId, 
  checkQuestionsExistWithCount,
  getQuestionsWithMetadata,
  storeAIGeneratedQuestions 
} from "@/lib/discussion-questions-db";
import {
  getQuestionsCache,
  setQuestionsCache,
  shouldRefreshQuestions,
  updateTopicMetadata,
  clearExpiredEntries
} from "@/lib/discussion-cache";
import { 
  startTimer, 
  endTimer, 
  trackComponentRender, 
  usePerformanceTracking 
} from "@/lib/performance-monitor";
import { useSidebar } from "@/lib/sidebar-context";

interface DiscussionTopicsTabProps {
  student: Student;
}

interface DiscussionTopicsState {
  topics: DiscussionTopic[];
  selectedTopic: DiscussionTopic | null;
  questions: Question[];
  isLoadingTopics: boolean;
  isGeneratingQuestions: boolean;
  generationProgress: string;
  generationProgressPercent: number;
  customTopicInput: string;
  error: string | null;
  errorType: 'network' | 'ai-generation' | 'validation' | 'generic' | null;
  isFlashcardOpen: boolean;
  tutorId: string | null;
  retryCount: number;
}

const DiscussionTopicsTab = React.memo(function DiscussionTopicsTab({ student }: DiscussionTopicsTabProps) {
  // Performance tracking - must be at the top
  const trackRender = usePerformanceTracking('DiscussionTopicsTab');
  const { collapseSidebar } = useSidebar();
  
  // Track render completion immediately
  React.useEffect(() => {
    trackRender();
  });
  
  const [state, setState] = useState<DiscussionTopicsState>({
    topics: [],
    selectedTopic: null,
    questions: [],
    isLoadingTopics: true,
    isGeneratingQuestions: false,
    generationProgress: "",
    generationProgressPercent: 0,
    customTopicInput: "",
    error: null,
    errorType: null,
    isFlashcardOpen: false,
    tutorId: null,
    retryCount: 0,
  });

  // Load tutor info and clean up cache on component mount
  useEffect(() => {
    const initializeTutor = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          // For development/testing, use a fallback tutor ID
          const fallbackTutorId = process.env.NODE_ENV === 'development' ? 'dev-tutor-id' : null;
          setState(prev => ({ 
            ...prev, 
            tutorId: fallbackTutorId,
            error: fallbackTutorId ? null : 'Authentication required',
            errorType: fallbackTutorId ? null : 'generic',
            isLoadingTopics: false
          }));
          return;
        }
        
        if (user) {
          setState(prev => ({ ...prev, tutorId: user.id, isLoadingTopics: false }));
        } else {
          // No user found, use fallback for development
          const fallbackTutorId = process.env.NODE_ENV === 'development' ? 'dev-tutor-id' : null;
          setState(prev => ({ 
            ...prev, 
            tutorId: fallbackTutorId,
            error: fallbackTutorId ? null : 'Please log in to view discussion topics',
            errorType: fallbackTutorId ? null : 'generic',
            isLoadingTopics: false
          }));
        }
      } catch (error) {
        console.error('Failed to initialize tutor:', error);
        // For development/testing, use a fallback tutor ID
        const fallbackTutorId = process.env.NODE_ENV === 'development' ? 'dev-tutor-id' : null;
        setState(prev => ({ 
          ...prev, 
          tutorId: fallbackTutorId,
          error: fallbackTutorId ? null : 'Failed to load user information',
          errorType: fallbackTutorId ? null : 'network',
          isLoadingTopics: false
        }));
      }
    };
    
    // Clean up expired cache entries
    clearExpiredEntries();
    
    initializeTutor();
  }, []);



  const handleTopicSelect = async (topic: DiscussionTopic) => {
    setState(prev => ({ 
      ...prev, 
      selectedTopic: topic, 
      isGeneratingQuestions: true, 
      generationProgress: "Checking cache and existing questions...",
      generationProgressPercent: 10,
      error: null,
      errorType: null,
      retryCount: 0
    }));

    try {
      let questionsList: Question[] = [];
      let fromCache = false;

      // First, try to get questions from cache
      const cachedQuestions = getQuestionsCache(topic.id);
      if (cachedQuestions && cachedQuestions.length >= 10) {
        // Check if we should refresh the cache
        if (!shouldRefreshQuestions(topic.id, cachedQuestions.length)) {
          questionsList = cachedQuestions;
          fromCache = true;
          setState(prev => ({ 
            ...prev, 
            generationProgress: "Loading questions from cache...",
            generationProgressPercent: 80
          }));
        }
      }

      if (!fromCache) {
        // For predefined topics, skip database check and go straight to AI generation
        if (topic.id.startsWith('predefined-')) {
          console.log('🎯 Predefined topic detected, skipping database check');
          setState(prev => ({ 
            ...prev, 
            generationProgress: "Generating personalized questions...",
            generationProgressPercent: 40
          }));
          
          const newQuestions = await generateQuestionsForTopic(topic);
          
          if (newQuestions.length > 0) {
            // For predefined topics, we don't store in database, just use them directly
            questionsList = newQuestions.map((q, index) => ({
              id: `temp-${topic.id}-${index}`,
              topic_id: topic.id,
              question_text: q.question_text,
              question_order: q.question_order,
              difficulty_level: q.difficulty_level,
              created_at: new Date().toISOString()
            }));
            
            // Cache the questions for future use
            setQuestionsCache(topic.id, questionsList);
            updateTopicMetadata(topic.id, questionsList.length, student.id, student.level);
            
            toast.success(`Generated ${questionsList.length} questions for "${topic.title}"`);
          } else {
            throw new Error('Failed to generate questions');
          }
        } else {
          // Check if questions exist in database with count for better decision making (custom topics only)
          setState(prev => ({ 
            ...prev, 
            generationProgress: "Checking database for questions...",
            generationProgressPercent: 25
          }));
          const { data: questionsInfo, error: checkError } = await checkQuestionsExistWithCount(topic.id);
          if (checkError) {
            const errorType = checkError.message.includes('network') || checkError.message.includes('fetch') 
              ? 'network' : 'generic';
            throw { ...checkError, type: errorType };
          }

        if (questionsInfo?.exists) {
          // Questions exist, fetch them with metadata for better caching
          setState(prev => ({ 
            ...prev, 
            generationProgress: "Loading questions from database...",
            generationProgressPercent: 50
          }));
          
          const { data: questionsData, error: questionsError } = await getQuestionsWithMetadata(topic.id);
          if (questionsError) throw questionsError;
          
          questionsList = questionsData?.questions || [];
          
          // Cache the fetched questions
          if (questionsList.length > 0) {
            setQuestionsCache(topic.id, questionsList);
            updateTopicMetadata(topic.id, questionsList.length, student.id, student.level);
          }
          
          // Verify we have enough questions (at least 10 for a good experience)
          if (questionsData && questionsData.count < 10) {
            setState(prev => ({ 
              ...prev, 
              generationProgress: "Insufficient questions found, generating additional ones...",
              generationProgressPercent: 60
            }));
            
            // Generate new questions to supplement existing ones
            const newQuestions = await generateQuestionsForTopic(topic);
            if (newQuestions.length > 0) {
              // Store the new questions in database
              const { data: storedQuestions, error: storeError } = await storeAIGeneratedQuestions(
                topic.id, 
                newQuestions.map((q, index) => ({
                  question_text: q.question_text,
                  difficulty_level: q.difficulty_level,
                  question_order: questionsList.length + index + 1
                }))
              );
              
              if (storeError) {
                console.warn('Failed to store additional questions:', storeError);
              } else if (storedQuestions) {
                questionsList = [...questionsList, ...storedQuestions];
                // Update cache with new questions
                setQuestionsCache(topic.id, questionsList);
                updateTopicMetadata(topic.id, questionsList.length, student.id, student.level);
              }
            }
          }
        } else {
          // No existing questions, generate new ones
          setState(prev => ({ 
            ...prev, 
            generationProgress: "Generating personalized questions...",
            generationProgressPercent: 40
          }));
          
          const newQuestions = await generateQuestionsForTopic(topic);
          
          if (newQuestions.length > 0) {
            // Store questions in database for future use
            setState(prev => ({ 
              ...prev, 
              generationProgress: "Saving questions for future use...",
              generationProgressPercent: 85
            }));
            
            const { data: storedQuestions, error: storeError } = await storeAIGeneratedQuestions(
              topic.id, 
              newQuestions
            );
            
            if (storeError) {
              console.warn('Failed to store questions, using temporary ones:', storeError);
              // Use the generated questions even if storage failed
              questionsList = newQuestions.map((q, index) => ({
                id: `temp-${index}`,
                topic_id: topic.id,
                question_text: q.question_text,
                question_order: q.question_order,
                difficulty_level: q.difficulty_level,
                created_at: new Date().toISOString()
              }));
            } else if (storedQuestions) {
              questionsList = storedQuestions;
            }
            
            // Cache the new questions
            if (questionsList.length > 0) {
              setQuestionsCache(topic.id, questionsList);
              updateTopicMetadata(topic.id, questionsList.length, student.id, student.level);
            }
            
            toast.success(`Generated ${questionsList.length} questions for "${topic.title}"`);
          } else {
            throw new Error('Failed to generate questions');
          }
        }
        } // Close the else block for custom topics
      }

      // Ensure we have questions before opening flashcard interface
      if (questionsList.length === 0) {
        throw new Error('No questions available for this topic');
      }

      // Collapse sidebar to give more room for questions
      collapseSidebar();

      // Seamless transition to flashcard interface
      setState(prev => ({ 
        ...prev, 
        questions: questionsList, 
        isGeneratingQuestions: false, 
        generationProgress: "",
        generationProgressPercent: 100,
        isFlashcardOpen: true 
      }));

      // Show cache hit message if questions were loaded from cache
      if (fromCache) {
        toast.success(`Loaded ${questionsList.length} questions from cache`);
      }

    } catch (error: any) {
      console.error('Error handling topic selection:', error);
      
      // Determine error type for appropriate fallback UI
      let errorType: 'network' | 'ai-generation' | 'validation' | 'generic' = 'generic';
      
      if (error.type) {
        errorType = error.type;
      } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('connection')) {
        errorType = 'network';
      } else if (error.message?.includes('generate') || error.message?.includes('AI') || error.message?.includes('questions')) {
        errorType = 'ai-generation';
      } else if (error.message?.includes('validation') || error.message?.includes('invalid')) {
        errorType = 'validation';
      }
      
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to load or generate questions',
        errorType,
        isGeneratingQuestions: false,
        generationProgress: "",
        generationProgressPercent: 0,
        selectedTopic: null,
        retryCount: prev.retryCount + 1
      }));
      
      // Show appropriate toast message
      const toastMessage = errorType === 'network' 
        ? 'Connection failed. Please check your internet connection.'
        : errorType === 'ai-generation'
        ? 'Failed to generate questions. Please try again.'
        : error.message || 'Failed to load questions';
        
      toast.error(toastMessage);
    }
  };

  // Helper function to generate questions for a topic
  const generateQuestionsForTopic = async (topic: DiscussionTopic): Promise<Array<{
    question_text: string;
    difficulty_level: string;
    question_order: number;
  }>> => {
    const { startTimer, endTimer } = await import('@/lib/performance-monitor');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Update progress with more specific messaging
    setState(prev => ({ 
      ...prev, 
      generationProgress: `Creating ${student.level.toUpperCase()} level questions for "${topic.title}"...`,
      generationProgressPercent: 70
    }));

    startTimer('ai_question_generation', { 
      topicId: topic.id, 
      topicTitle: topic.title, 
      studentLevel: student.level,
      isCustomTopic: topic.is_custom 
    });

    try {
      // Call the AI function to generate questions
      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-discussion-questions`;
      
      console.log('🤖 Attempting to call AI function:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: student.id,
          topic_title: topic.title,
          custom_topic: topic.is_custom
        }),
      });

      console.log('🤖 AI function response status:', response.status);
      
      if (!response.ok) {
        // If function is not deployed, fall back to hardcoded questions
        if (response.status === 404) {
          console.warn('🔄 AI function not deployed, using fallback questions');
          return generateFallbackQuestions(topic);
        }
        
        const errorText = await response.text();
        const error = new Error(`Failed to generate questions: ${errorText}`);
        (error as any).type = response.status >= 500 ? 'network' : 'ai-generation';
        
        endTimer('ai_question_generation', { 
          topicId: topic.id, 
          success: false, 
          error: errorText,
          statusCode: response.status 
        });
        
        throw error;
      }

      const result = await response.json();
      
      if (result.success && result.questions) {
        endTimer('ai_question_generation', { 
          topicId: topic.id, 
          success: true, 
          questionCount: result.questions.length 
        });
        
        return result.questions;
      } else {
        endTimer('ai_question_generation', { 
          topicId: topic.id, 
          success: false, 
          error: result.error || 'Unknown error' 
        });
        
        throw new Error(result.error || 'Failed to generate questions');
      }
    } catch (error) {
      // If network error or function not available, use fallback
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.warn('Network error, using fallback questions:', error.message);
        return generateFallbackQuestions(topic);
      }
      
      endTimer('ai_question_generation', { 
        topicId: topic.id, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  };

  // Fallback question generator
  const generateFallbackQuestions = (topic: DiscussionTopic): Array<{
    question_text: string;
    difficulty_level: string;
    question_order: number;
  }> => {
    const baseQuestions = [
      `What do you think about ${topic.title}?`,
      `Can you describe your experience with ${topic.title}?`,
      `How important is ${topic.title} in your daily life?`,
      `What would you like to learn about ${topic.title}?`,
      `How has ${topic.title} changed in recent years?`,
      `What advice would you give someone about ${topic.title}?`,
      `What challenges do people face with ${topic.title}?`,
      `How does ${topic.title} differ in various cultures?`,
      `What role does ${topic.title} play in your community?`,
      `How do you see ${topic.title} evolving in the future?`,
      `What are the benefits of ${topic.title}?`,
      `What problems can ${topic.title} cause?`,
      `How did you first learn about ${topic.title}?`,
      `What would happen if there was no ${topic.title}?`,
      `How do different generations view ${topic.title}?`,
      `What's your favorite thing about ${topic.title}?`,
      `What's the most difficult aspect of ${topic.title}?`,
      `How would you explain ${topic.title} to a child?`,
      `What misconceptions do people have about ${topic.title}?`,
      `How has technology affected ${topic.title}?`,
      `What trends do you notice in ${topic.title}?`,
      `How does ${topic.title} impact the environment?`,
      `What skills are needed for ${topic.title}?`,
      `How do you stay updated about ${topic.title}?`,
      `What would you change about ${topic.title} if you could?`
    ];

    return baseQuestions.slice(0, 20).map((question, index) => ({
      question_text: question,
      difficulty_level: student.level,
      question_order: index + 1
    }));
  };



  const handleFlashcardClose = () => {
    setState(prev => ({ 
      ...prev, 
      isFlashcardOpen: false, 
      selectedTopic: null, 
      questions: [] 
    }));
  };

  const handleRetry = () => {
    setState(prev => ({ 
      ...prev, 
      error: null, 
      errorType: null,
      generationProgressPercent: 0
    }));
  };

  const handleRetryTopicSelection = () => {
    if (state.selectedTopic) {
      handleTopicSelect(state.selectedTopic);
    } else {
      handleRetry();
    }
  };

  // Error state with specific fallback UI
  if (state.error && !state.isLoadingTopics) {
    const errorProps = {
      onRetry: handleRetryTopicSelection,
      className: "floating-card glass-effect border-cyber-400/20"
    };

    switch (state.errorType) {
      case 'network':
        return <NetworkErrorFallback {...errorProps} />;
      case 'ai-generation':
        return (
          <AIGenerationErrorFallback 
            {...errorProps}
            topicTitle={state.selectedTopic?.title}
            error={state.error}
          />
        );
      default:
        return <GenericErrorFallback {...errorProps} />;
    }
  }

  // Loading state
  if (state.isLoadingTopics) {
    return <DiscussionTopicsTabSkeleton />;
  }

  // Question generation loading state
  if (state.isGeneratingQuestions) {
    // Calculate estimated time based on progress
    const getEstimatedTime = (progress: number) => {
      if (progress < 30) return "30-45 seconds";
      if (progress < 60) return "15-30 seconds";
      if (progress < 85) return "10-15 seconds";
      return "Almost done...";
    };

    return (
      <div className="space-y-4">
        <Card className="floating-card glass-effect border-cyber-400/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-cyber-400" />
              Discussion Topics for {student.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIGenerationLoading
              progress={state.generationProgressPercent}
              currentStep={state.generationProgress}
              topicTitle={state.selectedTopic?.title}
              estimatedTime={getEstimatedTime(state.generationProgressPercent)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('DiscussionTopicsTab Error:', error, errorInfo);
        toast.error('An unexpected error occurred in the discussion topics feature');
      }}
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      <Card className="floating-card glass-effect border-cyber-400/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-cyber-400" />
            Discussion Topics for {student.name}
          </CardTitle>
          <CardDescription>
            Practice conversational skills with personalized discussion topics and questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorBoundary
            fallback={
              <GenericErrorFallback 
                onRetry={() => window.location.reload()}
              />
            }
          >
            {state.tutorId ? (
              <TopicsList
                student={student}
                tutorId={state.tutorId}
                onTopicSelect={handleTopicSelect}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading topics...</span>
              </div>
            )}
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Flashcard Interface */}
      <ErrorBoundary
        fallback={
          <GenericErrorFallback 
            onRetry={handleFlashcardClose}
            onReset={handleFlashcardClose}
          />
        }
      >
        <FlashcardInterface
          questions={state.questions}
          isOpen={state.isFlashcardOpen}
          onClose={handleFlashcardClose}
          topicTitle={state.selectedTopic?.title || ""}
        />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.student.id === nextProps.student.id &&
    prevProps.student.level === nextProps.student.level &&
    prevProps.student.name === nextProps.student.name &&
    prevProps.student.target_language === nextProps.student.target_language
  );
});

export default DiscussionTopicsTab;