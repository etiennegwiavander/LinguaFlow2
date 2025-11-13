"use client";

import React, { useState, useEffect } from "react";
import { Student, DiscussionTopic, Question } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
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
import { DiscussionTopicsTabSkeleton } from "./SkeletonLoaders";
import { AIGenerationLoading } from "./LoadingStates";

import {
  checkQuestionsExistWithCount,
  getQuestionsWithMetadata,
  storeAIGeneratedQuestions
} from "@/lib/discussion-questions-db";
import { clearExpiredEntries } from "@/lib/discussion-cache";
import { usePerformanceTracking } from "@/lib/performance-monitor";
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
        // ULTRA AGGRESSIVE cache clearing for contextual AI questions system
        const hasUpgraded = localStorage.getItem('linguaflow_questions_upgraded_v8_manual_clear');
        if (!hasUpgraded) {
          console.log('🔄 ULTRA FORCE UPGRADING to contextual AI questions system v8...');

          // Show alert to user about the upgrade
          if (typeof window !== 'undefined') {
            console.log('🚨 CLEARING ALL CACHED QUESTIONS - You will see fresh AI-generated questions!');
          }

          // Import cache functions
          const { clearAllQuestionsCache, clearAllCache } = await import('@/lib/discussion-cache');

          // Clear ALL cache aggressively
          clearAllCache();
          clearAllQuestionsCache();

          // Also clear browser cache and force reload of questions
          if (typeof window !== 'undefined') {
            // Clear ALL localStorage items (more aggressive)
            Object.keys(localStorage).forEach(key => {
              if (key.includes('linguaflow') || key.includes('discussion') || key.includes('questions') || key.includes('topics') || key.includes('cache')) {
                console.log('🗑️ Clearing cache key:', key);
                localStorage.removeItem(key);
              }
            });

            // Also clear sessionStorage
            Object.keys(sessionStorage).forEach(key => {
              if (key.includes('linguaflow') || key.includes('discussion') || key.includes('questions') || key.includes('topics')) {
                console.log('🗑️ Clearing session key:', key);
                sessionStorage.removeItem(key);
              }
            });
          }

          // Also clear database questions for this student
          try {
            console.log('🗑️ Clearing database questions for student:', student.id);
            const { clearAllQuestionsForStudent } = await import('@/lib/discussion-questions-db');
            await clearAllQuestionsForStudent(student.id);
            console.log('✅ Cleared database questions for student');
          } catch (error) {
            console.warn('Failed to clear database questions:', error);
          }

          localStorage.setItem('linguaflow_questions_upgraded_v8_manual_clear', 'true');
          console.log('✅ ULTRA FORCE CLEARED all caches and database - Questions system upgraded to v8');
        }

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
  }, [student.id]);



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

      // FORCE FRESH GENERATION - Skip cache completely for better contextual questions
      console.log('🔄 Forcing fresh question generation for better contextual results');
      fromCache = false;

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

            // Skip caching for now to ensure fresh questions every time
            console.log('🚫 Skipping cache to ensure fresh contextual questions');

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

            // Check if existing questions are using old generic format
            const needsRegeneration = areQuestionsGeneric(questionsList);

            if (needsRegeneration) {
              setState(prev => ({
                ...prev,
                generationProgress: "Upgrading questions to enhanced format...",
                generationProgressPercent: 60
              }));

              // Clear old questions and generate new enhanced ones
              const { forceRegenerateQuestions } = await import('@/lib/discussion-questions-db');
              await forceRegenerateQuestions(topic.id);

              // Clear cache for this topic
              const { forceRefreshQuestions } = await import('@/lib/discussion-cache');
              forceRefreshQuestions(topic.id);

              // Generate new enhanced questions
              const newQuestions = await generateQuestionsForTopic(topic);

              if (newQuestions.length > 0) {
                // Store the new enhanced questions
                const { data: storedQuestions, error: storeError } = await storeAIGeneratedQuestions(
                  topic.id,
                  newQuestions
                );

                if (storeError) {
                  console.warn('Failed to store enhanced questions:', storeError);
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

                // Skip caching for now to ensure fresh questions
                console.log('🚫 Skipping cache for enhanced questions');

                toast.success(`Enhanced ${questionsList.length} questions with personalized format!`);
              }
            } else {
              // Skip caching existing questions to force fresh generation
              console.log('🚫 Skipping cache for existing questions');
            }

            // Verify we have enough questions (at least 10 for a good experience)
            if (questionsData && questionsData.count < 10 && !needsRegeneration) {
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
                  // Skip caching additional questions
                  console.log('🚫 Skipping cache for additional questions');
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

              // Skip caching new questions to ensure fresh generation
              console.log('🚫 Skipping cache for new questions - ensuring fresh generation');

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

      // Always show fresh generation message since we're not using cache
      toast.success(`Generated ${questionsList.length} fresh contextual questions!`);

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

  // Helper function to detect if questions are using old generic format
  const areQuestionsGeneric = (questions: Question[]): boolean => {
    if (!questions || questions.length === 0) return false;

    // Check for generic patterns that indicate old format
    const genericPatterns = [
      /^What do you think about/i,
      /^How is .+ different in your country/i,
      /^What would you tell someone/i,
      /^Share your personal experience/i,
      /^What interests you most about/i,
      /^How does understanding .+ help you achieve/i,
      /^What vocabulary related to .+ do you find/i,
      /^How would discussing .+ help you in real-life/i,
      /^From your perspective as a .+ learner/i,
      /^What questions would you ask a native/i
    ];

    // If more than 30% of questions match generic patterns, consider them old format
    const genericCount = questions.filter(q =>
      genericPatterns.some(pattern => pattern.test(q.question_text))
    ).length;

    return genericCount > questions.length * 0.3;
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
        // If function is not deployed, fall back to Gemini API
        if (response.status === 404) {
          console.warn('🔄 AI function not deployed, using Gemini API fallback');
          return await generateFallbackQuestions(topic);
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
      // If network error or function not available, use DeepSeek API fallback
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.warn('Network error, using DeepSeek API fallback:', error.message);
        return await generateFallbackQuestions(topic);
      }

      endTimer('ai_question_generation', {
        topicId: topic.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  // AI-powered fallback question generator using DeepSeek via OpenRouter
  const generateFallbackQuestions = async (topic: DiscussionTopic): Promise<Array<{
    question_text: string;
    difficulty_level: string;
    question_order: number;
  }>> => {
    console.log('🤖 Using DeepSeek API fallback for question generation');

    try {
      // Create topic-specific prompt for better contextual questions
      const createTopicSpecificPrompt = (topicTitle: string, student: any): string => {
        const topicLower = topicTitle.toLowerCase();
        const studentName = student.name;
        const level = student.level.toUpperCase();

        const baseRequirements = `
Student: ${studentName} (${level} level ${student.target_language})
Generate 15-18 unique, contextual discussion questions.

CRITICAL REQUIREMENTS:
- Each question must be completely different in structure and approach
- NO formulaic patterns like "Tell me about a time when..." repeated
- NO generic question starters across multiple questions
- Make each question feel like it comes from a different conversation
- Use ${studentName}'s name naturally in questions
- Focus on specific, concrete scenarios rather than abstract concepts

Format: JSON array only:
[{"question_text": "...", "difficulty_level": "${student.level}", "question_order": 1}]
`;

        if (topicLower.includes('food') || topicLower.includes('cooking') || topicLower.includes('restaurant')) {
          return `${baseRequirements}

FOOD & COOKING - Create questions exploring specific cooking disasters, sensory memories, cultural food traditions, restaurant experiences, emotional connections to dishes, food-related travel memories, and cooking skills.

Example variety (use different structures):
- "What's the worst cooking disaster you've ever had, ${studentName}?"
- "If you could smell one food cooking right now, what would instantly make you hungry?"
- "Which dish from your childhood could your mother/grandmother make that no restaurant has ever matched?"
- "Have you ever tried to recreate a dish you had while traveling? How did it go?"

Make each question completely unique in structure and focus.`;
        }

        if (topicLower.includes('travel') || topicLower.includes('vacation') || topicLower.includes('trip')) {
          return `${baseRequirements}

TRAVEL & ADVENTURE - Create questions about specific travel mishaps, cultural shock moments, transportation experiences, meeting locals, language barriers, and travel planning vs spontaneous adventures.

Example variety:
- "What's the most embarrassing thing that happened to you while traveling, ${studentName}?"
- "Have you ever missed a flight or train? What happened next?"
- "Which local person you met while traveling left the biggest impression on you?"

Each question should explore different aspects with unique phrasing.`;
        }

        if (topicLower.includes('technology') || topicLower.includes('social media') || topicLower.includes('internet')) {
          return `${baseRequirements}

TECHNOLOGY & DIGITAL LIFE - Create questions about specific tech failures, social media habits, smartphone addiction, online shopping, video calls, apps that changed their life, and tech generational differences.

Example variety:
- "What's the most frustrating tech problem you've ever dealt with, ${studentName}?"
- "Have you ever posted something online that you immediately regretted?"
- "Which app on your phone would be hardest to give up for a month?"

Focus on specific scenarios and personal tech experiences.`;
        }

        // Generic but contextual for other topics
        return `${baseRequirements}

TOPIC: ${topicTitle} - Create questions exploring personal experiences, emotional connections, practical challenges, cultural differences, future aspirations, specific scenarios, problem-solving, and relationships.

Example variety:
- "What's something about ${topicTitle} that completely surprised you, ${studentName}?"
- "Have you ever had to make a difficult decision related to ${topicTitle}?"
- "What's the biggest misconception people have about ${topicTitle}?"

Make each question explore different angles with unique structures.`;
      };

      // Call DeepSeek via OpenRouter API directly with topic-specific prompt
      const topicSpecificPrompt = createTopicSpecificPrompt(topic.title, student);

      // Note: API key should be in environment variable, never hardcoded
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://linguaflow.app',
          'X-Title': 'LinguaFlow Discussion Questions'
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3.1",
          messages: [{
            role: 'user',
            content: topicSpecificPrompt
          }],
          temperature: 0.9,
          max_tokens: 1500,
          top_p: 0.95
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        throw new Error('No content generated by DeepSeek API');
      }

      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in DeepSeek response');
      }

      const questions = JSON.parse(jsonMatch[0]);

      // Validate and format questions
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format from DeepSeek API');
      }

      console.log(`✅ Generated ${questions.length} questions using DeepSeek API fallback`);
      return questions.map((q, index) => ({
        question_text: q.question_text || q.question || '',
        difficulty_level: student.level,
        question_order: index + 1
      }));

    } catch (error) {
      console.error('❌ DeepSeek API fallback failed:', error);

      // No emergency fallback - throw error to show proper message to user
      throw new Error(`AI question generation failed. Please ensure the system is properly configured. ${error instanceof Error ? error.message : ''}`);
    }
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