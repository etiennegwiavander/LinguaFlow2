'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VocabularyFlashcardInterface } from './VocabularyFlashcardInterface';
import { VocabularyCardData, Student, StudentVocabularyProfile } from '@/types';
import { vocabularySessionManager, VocabularyError } from '@/lib/vocabulary-session';
import { VocabularyErrorBoundary } from './VocabularyErrorBoundary';
import { useSidebar } from '@/lib/sidebar-context';
import { 
  VocabularyGenerationErrorFallback,
  SessionCorruptionErrorFallback,
  VocabularyNetworkErrorFallback,
  VocabularyTimeoutErrorFallback
} from './VocabularyErrorFallbacks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Brain, 
  Clock, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  Database
} from 'lucide-react';

interface VocabularyFlashcardsTabProps {
  student: Student;
  className?: string;
}

const VocabularyFlashcardsTab = React.memo(function VocabularyFlashcardsTab({
  student,
  className
}: VocabularyFlashcardsTabProps) {
  // State management
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyCardData[]>([]);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<VocabularyError | null>(null);
  const [canContinueFromMemory, setCanContinueFromMemory] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    totalWordsStudied: 0,
    averageSessionDuration: 0,
    lastSessionDate: null as Date | null
  });

  // Sidebar control
  const { collapseSidebar } = useSidebar();

  // Create student vocabulary profile from student data
  const studentProfile = useMemo((): StudentVocabularyProfile => {
    // Map student level to CEFR format
    const mapLevelToCEFR = (level: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' => {
      const levelUpper = level.toUpperCase();
      if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(levelUpper)) {
        return levelUpper as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      }
      return 'B1'; // Default fallback
    };

    // Parse learning goals from end_goals
    const learningGoals = student.end_goals 
      ? student.end_goals.split(',').map(goal => goal.trim()).filter(Boolean)
      : ['general language learning'];

    // Parse vocabulary weaknesses from vocabulary_gaps
    const vocabularyWeaknesses = student.vocabulary_gaps
      ? student.vocabulary_gaps.split(',').map(weakness => weakness.trim()).filter(Boolean)
      : [];

    // Parse conversational barriers
    const conversationalBarriers = student.conversational_fluency_barriers
      ? student.conversational_fluency_barriers.split(',').map(barrier => barrier.trim()).filter(Boolean)
      : [];

    return {
      studentId: student.id,
      proficiencyLevel: mapLevelToCEFR(student.level),
      nativeLanguage: student.native_language || 'unknown',
      learningGoals,
      vocabularyWeaknesses,
      conversationalBarriers,
      seenWords: vocabularySessionManager.getSeenWords(student.id)
    };
  }, [student]);

  // Function to refresh session statistics
  const refreshStats = async () => {
    try {
      const stats = await vocabularySessionManager.getSessionStatistics(student.id);
      setSessionStats(stats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  // Check if user can continue from last memory on component mount
  useEffect(() => {
    const checkLastMemory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user can continue from last memory
        const canContinue = await vocabularySessionManager.canContinueFromLastMemory(student.id);
        setCanContinueFromMemory(canContinue);
        
        // Try to recover any existing session
        const recoveredSession = await vocabularySessionManager.recoverSession(student.id);
        if (recoveredSession) {
          setVocabularyWords(recoveredSession.words);
          setCurrentPosition(recoveredSession.currentPosition);
          setIsUsingFallback(vocabularySessionManager.isUsingFallbackVocabulary());
          
          // Clean up old sessions periodically
          vocabularySessionManager.cleanupOldSessions(student.id).catch(error => {
            console.error('Error cleaning up old sessions:', error);
          });
        }

        // Load session statistics
        const stats = await vocabularySessionManager.getSessionStatistics(student.id);
        setSessionStats(stats);
      } catch (error) {
        console.error('Error checking last memory:', error);
        const vocabularyError: VocabularyError = {
          type: 'session-corruption',
          message: 'Failed to recover previous session data',
          originalError: error instanceof Error ? error : undefined,
          retryable: true,
          fallbackAvailable: true
        };
        setError(vocabularyError);
      } finally {
        setIsLoading(false);
      }
    };

    checkLastMemory();
  }, [student.id]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup session manager resources
      vocabularySessionManager.cleanup();
    };
  }, []);

  // Handle page unload to save session progress
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current session progress before page unload
      if (vocabularySessionManager.getCurrentSession()) {
        vocabularySessionManager.cleanup();
      }
    };

    const handleVisibilityChange = () => {
      // Save progress when tab becomes hidden (user switches tabs)
      if (document.hidden && vocabularySessionManager.getCurrentSession()) {
        vocabularySessionManager.cleanup();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Create vocabulary session with AI-only generation
  const createVocabularySession = useCallback(async (count: number = 20): Promise<VocabularyCardData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await vocabularySessionManager.createSession(student.id, studentProfile, count);
      setIsUsingFallback(false); // Always AI-generated
      return session.words;
    } catch (error) {
      console.error('Error creating vocabulary session:', error);
      
      let vocabularyError: VocabularyError;
      if (error && typeof error === 'object' && 'type' in error) {
        vocabularyError = error as VocabularyError;
      } else {
        vocabularyError = {
          type: 'generation',
          message: error instanceof Error ? error.message : 'Failed to generate personalized vocabulary. Please try again.',
          originalError: error instanceof Error ? error : undefined,
          retryable: true,
          fallbackAvailable: false
        };
      }
      
      setError(vocabularyError);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [student.id, studentProfile]);

  // Start new vocabulary session
  const startNewSession = useCallback(async () => {
    try {
      const words = await createVocabularySession(20);
      if (words.length === 0) {
        return; // Error already set in createVocabularySession
      }

      setVocabularyWords(words);
      setCurrentPosition(0);
      setIsFlashcardOpen(true);
      setCanContinueFromMemory(false);
      setError(null);
      
      // Collapse sidebar to give more space for vocabulary cards
      collapseSidebar();
      
      // Refresh stats after creating new session
      await refreshStats();
    } catch (error) {
      console.error('Error starting new session:', error);
      // Error already handled in createVocabularySession
    }
  }, [createVocabularySession, refreshStats, collapseSidebar]);

  // Continue from last memory
  const continueFromMemory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const session = await vocabularySessionManager.continueFromLastMemory(student.id);
      
      if (!session) {
        const vocabularyError: VocabularyError = {
          type: 'session-corruption',
          message: 'Could not recover previous session. Please start a new session.',
          retryable: false,
          fallbackAvailable: false
        };
        setError(vocabularyError);
        return;
      }

      setVocabularyWords(session.words);
      setCurrentPosition(session.currentPosition);
      setIsFlashcardOpen(true);
      setCanContinueFromMemory(false);
      setIsUsingFallback(vocabularySessionManager.isUsingFallbackVocabulary());
      
      // Collapse sidebar to give more space for vocabulary cards
      collapseSidebar();
    } catch (error) {
      console.error('Error continuing from memory:', error);
      const vocabularyError: VocabularyError = {
        type: 'session-corruption',
        message: 'Failed to continue from last session',
        originalError: error instanceof Error ? error : undefined,
        retryable: true,
        fallbackAvailable: true
      };
      setError(vocabularyError);
    } finally {
      setIsLoading(false);
    }
  }, [student.id, collapseSidebar]);

  // Handle flashcard interface close
  const handleFlashcardClose = useCallback(() => {
    setIsFlashcardOpen(false);
    // Session will be automatically saved by the session manager
  }, []);

  // Handle position changes from flashcard interface
  const handlePositionChange = useCallback((position: number) => {
    setCurrentPosition(position);
    
    // Mark current word as seen
    if (vocabularyWords[position]) {
      vocabularySessionManager.addSeenWord(vocabularyWords[position].word, student.id);
    }
  }, [vocabularyWords, student.id]);

  // Reset session data
  const resetSessionData = useCallback(async () => {
    try {
      await vocabularySessionManager.clearSessionData(student.id);
      setVocabularyWords([]);
      setCurrentPosition(0);
      setCanContinueFromMemory(false);
      setError(null);
      setIsUsingFallback(false);
      vocabularySessionManager.resetErrorState();
    } catch (error) {
      console.error('Error resetting session data:', error);
    }
  }, [student.id]);

  // Retry current operation
  const retryOperation = useCallback(async () => {
    if (!error) return;

    setError(null);
    
    if (error.type === 'session-corruption' && canContinueFromMemory) {
      await continueFromMemory();
    } else {
      await startNewSession();
    }
  }, [error, canContinueFromMemory, continueFromMemory, startNewSession]);

  // Handle error boundary reset
  const handleErrorBoundaryReset = useCallback(() => {
    resetSessionData();
  }, [resetSessionData]);

  // Get session progress information
  const sessionProgress = useMemo(() => {
    return vocabularySessionManager.getSessionProgress();
  }, []);

  // Render flashcard interface if open
  if (isFlashcardOpen && vocabularyWords.length > 0) {
    return (
      <VocabularyErrorBoundary
        onReset={handleErrorBoundaryReset}
        studentName={student.name}
        showErrorDetails={process.env.NODE_ENV === 'development'}
      >
        <VocabularyFlashcardInterface
          vocabularyWords={vocabularyWords}
          initialIndex={currentPosition}
          onClose={handleFlashcardClose}
          onPositionChange={handlePositionChange}
          isLoading={isLoading}
          className={className}
        />
      </VocabularyErrorBoundary>
    );
  }

  // Main tab interface
  return (
    <VocabularyErrorBoundary
      onReset={handleErrorBoundaryReset}
      studentName={student.name}
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      <div className={cn('space-y-6 p-6', className)}>
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Vocabulary Flashcards</h2>
            <Badge variant="secondary" className="ml-2">
              {studentProfile.proficiencyLevel}
            </Badge>
            {isUsingFallback && (
              <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                <Database className="w-3 h-3 mr-1" />
                Offline Mode
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Personalized vocabulary practice tailored to {student.name}&apos;s learning profile and goals.
          </p>
        </div>

        {/* Error Display with specific error types */}
        {error && (
          <div className="space-y-4">
            {error.type === 'generation' && (
              <VocabularyGenerationErrorFallback
                studentName={student.name}
                proficiencyLevel={studentProfile.proficiencyLevel}
                error={error.message}
                onRetry={error.retryable ? retryOperation : undefined}
                onReset={undefined}
              />
            )}
            
            {error.type === 'session-corruption' && (
              <SessionCorruptionErrorFallback
                studentName={student.name}
                onRetry={error.retryable ? retryOperation : undefined}
                onReset={resetSessionData}
              />
            )}
            
            {error.type === 'network' && (
              <VocabularyNetworkErrorFallback
                onRetry={retryOperation}
                onReset={undefined}
              />
            )}
            
            {error.type === 'timeout' && (
              <VocabularyTimeoutErrorFallback
                studentName={student.name}
                onRetry={retryOperation}
                onReset={undefined}
              />
            )}
            
            {!['generation', 'session-corruption', 'network', 'timeout'].includes(error.type) && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{error.message}</p>
                      {error.retryable && (
                        <div className="mt-2 flex gap-2">
                          <Button onClick={retryOperation} size="sm" variant="outline">
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      {/* Student Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Learning Profile</span>
          </CardTitle>
          <CardDescription>
            Vocabulary practice customized for {student.name}&apos;s specific needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>Learning Goals</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {studentProfile.learningGoals.map((goal, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
            
            {studentProfile.vocabularyWeaknesses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Focus Areas</span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {studentProfile.vocabularyWeaknesses.map((weakness, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {weakness}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{studentProfile.proficiencyLevel}</p>
              <p className="text-xs text-muted-foreground">Level</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{sessionStats.totalWordsStudied}</p>
              <p className="text-xs text-muted-foreground">Total Words</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{sessionStats.totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{sessionProgress.percentage}%</p>
              <p className="text-xs text-muted-foreground">Current Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Continue from Memory Option */}
        {canContinueFromMemory && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="font-medium">Continue from Last Session</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pick up where you left off in your previous vocabulary session
                  </p>
                </div>
                <Button 
                  onClick={continueFromMemory}
                  disabled={isLoading}
                  className="ml-4"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start New Session */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Start New Vocabulary Session</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate fresh vocabulary words personalized to {student.name}&apos;s learning needs
                </p>
              </div>
              <div className="ml-4">
                <Button 
                  onClick={startNewSession}
                  disabled={isLoading}
                  variant={canContinueFromMemory ? "outline" : "default"}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isLoading ? 'Generating...' : 'Start New Session'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Feature Information */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">How Vocabulary Flashcards Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">🎯 Personalized Content</h4>
              <p className="text-muted-foreground">
                Words are selected based on {student.name}&apos;s proficiency level, learning goals, and identified vocabulary gaps.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📚 Comprehensive Information</h4>
              <p className="text-muted-foreground">
                Each flashcard includes pronunciation, definition, part of speech, and example sentences across different tenses.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🔄 Smart Repetition</h4>
              <p className="text-muted-foreground">
                The system ensures no word repeats within sessions and builds upon previously studied vocabulary.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">💾 Session Memory</h4>
              <p className="text-muted-foreground">
                Your progress is automatically saved, allowing you to continue from where you left off in previous sessions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </VocabularyErrorBoundary>
  );
});

export default VocabularyFlashcardsTab;