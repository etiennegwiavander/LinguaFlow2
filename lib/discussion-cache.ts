import { DiscussionTopic, Question } from "@/types";

// Cache keys
const CACHE_KEYS = {
  TOPICS: "discussion_topics_cache",
  QUESTIONS: "discussion_questions_cache",
  TOPIC_METADATA: "discussion_topic_metadata_cache",
} as const;

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  TOPICS: 30 * 60 * 1000, // 30 minutes
  QUESTIONS: 60 * 60 * 1000, // 1 hour
  METADATA: 24 * 60 * 60 * 1000, // 24 hours
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface TopicMetadata {
  topicId: string;
  questionCount: number;
  lastGenerated: number;
  studentId: string;
  level: string;
}

interface QuestionsCacheData {
  [topicId: string]: Question[];
}

interface TopicsCacheData {
  [studentId: string]: DiscussionTopic[];
}

interface MetadataCacheData {
  [topicId: string]: TopicMetadata;
}

/**
 * Generic cache utility functions
 */
class CacheManager {
  private isClient = typeof window !== "undefined";

  private getStorageKey(key: string): string {
    return `linguaflow_${key}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private createCacheEntry<T>(data: T, expirationMs: number): CacheEntry<T> {
    const timestamp = Date.now();
    return {
      data,
      timestamp,
      expiresAt: timestamp + expirationMs,
    };
  }

  private getFromStorage<T>(key: string): CacheEntry<T> | null {
    if (!this.isClient) return null;

    try {
      const stored = localStorage.getItem(this.getStorageKey(key));
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);

      if (this.isExpired(entry)) {
        this.removeFromStorage(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.warn(`Failed to read from cache (${key}):`, error);
      this.removeFromStorage(key);
      return null;
    }
  }

  private setToStorage<T>(key: string, data: T, expirationMs: number): void {
    if (!this.isClient) return;

    try {
      const entry = this.createCacheEntry(data, expirationMs);
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn(`Failed to write to cache (${key}):`, error);
      // If storage is full, try to clear old entries
      this.clearExpiredEntries();
    }
  }

  private removeFromStorage(key: string): void {
    if (!this.isClient) return;

    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.warn(`Failed to remove from cache (${key}):`, error);
    }
  }

  /**
   * Clear all expired cache entries
   */
  clearExpiredEntries(): void {
    if (!this.isClient) return;

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("linguaflow_")) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const entry = JSON.parse(stored);
              if (this.isExpired(entry)) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Invalid entry, mark for removal
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));

      if (keysToRemove.length > 0) {
        console.log(`Cleared ${keysToRemove.length} expired cache entries`);
      }
    } catch (error) {
      console.warn("Failed to clear expired cache entries:", error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAllCache(): void {
    if (!this.isClient) return;

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("linguaflow_")) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log(`Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    expiredEntries: number;
  } {
    if (!this.isClient) {
      return { totalEntries: 0, totalSize: 0, expiredEntries: 0 };
    }

    let totalEntries = 0;
    let totalSize = 0;
    let expiredEntries = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("linguaflow_")) {
          totalEntries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
            try {
              const entry = JSON.parse(value);
              if (this.isExpired(entry)) {
                expiredEntries++;
              }
            } catch {
              expiredEntries++;
            }
          }
        }
      }
    } catch (error) {
      console.warn("Failed to get cache stats:", error);
    }

    return { totalEntries, totalSize, expiredEntries };
  }

  // Topics cache methods
  getTopicsCache(studentId: string): DiscussionTopic[] | null {
    const entry = this.getFromStorage<TopicsCacheData>(CACHE_KEYS.TOPICS);
    return entry?.data[studentId] || null;
  }

  setTopicsCache(studentId: string, topics: DiscussionTopic[]): void {
    const existing = this.getFromStorage<TopicsCacheData>(CACHE_KEYS.TOPICS);
    const data: TopicsCacheData = existing?.data || {};
    data[studentId] = topics;
    this.setToStorage(CACHE_KEYS.TOPICS, data, CACHE_EXPIRATION.TOPICS);
  }

  // Questions cache methods
  getQuestionsCache(topicId: string): Question[] | null {
    const entry = this.getFromStorage<QuestionsCacheData>(CACHE_KEYS.QUESTIONS);
    return entry?.data[topicId] || null;
  }

  setQuestionsCache(topicId: string, questions: Question[]): void {
    const existing = this.getFromStorage<QuestionsCacheData>(
      CACHE_KEYS.QUESTIONS
    );
    const data: QuestionsCacheData = existing?.data || {};
    data[topicId] = questions;
    this.setToStorage(CACHE_KEYS.QUESTIONS, data, CACHE_EXPIRATION.QUESTIONS);
  }

  // Topic metadata cache methods
  getTopicMetadata(topicId: string): TopicMetadata | null {
    const entry = this.getFromStorage<MetadataCacheData>(
      CACHE_KEYS.TOPIC_METADATA
    );
    return entry?.data[topicId] || null;
  }

  setTopicMetadata(metadata: TopicMetadata): void {
    const existing = this.getFromStorage<MetadataCacheData>(
      CACHE_KEYS.TOPIC_METADATA
    );
    const data: MetadataCacheData = existing?.data || {};
    data[metadata.topicId] = metadata;
    this.setToStorage(
      CACHE_KEYS.TOPIC_METADATA,
      data,
      CACHE_EXPIRATION.METADATA
    );
  }

  // Utility methods for cache invalidation
  invalidateTopicsCache(studentId: string): void {
    const existing = this.getFromStorage<TopicsCacheData>(CACHE_KEYS.TOPICS);
    if (existing?.data[studentId]) {
      delete existing.data[studentId];
      this.setToStorage(
        CACHE_KEYS.TOPICS,
        existing.data,
        CACHE_EXPIRATION.TOPICS
      );
    }
  }

  invalidateQuestionsCache(topicId: string): void {
    const existing = this.getFromStorage<QuestionsCacheData>(
      CACHE_KEYS.QUESTIONS
    );
    if (existing?.data[topicId]) {
      delete existing.data[topicId];
      this.setToStorage(
        CACHE_KEYS.QUESTIONS,
        existing.data,
        CACHE_EXPIRATION.QUESTIONS
      );
    }
  }

  invalidateTopicMetadata(topicId: string): void {
    const existing = this.getFromStorage<MetadataCacheData>(
      CACHE_KEYS.TOPIC_METADATA
    );
    if (existing?.data[topicId]) {
      delete existing.data[topicId];
      this.setToStorage(
        CACHE_KEYS.TOPIC_METADATA,
        existing.data,
        CACHE_EXPIRATION.METADATA
      );
    }
  }

  // Check if questions need refresh based on metadata
  shouldRefreshQuestions(
    topicId: string,
    currentQuestionCount: number
  ): boolean {
    const metadata = this.getTopicMetadata(topicId);
    if (!metadata) return true;

    // Refresh if question count has changed significantly
    if (Math.abs(metadata.questionCount - currentQuestionCount) > 2) {
      return true;
    }

    // Refresh if it's been more than 24 hours since last generation
    const daysSinceGeneration =
      (Date.now() - metadata.lastGenerated) / (24 * 60 * 60 * 1000);
    return daysSinceGeneration > 1;
  }

  // Force refresh questions (for system updates)
  forceRefreshQuestions(topicId: string): void {
    this.invalidateQuestionsCache(topicId);
    this.invalidateTopicMetadata(topicId);
  }

  // Clear all questions cache (for system-wide updates)
  clearAllQuestionsCache(): void {
    if (!this.isClient) return;

    try {
      this.removeFromStorage(CACHE_KEYS.QUESTIONS);
      this.removeFromStorage(CACHE_KEYS.TOPIC_METADATA);
      console.log('Cleared all questions cache');
    } catch (error) {
      console.warn('Failed to clear questions cache:', error);
    }
  }

  // Update metadata after successful operations
  updateTopicMetadata(
    topicId: string,
    questionCount: number,
    studentId: string,
    level: string
  ): void {
    this.setTopicMetadata({
      topicId,
      questionCount,
      lastGenerated: Date.now(),
      studentId,
      level,
    });
  }
}

// Export singleton instance
export const discussionCache = new CacheManager();

// Export utility functions for easier use (bound to maintain 'this' context)
export const getTopicsCache =
  discussionCache.getTopicsCache.bind(discussionCache);
export const setTopicsCache =
  discussionCache.setTopicsCache.bind(discussionCache);
export const getQuestionsCache =
  discussionCache.getQuestionsCache.bind(discussionCache);
export const setQuestionsCache =
  discussionCache.setQuestionsCache.bind(discussionCache);
export const getTopicMetadata =
  discussionCache.getTopicMetadata.bind(discussionCache);
export const setTopicMetadata =
  discussionCache.setTopicMetadata.bind(discussionCache);
export const invalidateTopicsCache =
  discussionCache.invalidateTopicsCache.bind(discussionCache);
export const invalidateQuestionsCache =
  discussionCache.invalidateQuestionsCache.bind(discussionCache);
export const invalidateTopicMetadata =
  discussionCache.invalidateTopicMetadata.bind(discussionCache);
export const shouldRefreshQuestions =
  discussionCache.shouldRefreshQuestions.bind(discussionCache);
export const updateTopicMetadata =
  discussionCache.updateTopicMetadata.bind(discussionCache);
export const clearExpiredEntries =
  discussionCache.clearExpiredEntries.bind(discussionCache);
export const clearAllCache =
  discussionCache.clearAllCache.bind(discussionCache);
export const getCacheStats =
  discussionCache.getCacheStats.bind(discussionCache);
export const forceRefreshQuestions =
  discussionCache.forceRefreshQuestions.bind(discussionCache);
export const clearAllQuestionsCache =
  discussionCache.clearAllQuestionsCache.bind(discussionCache);

// Auto-cleanup expired entries on module load
if (typeof window !== "undefined") {
  // Clear expired entries when the module loads
  setTimeout(() => {
    discussionCache.clearExpiredEntries();
  }, 1000);

  // Set up periodic cleanup (every 30 minutes)
  setInterval(() => {
    discussionCache.clearExpiredEntries();
  }, 30 * 60 * 1000);
}
