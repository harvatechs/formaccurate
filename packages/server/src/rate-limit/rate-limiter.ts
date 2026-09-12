export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Interface for rate limiting state-changing endpoints (validate, submit).
 */
export interface RateLimiter {
  check(key: string): Promise<RateLimitResult> | RateLimitResult;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export interface TokenBucketOptions {
  /** Maximum burst capacity of the token bucket (defaults to 60). */
  maxTokens?: number | undefined;
  /** Number of tokens refilled per second (defaults to 1). */
  refillRatePerSec?: number | undefined;
}

/**
 * In-memory Token-Bucket rate limiter implementation.
 */
export class TokenBucketRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();
  private maxTokens: number;
  private refillRatePerSec: number;

  /**
   * @param options - Configuration options for token capacity and refill rate.
   */
  constructor(options: TokenBucketOptions = {}) {
    this.maxTokens = options.maxTokens ?? 60;
    this.refillRatePerSec = options.refillRatePerSec ?? 1;
  }

  public check(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(
        this.maxTokens,
        bucket.tokens + elapsedSec * this.refillRatePerSec,
      );
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetMs: Math.ceil(
          ((this.maxTokens - bucket.tokens) / this.refillRatePerSec) * 1000,
        ),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.ceil(
        ((1 - bucket.tokens) / this.refillRatePerSec) * 1000,
      ),
    };
  }

  public clear(): void {
    this.buckets.clear();
  }
}
