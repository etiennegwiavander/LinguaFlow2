import {
  VocabularySession,
  VocabularyCardData,
  StudentVocabularyProfile,
} from "@/types";
import { supabase } from "./supabase";
import { vocabularyPerformanceMonitor } from "./vocabulary-performance-monitor";
// import { infiniteVocabularyService } from './infinite-vocabulary-service';

// Local storage keys
const VOCABULARY_SESSION_KEY = "vocabulary_session";
const VOCABULARY_PROGRESS_KEY = "vocabulary_progress";
const VOCABULARY_SEEN_WORDS_KEY = "vocabulary_seen_words";

// Session recovery timeout (24 hours)
const SESSION_RECOVERY_TIMEOUT = 24 * 60 * 60 * 1000;

export interface VocabularySessionState {
  session: VocabularySession | null;
  isLoading: boolean;
  error: string | null;
  canContinueFromMemory: boolean;
  isUsingFallback: boolean;
  retryCount: number;
}

export interface VocabularyError {
  type:
    | "generation"
    | "network"
    | "session-corruption"
    | "timeout"
    | "validation"
    | "unknown";
  message: string;
  originalError?: Error;
  retryable: boolean;
  fallbackAvailable: boolean;
}

export interface SessionProgress {
  studentId: string;
  lastSessionId: string;
  lastPosition: number;
  lastAccessTime: Date;
  totalWordsStudied: number;
  sessionDuration: number;
}

export class VocabularySessionManager {
  private currentSession: VocabularySession | null = null;
  private sessionStartTime: Date | null = null;
  private progressUpdateInterval: NodeJS.Timeout | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Start with 1 second
  private isUsingFallback: boolean = false;

  // Performance optimization properties
  private vocabularyCache: Map<
    string,
    { words: VocabularyCardData[]; timestamp: number }
  > = new Map();
  private prefetchQueue: Set<string> = new Set();
  private prefetchController: AbortController | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly PREFETCH_DELAY = 2000; // 2 seconds delay before prefetching

  constructor() {
    this.initializeProgressTracking();
  }

  /**
   * Initialize progress tracking with periodic saves
   */
  private initializeProgressTracking(): void {
    // Save progress every 30 seconds
    this.progressUpdateInterval = setInterval(() => {
      if (this.currentSession) {
        this.saveProgressToLocalStorage();
      }
    }, 30000);
  }

  /**
   * Generate cache key for vocabulary request
   */
  private generateCacheKey(
    studentId: string,
    studentProfile: StudentVocabularyProfile,
    count: number,
    excludeWords: string[]
  ): string {
    const profileHash = JSON.stringify({
      proficiencyLevel: studentProfile.proficiencyLevel,
      nativeLanguage: studentProfile.nativeLanguage,
      learningGoals: studentProfile.learningGoals.sort(),
      vocabularyWeaknesses: studentProfile.vocabularyWeaknesses.sort(),
      conversationalBarriers: studentProfile.conversationalBarriers.sort(),
    });
    const excludeHash = excludeWords.sort().join(",");
    return `${studentId}_${count}_${btoa(profileHash)}_${btoa(excludeHash)}`;
  }

  /**
   * Check if cached vocabulary is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Get vocabulary from cache if available and valid
   */
  private getCachedVocabulary(cacheKey: string): VocabularyCardData[] | null {
    const cached = this.vocabularyCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      vocabularyPerformanceMonitor.recordCacheHit();
      return cached.words;
    }

    vocabularyPerformanceMonitor.recordCacheMiss();

    // Remove expired cache entry
    if (cached) {
      this.vocabularyCache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Cache vocabulary words
   */
  private cacheVocabulary(cacheKey: string, words: VocabularyCardData[]): void {
    // Limit cache size to prevent memory issues
    if (this.vocabularyCache.size >= 10) {
      // Remove oldest entries
      const entries = Array.from(this.vocabularyCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < 5; i++) {
        this.vocabularyCache.delete(entries[i][0]);
      }
    }

    this.vocabularyCache.set(cacheKey, {
      words: words,
      timestamp: Date.now(),
    });
  }

  /**
   * Prefetch vocabulary for next session
   */
  private async prefetchVocabulary(
    studentId: string,
    studentProfile: StudentVocabularyProfile,
    count: number,
    excludeWords: string[]
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(
      studentId,
      studentProfile,
      count,
      excludeWords
    );

    // Skip if already cached or in prefetch queue
    if (
      this.getCachedVocabulary(cacheKey) ||
      this.prefetchQueue.has(cacheKey)
    ) {
      return;
    }

    this.prefetchQueue.add(cacheKey);
    vocabularyPerformanceMonitor.recordPrefetchAttempt();

    try {
      // Cancel previous prefetch if still running
      if (this.prefetchController) {
        this.prefetchController.abort();
      }

      this.prefetchController = new AbortController();

      // Wait before prefetching to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, this.PREFETCH_DELAY));

      if (this.prefetchController.signal.aborted) {
        return;
      }

      const words = await this.generateVocabularyFromAI(
        studentId,
        studentProfile,
        count,
        excludeWords,
        this.prefetchController.signal
      );

      if (!this.prefetchController.signal.aborted) {
        this.cacheVocabulary(cacheKey, words);
        vocabularyPerformanceMonitor.recordPrefetchSuccess();
      }
    } catch (error) {
      // Silently fail prefetch - it's not critical
      console.debug("Prefetch failed (non-critical):", error);
    } finally {
      this.prefetchQueue.delete(cacheKey);
    }
  }

  /**
   * Start prefetching next vocabulary set based on current session
   */
  private startPrefetching(): void {
    if (!this.currentSession) return;

    const studentProfile = this.getStudentProfileFromSession(
      this.currentSession
    );
    if (!studentProfile) return;

    // Prefetch when user is halfway through current session
    const halfwayPoint = Math.floor(this.currentSession.words.length / 2);
    if (this.currentSession.currentPosition >= halfwayPoint) {
      const currentSeenWords = this.getSeenWords(this.currentSession.studentId);
      const sessionWords = this.currentSession.words
        .slice(0, this.currentSession.currentPosition + 1)
        .map((w) => w.word);
      const allExcludeWords = [...currentSeenWords, ...sessionWords];

      // Prefetch in background
      this.prefetchVocabulary(
        this.currentSession.studentId,
        studentProfile,
        20,
        allExcludeWords
      ).catch((error) => {
        console.debug("Background prefetch failed:", error);
      });
    }
  }

  /**
   * Extract student profile from session (helper method)
   */
  private getStudentProfileFromSession(
    session: VocabularySession
  ): StudentVocabularyProfile | null {
    // This would need to be stored in session or reconstructed
    // For now, return null to indicate we need the profile passed in
    return null;
  }

  /**
   * Create vocabulary error with proper classification
   */
  private createVocabularyError(
    error: Error | string | any,
    type: VocabularyError["type"] = "unknown"
  ): VocabularyError {
    let message: string;
    let originalError: Error | undefined;

    if (typeof error === "string") {
      message = error;
      originalError = undefined;
    } else if (error instanceof Error) {
      message = error.message;
      originalError = error;
    } else if (error && typeof error === "object") {
      // Handle Supabase error objects
      message =
        error.message || error.error_description || JSON.stringify(error);
      originalError = error instanceof Error ? error : undefined;
    } else {
      message = String(error);
      originalError = undefined;
    }

    // Auto-classify error type if not specified
    if (type === "unknown") {
      type = this.classifyError(message, originalError);
    }

    return {
      type,
      message,
      originalError,
      retryable: this.isRetryableError(type),
      fallbackAvailable: this.isFallbackAvailable(type),
    };
  }

  /**
   * Classify error based on message and context
   */
  private classifyError(
    message: string,
    error?: Error
  ): VocabularyError["type"] {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("network") ||
      lowerMessage.includes("fetch") ||
      lowerMessage.includes("connection") ||
      lowerMessage.includes("cors")
    ) {
      return "network";
    }

    if (
      lowerMessage.includes("timeout") ||
      lowerMessage.includes("timed out")
    ) {
      return "timeout";
    }

    if (
      lowerMessage.includes("session") &&
      (lowerMessage.includes("corrupt") ||
        lowerMessage.includes("invalid") ||
        lowerMessage.includes("malformed"))
    ) {
      return "session-corruption";
    }

    if (
      lowerMessage.includes("validation") ||
      lowerMessage.includes("invalid input") ||
      lowerMessage.includes("missing required")
    ) {
      return "validation";
    }

    if (
      lowerMessage.includes("generate") ||
      lowerMessage.includes("vocabulary") ||
      lowerMessage.includes("ai service") ||
      lowerMessage.includes("openai")
    ) {
      return "generation";
    }

    return "unknown";
  }

  /**
   * Check if error type is retryable
   */
  private isRetryableError(type: VocabularyError["type"]): boolean {
    return ["network", "timeout", "generation"].includes(type);
  }

  /**
   * Check if fallback is available for error type
   */
  private isFallbackAvailable(type: VocabularyError["type"]): boolean {
    return false; // No fallback vocabulary - AI-only generation
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.retryCount = 0; // Reset on success
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay =
          this.retryDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.retryCount = maxRetries + 1;
    throw lastError!;
  }

  /**
   * Handle vocabulary generation with AI-only approach and caching
   */
  private async generateVocabularyWithAI(
    studentId: string,
    studentProfile: StudentVocabularyProfile,
    count: number,
    excludeWords: string[]
  ): Promise<{ words: VocabularyCardData[]; isUsingFallback: boolean }> {
    const cacheKey = this.generateCacheKey(
      studentId,
      studentProfile,
      count,
      excludeWords
    );

    // Try cache first
    const cachedWords = this.getCachedVocabulary(cacheKey);
    if (cachedWords) {
      console.debug("Using cached vocabulary words");
      this.isUsingFallback = false;
      return { words: cachedWords, isUsingFallback: false };
    }

    // Temporarily disable infinite vocabulary generation until tables are properly migrated
    // try {
    //   const infiniteWords = await infiniteVocabularyService.generateInfiniteVocabulary(
    //     studentProfile,
    //     count,
    //     excludeWords
    //   );
    //
    //   if (infiniteWords && infiniteWords.length > 0) {
    //     this.cacheVocabulary(cacheKey, infiniteWords);
    //     this.isUsingFallback = false;
    //     return { words: infiniteWords, isUsingFallback: false };
    //   }
    // } catch (error) {
    //   console.warn('Infinite vocabulary generation failed, trying standard AI generation:', error);
    // }

    try {
      // Use AI generation for personalized vocabulary
      const words = await this.retryWithBackoff(async () => {
        return await this.generateVocabularyFromAI(
          studentId,
          studentProfile,
          count,
          excludeWords
        );
      });

      // Cache the results
      this.cacheVocabulary(cacheKey, words);

      this.isUsingFallback = false;
      return { words, isUsingFallback: false };
    } catch (error) {
      console.error("AI vocabulary generation failed:", error);
      
      // Log the full error details for debugging
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error keys:', Object.keys(error));
        if ('message' in error) {
          console.error('Error message:', error.message);
        }
        if ('type' in error) {
          console.error('Error type:', error.type);
        }
      }

      // If it's already a VocabularyError, rethrow it
      if (error && typeof error === 'object' && 'type' in error && 'retryable' in error) {
        throw error;
      }

      throw this.createVocabularyError(
        error instanceof Error ? error.message : "Unable to generate personalized vocabulary. Please check your internet connection and try again.",
        "generation"
      );
    }
  }

  /**
   * Generate vocabulary from AI service
   */
  private async generateVocabularyFromAI(
    studentId: string,
    studentProfile: StudentVocabularyProfile,
    count: number,
    excludeWords: string[],
    abortSignal?: AbortSignal
  ): Promise<VocabularyCardData[]> {
    // No timeout - let AI take as long as it needs to generate quality vocabulary
    const controller = new AbortController();

    // Only abort if external signal is triggered (e.g., user cancels)
    if (abortSignal) {
      abortSignal.addEventListener("abort", () => {
        console.log('🛑 External abort signal received');
        controller.abort();
      });
    }

    try {
      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Conditional logging - only in development or when debugging
      const isDebugMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_VOCABULARY === 'true';
      
      if (isDebugMode) {
        console.log('🌐 Vocabulary API request:', {
          student_id: studentId,
          count,
          difficulty: studentProfile.proficiencyLevel,
        });
      }

      const response = await fetch(
        "/api/supabase/functions/generate-vocabulary-words",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            student_id: studentId,
            count,
            exclude_words: excludeWords,
            difficulty: studentProfile.proficiencyLevel,
            focus_areas: studentProfile.vocabularyWeaknesses,
          }),
          signal: controller.signal,
        }
      );

      // Read response body once
      const responseText = await response.text();
      
      if (isDebugMode) {
        console.log('✅ Vocabulary API response:', {
          status: response.status,
          ok: response.ok,
          length: responseText.length
        });
      }

      if (!response.ok) {
        // Only log detailed error info in development
        if (isDebugMode) {
          console.error(`❌ Vocabulary API error ${response.status}:`, {
            status: response.status,
            statusText: response.statusText,
            responsePreview: responseText.substring(0, 200),
            requestParams: {
              student_id: studentId,
              count,
              difficulty: studentProfile.proficiencyLevel,
            }
          });
        }

        if (response.status === 408 || response.status === 504) {
          throw this.createVocabularyError("Request timed out. Please try again.", "timeout");
        }
        if (response.status >= 500) {
          throw this.createVocabularyError(
            `Server error: ${response.statusText}. Please try again later.`,
            "generation"
          );
        }
        if (response.status === 400) {
          throw this.createVocabularyError(
            `Invalid request: ${responseText}`,
            "validation"
          );
        }
        if (response.status === 404) {
          throw this.createVocabularyError(
            "Vocabulary service not found. Please ensure the development server is running.",
            "network"
          );
        }
        throw this.createVocabularyError(
          `Connection failed (${response.status}): ${response.statusText}. Please check your internet connection and try again.`,
          "network"
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
        
        if (isDebugMode) {
          console.log("✅ Parsed vocabulary response:", {
            success: data.success,
            wordCount: data.words?.length || 0
          });
        }
      } catch (parseError) {
        if (isDebugMode) {
          console.error("❌ JSON parse error:", parseError);
        }
        throw this.createVocabularyError(
          "Invalid response format from server",
          "validation"
        );
      }

      if (!data.success && !data.words) {
        if (isDebugMode) {
          console.error("❌ API returned error:", data.error);
        }
        throw this.createVocabularyError(
          data.error || "Failed to generate vocabulary words",
          "generation"
        );
      }
      
      // Handle case where success is not explicitly true but words exist
      if (!data.words || !Array.isArray(data.words)) {
        if (isDebugMode) {
          console.error("❌ Invalid data structure received");
        }
        throw this.createVocabularyError(
          "Invalid vocabulary data received from server",
          "validation"
        );
      }

      // Validate response data
      if (!Array.isArray(data.words) || data.words.length === 0) {
        throw this.createVocabularyError(
          "Invalid vocabulary data received",
          "validation"
        );
      }

      return data.words;
    } catch (error) {
      // Only log detailed errors in debug mode
      const isDebugMode = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_VOCABULARY === 'true';
      
      if (isDebugMode) {
        console.error('❌ Vocabulary generation error:', {
          type: error?.constructor?.name,
          name: (error as any)?.name,
          message: (error as any)?.message
        });
      }

      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        throw this.createVocabularyError("Request was cancelled. Please try again.", "timeout");
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw this.createVocabularyError(
          "Network connection failed. Please check your internet connection.",
          "network"
        );
      }

      throw error;
    }
  }

  /**
   * Validate session data integrity
   */
  private validateSessionData(session: any): session is VocabularySession {
    if (!session || typeof session !== "object") {
      return false;
    }

    const required = [
      "sessionId",
      "studentId",
      "startTime",
      "currentPosition",
      "words",
      "isActive",
    ];
    for (const field of required) {
      if (!(field in session)) {
        return false;
      }
    }

    // Validate words array
    if (!Array.isArray(session.words)) {
      return false;
    }

    // Validate each word structure
    for (const word of session.words) {
      if (
        !word ||
        typeof word !== "object" ||
        !word.word ||
        !word.pronunciation ||
        !word.partOfSpeech ||
        !word.definition ||
        !word.exampleSentences
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Recover corrupted session data
   */
  private async recoverCorruptedSession(
    studentId: string
  ): Promise<VocabularySession | null> {
    try {
      // Try to get a backup from database
      const { data: sessions, error } = await supabase
        .from("vocabulary_sessions")
        .select("*")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(3);

      if (error || !sessions || sessions.length === 0) {
        return null;
      }

      // Find the first valid session
      for (const sessionData of sessions) {
        try {
          const session: VocabularySession = {
            sessionId: sessionData.id,
            studentId: sessionData.student_id,
            startTime: new Date(sessionData.start_time),
            currentPosition: sessionData.current_position,
            words: sessionData.words,
            isActive: sessionData.is_active,
          };

          if (this.validateSessionData(session)) {
            return session;
          }
        } catch (error) {
          console.warn("Failed to recover session:", sessionData.id, error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("Error recovering corrupted session:", error);
      return null;
    }
  }

  /**
   * Create a new vocabulary session with comprehensive error handling
   */
  async createSession(
    studentId: string,
    studentProfile: StudentVocabularyProfile,
    count: number = 20
  ): Promise<VocabularySession> {
    try {
      // Generate vocabulary with AI-only approach
      const { words, isUsingFallback } = await this.generateVocabularyWithAI(
        studentId,
        studentProfile,
        count,
        this.getSeenWords(studentId)
      );

      const sessionId = this.generateSessionId();
      const session: VocabularySession = {
        sessionId,
        studentId,
        startTime: new Date(),
        currentPosition: 0,
        words,
        isActive: true,
      };

      this.currentSession = session;
      this.sessionStartTime = new Date();
      this.isUsingFallback = isUsingFallback;

      // Save to localStorage immediately
      this.saveSessionToLocalStorage(session);

      // Save initial state to database (with retry)
      try {
        await this.retryWithBackoff(() => this.saveSessionToDatabase(session));
        // Update session statistics
        await this.updateSessionStatistics(studentId);
      } catch (error) {
        console.warn(
          "Failed to save session to database, continuing with local storage:",
          error
        );
        // Continue anyway - local storage is sufficient for basic functionality
      }

      return session;
    } catch (error) {
      const vocabularyError = this.createVocabularyError(error);

      console.error("Failed to create vocabulary session:", vocabularyError);
      throw vocabularyError;
    }
  }

  /**
   * Get current active session
   */
  getCurrentSession(): VocabularySession | null {
    return this.currentSession;
  }

  /**
   * Check if user can continue from last memory
   */
  async canContinueFromLastMemory(studentId: string): Promise<boolean> {
    try {
      // Check localStorage first for immediate response
      const localProgress = this.getProgressFromLocalStorage(studentId);
      if (
        localProgress &&
        this.isSessionRecoverable(localProgress.lastAccessTime)
      ) {
        return true;
      }

      // Check database for cross-device continuity
      const dbProgress = await this.getProgressFromDatabase(studentId);
      if (dbProgress && this.isSessionRecoverable(dbProgress.lastAccessTime)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking last memory:", error);
      return false;
    }
  }

  /**
   * Continue from last memory with comprehensive error handling
   */
  async continueFromLastMemory(
    studentId: string
  ): Promise<VocabularySession | null> {
    try {
      // Try localStorage first
      let progress = this.getProgressFromLocalStorage(studentId);
      let session = this.getSessionFromLocalStorage();

      // Validate local session data
      if (session && !this.validateSessionData(session)) {
        console.warn("Local session data is corrupted, clearing it");
        this.clearLocalSessionData();
        session = null;
        progress = null;
      }

      // Check if local session is valid and recent
      const hasValidLocalSession =
        progress &&
        session &&
        session.studentId === studentId &&
        this.isSessionRecoverable(progress.lastAccessTime);

      // Try database for cross-device continuity
      let dbProgress: SessionProgress | null = null;
      let dbSession: VocabularySession | null = null;

      try {
        dbProgress = await this.retryWithBackoff(
          () => this.getProgressFromDatabase(studentId),
          2
        );

        if (dbProgress) {
          dbSession = await this.retryWithBackoff(
            () => this.getSessionFromDatabase(dbProgress!.lastSessionId),
            2
          );

          // Validate database session
          if (dbSession && !this.validateSessionData(dbSession)) {
            console.warn("Database session data is corrupted");
            dbSession = await this.recoverCorruptedSession(studentId);
          }

          // Also check for any more recent active sessions
          const recentActiveSession = await this.getMostRecentActiveSession(
            studentId
          );
          if (
            recentActiveSession &&
            (!dbSession ||
              new Date(recentActiveSession.startTime) >
                new Date(dbSession.startTime))
          ) {
            if (this.validateSessionData(recentActiveSession)) {
              dbSession = recentActiveSession;
            }
          }
        }
      } catch (error) {
        console.warn("Failed to retrieve session from database:", error);
        // Continue with local session if available
      }

      // Determine which session to use (prioritize most recent and valid)
      let sessionToUse: VocabularySession | null = null;
      let progressToUse: SessionProgress | null = null;

      if (hasValidLocalSession && dbProgress) {
        // Both exist, use the one with more recent progress
        if (progress!.lastAccessTime > dbProgress.lastAccessTime) {
          sessionToUse = session;
          progressToUse = progress;
        } else {
          sessionToUse = dbSession;
          progressToUse = dbProgress;
        }
      } else if (hasValidLocalSession) {
        sessionToUse = session;
        progressToUse = progress;
      } else if (
        dbSession &&
        dbProgress &&
        this.isSessionRecoverable(dbProgress.lastAccessTime)
      ) {
        sessionToUse = dbSession;
        progressToUse = dbProgress;
      }

      if (!sessionToUse || !progressToUse) {
        return null;
      }

      // Final validation before restoring
      if (!this.validateSessionData(sessionToUse)) {
        console.error("Session data validation failed during recovery");
        return null;
      }

      // Restore session state
      sessionToUse.currentPosition = Math.max(
        0,
        Math.min(progressToUse.lastPosition, sessionToUse.words.length - 1)
      );
      sessionToUse.isActive = true;

      this.currentSession = sessionToUse;
      this.sessionStartTime = new Date();
      this.isUsingFallback = false; // Reset fallback flag

      // Update localStorage with restored session for faster future access
      this.saveSessionToLocalStorage(sessionToUse);
      this.saveProgressToLocalStorage();

      // Update database to mark session as active (with error handling)
      try {
        await this.retryWithBackoff(
          () => this.saveSessionToDatabase(sessionToUse!),
          2
        );
      } catch (error) {
        console.warn(
          "Failed to update session in database, continuing with local storage:",
          error
        );
      }

      return sessionToUse;
    } catch (error) {
      console.error("Error continuing from last memory:", error);

      // Try to recover from corruption
      try {
        const recoveredSession = await this.recoverCorruptedSession(studentId);
        if (recoveredSession) {
          console.log("Successfully recovered corrupted session");
          this.currentSession = recoveredSession;
          this.sessionStartTime = new Date();
          return recoveredSession;
        }
      } catch (recoveryError) {
        console.error("Failed to recover corrupted session:", recoveryError);
      }

      return null;
    }
  }

  /**
   * Navigate to next word
   */
  async navigateNext(): Promise<VocabularyCardData | null> {
    if (
      !this.currentSession ||
      this.currentSession.currentPosition >=
        this.currentSession.words.length - 1
    ) {
      return null;
    }

    // Record interaction for current word before moving
    const currentWord =
      this.currentSession.words[this.currentSession.currentPosition];
    if (currentWord) {
      await this.recordWordInteraction(currentWord, "seen");
    }

    this.currentSession.currentPosition++;
    await this.updateSessionProgress();

    // Start prefetching if we're halfway through
    this.startPrefetching();

    return this.currentSession.words[this.currentSession.currentPosition];
  }

  /**
   * Navigate to previous word
   */
  async navigatePrevious(): Promise<VocabularyCardData | null> {
    if (!this.currentSession || this.currentSession.currentPosition <= 0) {
      return null;
    }

    this.currentSession.currentPosition--;
    await this.updateSessionProgress();

    return this.currentSession.words[this.currentSession.currentPosition];
  }

  /**
   * Record word interaction for learning analytics
   */
  private async recordWordInteraction(
    word: VocabularyCardData,
    interactionType: "seen" | "mastered" | "struggled",
    masteryScore?: number
  ): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Get student profile to determine difficulty level
      const studentProfile = this.getStudentProfileFromSession(
        this.currentSession
      );
      const difficultyLevel = studentProfile?.proficiencyLevel || "B1";

      // Temporarily disable infinite vocabulary interaction recording
      // await infiniteVocabularyService.recordVocabularyInteraction(
      //   this.currentSession.studentId,
      //   word.word,
      //   difficultyLevel,
      //   interactionType,
      //   masteryScore
      // );
    } catch (error) {
      console.error("Error recording word interaction:", error);
    }
  }

  /**
   * Get current word
   */
  getCurrentWord(): VocabularyCardData | null {
    if (!this.currentSession || this.currentSession.words.length === 0) {
      return null;
    }

    return this.currentSession.words[this.currentSession.currentPosition];
  }

  /**
   * Get session progress information
   */
  getSessionProgress(): { current: number; total: number; percentage: number } {
    if (!this.currentSession) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const current = this.currentSession.currentPosition + 1;
    const total = this.currentSession.words.length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  }

  /**
   * Add seen word to history
   */
  async addSeenWord(word: string, studentId: string): Promise<void> {
    try {
      // Update local storage
      const seenWords = this.getSeenWordsFromLocalStorage(studentId);
      if (!seenWords.includes(word)) {
        seenWords.push(word);
        localStorage.setItem(
          `${VOCABULARY_SEEN_WORDS_KEY}_${studentId}`,
          JSON.stringify(seenWords)
        );
      }

      // Update database
      await this.updateSeenWordsInDatabase(studentId, word);
    } catch (error) {
      console.error("Error adding seen word:", error);
    }
  }

  /**
   * Get seen words for student
   */
  getSeenWords(studentId: string): string[] {
    return this.getSeenWordsFromLocalStorage(studentId);
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      // Mark session as inactive
      this.currentSession.isActive = false;

      // Save final progress
      await this.saveProgressToDatabase();
      await this.saveSessionToDatabase(this.currentSession);

      // Clear current session
      this.currentSession = null;
      this.sessionStartTime = null;

      // Clear progress tracking interval
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = null;
      }
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }

  /**
   * Recover session after page refresh
   */
  async recoverSession(studentId: string): Promise<VocabularySession | null> {
    try {
      // Try to recover from localStorage first
      const session = this.getSessionFromLocalStorage();
      const progress = this.getProgressFromLocalStorage(studentId);

      if (session && progress && session.studentId === studentId) {
        // Check if session is still valid (not too old)
        if (this.isSessionRecoverable(progress.lastAccessTime)) {
          this.currentSession = session;
          this.sessionStartTime = new Date();

          // Sync with database to ensure cross-device continuity
          await this.syncSessionWithDatabase(session);

          return session;
        }
      }

      // If localStorage recovery fails, try database
      return await this.continueFromLastMemory(studentId);
    } catch (error) {
      console.error("Error recovering session:", error);
      return null;
    }
  }

  /**
   * Sync local session with database for cross-device continuity
   */
  private async syncSessionWithDatabase(
    localSession: VocabularySession
  ): Promise<void> {
    try {
      // Get the latest session from database
      const dbSession = await this.getSessionFromDatabase(
        localSession.sessionId
      );

      if (
        dbSession &&
        dbSession.currentPosition > localSession.currentPosition
      ) {
        // Database has more recent progress, update local session
        localSession.currentPosition = dbSession.currentPosition;
        this.currentSession = localSession;
        this.saveSessionToLocalStorage(localSession);
      } else if (
        localSession.currentPosition > (dbSession?.currentPosition || 0)
      ) {
        // Local session is more recent, update database
        await this.saveSessionToDatabase(localSession);
      }
    } catch (error) {
      console.error("Error syncing session with database:", error);
      // Continue with local session if sync fails
    }
  }

  /**
   * Clear all session data for student
   */
  async clearSessionData(studentId: string): Promise<void> {
    try {
      // Clear localStorage
      this.clearLocalSessionData();
      localStorage.removeItem(`${VOCABULARY_PROGRESS_KEY}_${studentId}`);
      localStorage.removeItem(`${VOCABULARY_SEEN_WORDS_KEY}_${studentId}`);

      // Clear current session
      this.currentSession = null;
      this.sessionStartTime = null;
      this.isUsingFallback = false;
      this.retryCount = 0;

      // Note: We don't clear database data as it's useful for long-term tracking
    } catch (error) {
      console.error("Error clearing session data:", error);
    }
  }

  /**
   * Clear local session data only
   */
  private clearLocalSessionData(): void {
    try {
      localStorage.removeItem(VOCABULARY_SESSION_KEY);
    } catch (error) {
      console.error("Error clearing local session data:", error);
    }
  }

  /**
   * Get current error state
   */
  getErrorState(): {
    hasError: boolean;
    error: VocabularyError | null;
    canRetry: boolean;
    canUseFallback: boolean;
  } {
    return {
      hasError: this.retryCount > 0,
      error: null, // Would need to store last error
      canRetry: this.retryCount < this.maxRetries,
      canUseFallback: !this.isUsingFallback,
    };
  }

  /**
   * Reset error state
   */
  resetErrorState(): void {
    this.retryCount = 0;
  }

  /**
   * Check if currently using fallback vocabulary
   */
  isUsingFallbackVocabulary(): boolean {
    return this.isUsingFallback;
  }

  /**
   * Cleanup resources and cancel ongoing operations
   */
  cleanup(): void {
    // Cancel prefetch operations
    if (this.prefetchController) {
      this.prefetchController.abort();
      this.prefetchController = null;
    }

    // Clear prefetch queue
    this.prefetchQueue.clear();

    // Clear progress tracking interval
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = null;
    }

    // Save current session progress before cleanup
    if (this.currentSession) {
      this.saveProgressToLocalStorage();
    }
  }

  /**
   * Clear vocabulary cache
   */
  clearCache(): void {
    this.vocabularyCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.vocabularyCache.size,
      keys: Array.from(this.vocabularyCache.keys()),
    };
  }

  // Private helper methods

  private generateSessionId(): string {
    return `vocab_session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  private isSessionRecoverable(lastAccessTime: Date): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - lastAccessTime.getTime();
    return timeDiff < SESSION_RECOVERY_TIMEOUT;
  }

  private async updateSessionProgress(): Promise<void> {
    if (!this.currentSession) return;

    // Update localStorage immediately
    this.saveSessionToLocalStorage(this.currentSession);
    this.saveProgressToLocalStorage();
  }

  private saveSessionToLocalStorage(session: VocabularySession): void {
    try {
      localStorage.setItem(
        VOCABULARY_SESSION_KEY,
        JSON.stringify({
          ...session,
          startTime: session.startTime.toISOString(),
        })
      );
    } catch (error) {
      console.error("Error saving session to localStorage:", error);
    }
  }

  private getSessionFromLocalStorage(): VocabularySession | null {
    try {
      const sessionData = localStorage.getItem(VOCABULARY_SESSION_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
      };
    } catch (error) {
      console.error("Error getting session from localStorage:", error);
      return null;
    }
  }

  private saveProgressToLocalStorage(): void {
    if (!this.currentSession || !this.sessionStartTime) return;

    try {
      const progress: SessionProgress = {
        studentId: this.currentSession.studentId,
        lastSessionId: this.currentSession.sessionId,
        lastPosition: this.currentSession.currentPosition,
        lastAccessTime: new Date(),
        totalWordsStudied: this.currentSession.currentPosition + 1,
        sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      };

      localStorage.setItem(
        `${VOCABULARY_PROGRESS_KEY}_${this.currentSession.studentId}`,
        JSON.stringify({
          ...progress,
          lastAccessTime: progress.lastAccessTime.toISOString(),
        })
      );
    } catch (error) {
      console.error("Error saving progress to localStorage:", error);
    }
  }

  private getProgressFromLocalStorage(
    studentId: string
  ): SessionProgress | null {
    try {
      const progressData = localStorage.getItem(
        `${VOCABULARY_PROGRESS_KEY}_${studentId}`
      );
      if (!progressData) return null;

      const parsed = JSON.parse(progressData);
      return {
        ...parsed,
        lastAccessTime: new Date(parsed.lastAccessTime),
      };
    } catch (error) {
      console.error("Error getting progress from localStorage:", error);
      return null;
    }
  }

  private getSeenWordsFromLocalStorage(studentId: string): string[] {
    try {
      const seenWordsData = localStorage.getItem(
        `${VOCABULARY_SEEN_WORDS_KEY}_${studentId}`
      );
      return seenWordsData ? JSON.parse(seenWordsData) : [];
    } catch (error) {
      console.error("Error getting seen words from localStorage:", error);
      return [];
    }
  }

  private async saveSessionToDatabase(
    session: VocabularySession
  ): Promise<void> {
    try {
      console.log("Saving session to database:", {
        id: session.sessionId,
        student_id: session.studentId,
        wordsCount: session.words.length,
        isActive: session.isActive,
      }); // Debug log

      const { error } = await supabase.from("vocabulary_sessions").upsert({
        id: session.sessionId,
        student_id: session.studentId,
        start_time: session.startTime.toISOString(),
        current_position: session.currentPosition,
        words: session.words,
        is_active: session.isActive,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving session to database:", error);
      } else {
        console.log("Session saved successfully to database"); // Debug log
      }
    } catch (error) {
      console.error("Error saving session to database:", error);
    }
  }

  private async getSessionFromDatabase(
    sessionId: string
  ): Promise<VocabularySession | null> {
    try {
      const { data, error } = await supabase
        .from("vocabulary_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        sessionId: data.id,
        studentId: data.student_id,
        startTime: new Date(data.start_time),
        currentPosition: data.current_position,
        words: data.words,
        isActive: data.is_active,
      };
    } catch (error) {
      console.error("Error getting session from database:", error);
      return null;
    }
  }

  private async saveProgressToDatabase(): Promise<void> {
    if (!this.currentSession || !this.sessionStartTime) return;

    try {
      const progress: SessionProgress = {
        studentId: this.currentSession.studentId,
        lastSessionId: this.currentSession.sessionId,
        lastPosition: this.currentSession.currentPosition,
        lastAccessTime: new Date(),
        totalWordsStudied: this.currentSession.currentPosition + 1,
        sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      };

      const { error } = await supabase.from("vocabulary_progress").upsert({
        student_id: progress.studentId,
        last_session_id: progress.lastSessionId,
        last_position: progress.lastPosition,
        last_access_time: progress.lastAccessTime.toISOString(),
        total_words_studied: progress.totalWordsStudied,
        session_duration: progress.sessionDuration,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving progress to database:", error);
      }
    } catch (error) {
      console.error("Error saving progress to database:", error);
    }
  }

  private async getProgressFromDatabase(
    studentId: string
  ): Promise<SessionProgress | null> {
    try {
      const { data, error } = await supabase
        .from("vocabulary_progress")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        studentId: data.student_id,
        lastSessionId: data.last_session_id,
        lastPosition: data.last_position,
        lastAccessTime: new Date(data.last_access_time),
        totalWordsStudied: data.total_words_studied,
        sessionDuration: data.session_duration,
      };
    } catch (error) {
      console.error("Error getting progress from database:", error);
      return null;
    }
  }

  /**
   * Get most recent active session for cross-device continuity
   */
  private async getMostRecentActiveSession(
    studentId: string
  ): Promise<VocabularySession | null> {
    try {
      const { data, error } = await supabase
        .from("vocabulary_sessions")
        .select("*")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        sessionId: data.id,
        studentId: data.student_id,
        startTime: new Date(data.start_time),
        currentPosition: data.current_position,
        words: data.words,
        isActive: data.is_active,
      };
    } catch (error) {
      console.error("Error getting most recent active session:", error);
      return null;
    }
  }

  private async updateSeenWordsInDatabase(
    studentId: string,
    word: string
  ): Promise<void> {
    try {
      // Get current seen words
      const { data: existingData } = await supabase
        .from("vocabulary_progress")
        .select("seen_words")
        .eq("student_id", studentId)
        .single();

      const currentSeenWords = existingData?.seen_words || [];

      if (!currentSeenWords.includes(word)) {
        const updatedSeenWords = [...currentSeenWords, word];

        const { error } = await supabase.from("vocabulary_progress").upsert({
          student_id: studentId,
          seen_words: updatedSeenWords,
          total_words_studied: updatedSeenWords.length, // Update total count
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error updating seen words in database:", error);
        }
      }
    } catch (error) {
      console.error("Error updating seen words in database:", error);
    }
  }

  /**
   * Clean up old sessions from database (housekeeping)
   */
  async cleanupOldSessions(
    studentId: string,
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);

      const { error } = await supabase
        .from("vocabulary_sessions")
        .delete()
        .eq("student_id", studentId)
        .eq("is_active", false)
        .lt("updated_at", cutoffDate.toISOString());

      if (error) {
        console.error("Error cleaning up old sessions:", error);
      }
    } catch (error) {
      console.error("Error cleaning up old sessions:", error);
    }
  }

  /**
   * Update session statistics when a new session is created
   */
  private async updateSessionStatistics(studentId: string): Promise<void> {
    try {
      // Get current session count
      const { data: sessions } = await supabase
        .from("vocabulary_sessions")
        .select("id")
        .eq("student_id", studentId);

      const totalSessions = sessions?.length || 0;

      // Update progress with session count
      const { error } = await supabase.from("vocabulary_progress").upsert({
        student_id: studentId,
        total_sessions: totalSessions,
        last_access_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error updating session statistics:", error);
      }
    } catch (error) {
      console.error("Error updating session statistics:", error);
    }
  }

  /**
   * Get session statistics for analytics
   */
  async getSessionStatistics(studentId: string): Promise<{
    totalSessions: number;
    totalWordsStudied: number;
    averageSessionDuration: number;
    lastSessionDate: Date | null;
  }> {
    try {
      console.log("Getting session statistics for student:", studentId); // Debug log

      // Get all sessions (both active and inactive)
      const { data: sessions, error } = await supabase
        .from("vocabulary_sessions")
        .select("start_time, current_position, words, is_active")
        .eq("student_id", studentId)
        .order("start_time", { ascending: false });

      console.log("Sessions query result:", { sessions, error }); // Debug log

      if (error) {
        console.error("Error getting session statistics:", error);
        return {
          totalSessions: 0,
          totalWordsStudied: 0,
          averageSessionDuration: 0,
          lastSessionDate: null,
        };
      }

      const { data: progress } = await supabase
        .from("vocabulary_progress")
        .select(
          "total_words_studied, session_duration, last_access_time, total_sessions"
        )
        .eq("student_id", studentId)
        .single();

      console.log("Progress query result:", progress); // Debug log

      // Calculate stats from sessions if progress table is empty
      const totalSessions = sessions?.length || 0;
      const totalWordsStudied =
        sessions?.reduce((total, session) => {
          return total + (session.words?.length || 0);
        }, 0) || 0;

      console.log("Calculated stats:", { totalSessions, totalWordsStudied }); // Debug log

      return {
        totalSessions: progress?.total_sessions || totalSessions,
        totalWordsStudied: progress?.total_words_studied || totalWordsStudied,
        averageSessionDuration: progress?.session_duration || 0,
        lastSessionDate: progress?.last_access_time
          ? new Date(progress.last_access_time)
          : sessions?.[0]?.start_time
          ? new Date(sessions[0].start_time)
          : null,
      };
    } catch (error) {
      console.error("Error getting session statistics:", error);
      return {
        totalSessions: 0,
        totalWordsStudied: 0,
        averageSessionDuration: 0,
        lastSessionDate: null,
      };
    }
  }
}

// Export singleton instance
export const vocabularySessionManager = new VocabularySessionManager();

// Export utility functions for React components
export const useVocabularySession = () => {
  return vocabularySessionManager;
};
