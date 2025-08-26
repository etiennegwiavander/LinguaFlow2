/**
 * Performance monitoring utilities for vocabulary flashcards
 */

export interface VocabularyPerformanceMetrics {
  renderTime: number;
  cacheHitRate: number;
  prefetchSuccess: number;
  animationFrameRate: number;
  memoryUsage: number;
}

export class VocabularyPerformanceMonitor {
  private static instance: VocabularyPerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private prefetchAttempts = 0;
  private prefetchSuccesses = 0;

  static getInstance(): VocabularyPerformanceMonitor {
    if (!VocabularyPerformanceMonitor.instance) {
      VocabularyPerformanceMonitor.instance = new VocabularyPerformanceMonitor();
    }
    return VocabularyPerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTiming(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  /**
   * End timing an operation and record the duration
   */
  endTiming(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operation);

    // Store the metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);

    // Keep only last 100 measurements to prevent memory leaks
    const measurements = this.metrics.get(operation)!;
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100);
    }

    return duration;
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Record a prefetch attempt
   */
  recordPrefetchAttempt(): void {
    this.prefetchAttempts++;
  }

  /**
   * Record a successful prefetch
   */
  recordPrefetchSuccess(): void {
    this.prefetchSuccesses++;
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const measurements = this.metrics.get(operation);
    if (!measurements || measurements.length === 0) {
      return 0;
    }

    const sum = measurements.reduce((acc, val) => acc + val, 0);
    return sum / measurements.length;
  }

  /**
   * Get cache hit rate as a percentage
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;
    return (this.cacheHits / total) * 100;
  }

  /**
   * Get prefetch success rate as a percentage
   */
  getPrefetchSuccessRate(): number {
    if (this.prefetchAttempts === 0) return 0;
    return (this.prefetchSuccesses / this.prefetchAttempts) * 100;
  }

  /**
   * Get current memory usage (if available)
   */
  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): VocabularyPerformanceMetrics {
    return {
      renderTime: this.getAverageDuration('card-render'),
      cacheHitRate: this.getCacheHitRate(),
      prefetchSuccess: this.getPrefetchSuccessRate(),
      animationFrameRate: this.getAverageDuration('animation-frame'),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Log performance summary to console (development only)
   */
  logPerformanceSummary(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const metrics = this.getMetrics();
    console.group('🚀 Vocabulary Flashcards Performance Metrics');
    console.log(`📊 Average render time: ${metrics.renderTime.toFixed(2)}ms`);
    console.log(`💾 Cache hit rate: ${metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`⚡ Prefetch success rate: ${metrics.prefetchSuccess.toFixed(1)}%`);
    console.log(`🎬 Animation frame rate: ${metrics.animationFrameRate.toFixed(2)}ms`);
    console.log(`🧠 Memory usage: ${metrics.memoryUsage.toFixed(2)}MB`);
    console.groupEnd();
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.prefetchAttempts = 0;
    this.prefetchSuccesses = 0;
  }

  /**
   * Monitor React component render performance
   */
  withRenderTiming<T extends any>(
    Component: T,
    componentName: string
  ): T {
    // Note: This method would need proper React imports to work
    // For now, return the component as-is to avoid build errors
    return Component;
  }
}

// Export singleton instance
export const vocabularyPerformanceMonitor = VocabularyPerformanceMonitor.getInstance();

// Development-only performance logging
if (process.env.NODE_ENV === 'development') {
  // Log performance summary every 30 seconds
  setInterval(() => {
    vocabularyPerformanceMonitor.logPerformanceSummary();
  }, 30000);
}