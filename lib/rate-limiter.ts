/**
 * Simple rate limiter for Gemini API calls
 */

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 12, timeWindowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMinutes * 60 * 1000;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        console.log(`⏳ Rate limit reached, waiting ${Math.round(waitTime/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot(); // Recursive check
      }
    }
    
    // Record this request
    this.requests.push(now);
  }

  getStatus() {
    const now = Date.now();
    const recentRequests = this.requests.filter(time => now - time < this.timeWindow);
    return {
      current: recentRequests.length,
      max: this.maxRequests,
      available: this.maxRequests - recentRequests.length
    };
  }
}

export const geminiRateLimiter = new RateLimiter(12, 1); // 12 requests per minute