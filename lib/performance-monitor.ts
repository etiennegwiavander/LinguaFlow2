/**
 * Enhanced performance monitoring utility for tracking operation times,
 * component render performance, and database operations
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
  category?: 'database' | 'ai' | 'component' | 'network' | 'cache';
}

interface ComponentRenderMetric {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

interface DatabaseMetric {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, number> = new Map();
  private componentMetrics: Map<string, ComponentRenderMetric> = new Map();
  private databaseMetrics: DatabaseMetric[] = [];
  private memoryUsage: number[] = [];
  private renderWarningThreshold = 16; // 16ms for 60fps

  /**
   * Start timing an operation
   */
  startTimer(operation: string, metadata?: Record<string, any>, category?: PerformanceMetric['category']): void {
    const startTime = performance.now();
    const timerKey = `${operation}_${category || 'general'}`;
    this.activeTimers.set(timerKey, startTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Started timing: ${operation}`, { category, ...metadata });
    }
  }

  /**
   * End timing an operation and record the metric
   */
  endTimer(operation: string, metadata?: Record<string, any>, category?: PerformanceMetric['category']): number {
    const timerKey = `${operation}_${category || 'general'}`;
    const startTime = this.activeTimers.get(timerKey);
    if (!startTime) {
      console.warn(`⚠️ No start time found for operation: ${operation} (${category})`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.activeTimers.delete(timerKey);
    
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
      category
    };
    
    this.metrics.push(metric);
    
    // Keep only last 200 metrics to prevent memory leaks
    if (this.metrics.length > 200) {
      this.metrics = this.metrics.slice(-200);
    }
    
    if (process.env.NODE_ENV === 'development') {
      const categoryIcon = this.getCategoryIcon(category);
      console.log(`${categoryIcon} Completed: ${operation} in ${duration.toFixed(2)}ms`, { category, ...metadata });
      
      // Category-specific warnings
      const threshold = this.getThresholdForCategory(category);
      if (duration > threshold) {
        console.warn(`🐌 Slow ${category || 'operation'} detected: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
      }
    }
    
    return duration;
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderTime;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime
      });
    }

    // Warn about slow renders
    if (process.env.NODE_ENV === 'development' && renderTime > this.renderWarningThreshold) {
      console.warn(`🎨 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms (threshold: ${this.renderWarningThreshold}ms)`);
    }
  }

  /**
   * Track database operation performance
   */
  trackDatabaseOperation(query: string, duration: number, success: boolean, errorMessage?: string): void {
    const metric: DatabaseMetric = {
      query,
      duration,
      timestamp: Date.now(),
      success,
      errorMessage
    };

    this.databaseMetrics.push(metric);

    // Keep only last 100 database metrics
    if (this.databaseMetrics.length > 100) {
      this.databaseMetrics = this.databaseMetrics.slice(-100);
    }

    if (process.env.NODE_ENV === 'development') {
      const icon = success ? '🗄️' : '❌';
      console.log(`${icon} Database: ${query} in ${duration.toFixed(2)}ms`, { success, errorMessage });
      
      if (duration > 1000) {
        console.warn(`🐌 Slow database query: ${query} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      this.memoryUsage.push(usedMB);
      
      // Keep only last 50 memory readings
      if (this.memoryUsage.length > 50) {
        this.memoryUsage = this.memoryUsage.slice(-50);
      }

      if (process.env.NODE_ENV === 'development' && usedMB > 100) {
        console.warn(`🧠 High memory usage: ${usedMB.toFixed(2)}MB`);
      }
    }
  }

  private getCategoryIcon(category?: PerformanceMetric['category']): string {
    switch (category) {
      case 'database': return '🗄️';
      case 'ai': return '🤖';
      case 'component': return '🎨';
      case 'network': return '🌐';
      case 'cache': return '💾';
      default: return '✅';
    }
  }

  private getThresholdForCategory(category?: PerformanceMetric['category']): number {
    switch (category) {
      case 'database': return 1000; // 1 second
      case 'ai': return 5000; // 5 seconds
      case 'component': return 16; // 16ms for 60fps
      case 'network': return 3000; // 3 seconds
      case 'cache': return 100; // 100ms
      default: return 2000; // 2 seconds
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getStats(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
    recentMetrics: PerformanceMetric[];
    componentStats: ComponentRenderMetric[];
    databaseStats: {
      totalQueries: number;
      successRate: number;
      averageDuration: number;
      slowestQuery: DatabaseMetric | null;
    };
    memoryStats: {
      current: number;
      average: number;
      peak: number;
    };
    categoryBreakdown: Record<string, { count: number; averageDuration: number }>;
  } {
    const stats = {
      totalOperations: this.metrics.length,
      averageDuration: 0,
      slowestOperation: null as PerformanceMetric | null,
      fastestOperation: null as PerformanceMetric | null,
      recentMetrics: this.metrics.slice(-10),
      componentStats: Array.from(this.componentMetrics.values()),
      databaseStats: {
        totalQueries: this.databaseMetrics.length,
        successRate: 0,
        averageDuration: 0,
        slowestQuery: null as DatabaseMetric | null
      },
      memoryStats: {
        current: 0,
        average: 0,
        peak: 0
      },
      categoryBreakdown: {} as Record<string, { count: number; averageDuration: number }>
    };

    if (this.metrics.length > 0) {
      const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
      stats.averageDuration = totalDuration / this.metrics.length;
      
      const sortedByDuration = [...this.metrics].sort((a, b) => a.duration - b.duration);
      stats.slowestOperation = sortedByDuration[sortedByDuration.length - 1];
      stats.fastestOperation = sortedByDuration[0];

      // Category breakdown
      const categoryMap = new Map<string, { durations: number[]; count: number }>();
      this.metrics.forEach(metric => {
        const category = metric.category || 'general';
        const existing = categoryMap.get(category) || { durations: [], count: 0 };
        existing.durations.push(metric.duration);
        existing.count++;
        categoryMap.set(category, existing);
      });

      categoryMap.forEach((data, category) => {
        const averageDuration = data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length;
        stats.categoryBreakdown[category] = {
          count: data.count,
          averageDuration
        };
      });
    }

    // Database stats
    if (this.databaseMetrics.length > 0) {
      const successfulQueries = this.databaseMetrics.filter(m => m.success);
      stats.databaseStats.successRate = (successfulQueries.length / this.databaseMetrics.length) * 100;
      
      const totalDbDuration = this.databaseMetrics.reduce((sum, m) => sum + m.duration, 0);
      stats.databaseStats.averageDuration = totalDbDuration / this.databaseMetrics.length;
      
      const sortedDbMetrics = [...this.databaseMetrics].sort((a, b) => b.duration - a.duration);
      stats.databaseStats.slowestQuery = sortedDbMetrics[0] || null;
    }

    // Memory stats
    if (this.memoryUsage.length > 0) {
      stats.memoryStats.current = this.memoryUsage[this.memoryUsage.length - 1];
      stats.memoryStats.average = this.memoryUsage.reduce((sum, m) => sum + m, 0) / this.memoryUsage.length;
      stats.memoryStats.peak = Math.max(...this.memoryUsage);
    }

    return stats;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.activeTimers.clear();
  }

  /**
   * Get metrics for a specific operation
   */
  getOperationMetrics(operation: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.operation === operation);
  }

  /**
   * Log comprehensive performance summary to console
   */
  logSummary(): void {
    const stats = this.getStats();
    
    console.group('📊 Performance Summary');
    
    // General metrics
    console.log(`Total Operations: ${stats.totalOperations}`);
    console.log(`Average Duration: ${stats.averageDuration.toFixed(2)}ms`);
    
    if (stats.slowestOperation) {
      console.log(`Slowest: ${stats.slowestOperation.operation} (${stats.slowestOperation.duration.toFixed(2)}ms)`);
    }
    
    if (stats.fastestOperation) {
      console.log(`Fastest: ${stats.fastestOperation.operation} (${stats.fastestOperation.duration.toFixed(2)}ms)`);
    }

    // Category breakdown
    if (Object.keys(stats.categoryBreakdown).length > 0) {
      console.group('📈 Category Breakdown');
      Object.entries(stats.categoryBreakdown).forEach(([category, data]) => {
        console.log(`${category}: ${data.count} ops, avg ${data.averageDuration.toFixed(2)}ms`);
      });
      console.groupEnd();
    }

    // Component performance
    if (stats.componentStats.length > 0) {
      console.group('🎨 Component Performance');
      const slowComponents = stats.componentStats
        .filter(c => c.averageRenderTime > this.renderWarningThreshold)
        .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
      
      if (slowComponents.length > 0) {
        console.warn('Slow rendering components:');
        slowComponents.forEach(comp => {
          console.log(`${comp.componentName}: ${comp.renderCount} renders, avg ${comp.averageRenderTime.toFixed(2)}ms`);
        });
      } else {
        console.log('All components rendering within threshold ✅');
      }
      console.groupEnd();
    }

    // Database performance
    if (stats.databaseStats.totalQueries > 0) {
      console.group('🗄️ Database Performance');
      console.log(`Total Queries: ${stats.databaseStats.totalQueries}`);
      console.log(`Success Rate: ${stats.databaseStats.successRate.toFixed(1)}%`);
      console.log(`Average Duration: ${stats.databaseStats.averageDuration.toFixed(2)}ms`);
      
      if (stats.databaseStats.slowestQuery) {
        console.log(`Slowest Query: ${stats.databaseStats.slowestQuery.query} (${stats.databaseStats.slowestQuery.duration.toFixed(2)}ms)`);
      }
      console.groupEnd();
    }

    // Memory usage
    if (stats.memoryStats.current > 0) {
      console.group('🧠 Memory Usage');
      console.log(`Current: ${stats.memoryStats.current.toFixed(2)}MB`);
      console.log(`Average: ${stats.memoryStats.average.toFixed(2)}MB`);
      console.log(`Peak: ${stats.memoryStats.peak.toFixed(2)}MB`);
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const startTimer = (operation: string, metadata?: Record<string, any>, category?: PerformanceMetric['category']) => 
  performanceMonitor.startTimer(operation, metadata, category);

export const endTimer = (operation: string, metadata?: Record<string, any>, category?: PerformanceMetric['category']) => 
  performanceMonitor.endTimer(operation, metadata, category);

export const trackComponentRender = (componentName: string, renderTime: number) =>
  performanceMonitor.trackComponentRender(componentName, renderTime);

export const trackDatabaseOperation = (query: string, duration: number, success: boolean, errorMessage?: string) =>
  performanceMonitor.trackDatabaseOperation(query, duration, success, errorMessage);

export const trackMemoryUsage = () => performanceMonitor.trackMemoryUsage();

export const getPerformanceStats = () => performanceMonitor.getStats();

export const logPerformanceSummary = () => performanceMonitor.logSummary();

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      trackComponentRender(componentName, renderTime);
    };
  }
  
  return () => {}; // No-op in production
};

// Auto-monitoring disabled to prevent memory leaks
// Use manual performance tracking instead:
// - Call performanceMonitor.logSummary() manually when needed
// - Call performanceMonitor.trackMemoryUsage() manually when needed