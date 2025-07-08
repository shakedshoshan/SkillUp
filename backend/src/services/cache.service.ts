import { RedisClientType } from 'redis';
import { redisConfig } from '../config/redis.config';
import { envConfig } from '../config/env.config';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

export class CacheService {
  private redis: RedisClientType;
  private defaultTTL: number;
  private keyPrefix: string;

  constructor() {
    this.redis = redisConfig.getClient();
    this.defaultTTL = envConfig.redis.defaultTTL;
    this.keyPrefix = envConfig.redis.keyPrefix;
  }

  /**
   * Generate a cache key with prefix
   */
  private generateKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || this.keyPrefix;
    return `${finalPrefix}${key}`;
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      if (!redisConfig.isClientConnected()) {
        console.warn('Redis not connected, skipping cache get');
        return null;
      }

      const cacheKey = this.generateKey(key, options?.keyPrefix);
      const cached = await this.redis.get(cacheKey);
      
      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
    try {
      if (!redisConfig.isClientConnected()) {
        console.warn('Redis not connected, skipping cache set');
        return false;
      }

      const cacheKey = this.generateKey(key, options?.keyPrefix);
      const ttl = options?.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);

      await this.redis.setEx(cacheKey, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false; // Fail gracefully
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      if (!redisConfig.isClientConnected()) {
        console.warn('Redis not connected, skipping cache delete');
        return false;
      }

      const cacheKey = this.generateKey(key, options?.keyPrefix);
      const result = await this.redis.del(cacheKey);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false; // Fail gracefully
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      if (!redisConfig.isClientConnected()) {
        return false;
      }

      const cacheKey = this.generateKey(key, options?.keyPrefix);
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false; // Fail gracefully
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number, options?: CacheOptions): Promise<boolean> {
    try {
      if (!redisConfig.isClientConnected()) {
        return false;
      }

      const cacheKey = this.generateKey(key, options?.keyPrefix);
      const result = await this.redis.expire(cacheKey, ttl);
      return result;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false; // Fail gracefully
    }
  }

  /**
   * Get cache statistics (simplified for Redis Cloud)
   */
  async getStats(): Promise<any> {
    try {
      if (!redisConfig.isClientConnected()) {
        return { connected: false, provider: 'Redis Cloud' };
      }

      // Simplified stats for cloud environment
      const dbSize = await this.redis.dbSize();
      return {
        connected: true,
        provider: 'Redis Cloud',
        dbSize,
        keyPrefix: this.keyPrefix,
        defaultTTL: this.defaultTTL,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { 
        connected: false, 
        provider: 'Redis Cloud',
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Clear all cache entries with the specified prefix
   */
  async clearByPattern(pattern: string, options?: CacheOptions): Promise<number> {
    try {
      if (!redisConfig.isClientConnected()) {
        return 0;
      }

      const cachePattern = this.generateKey(pattern, options?.keyPrefix);
      const keys = await this.redis.keys(cachePattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(keys);
      return result;
    } catch (error) {
      console.error(`Cache clear pattern error for pattern ${pattern}:`, error);
      return 0; // Fail gracefully
    }
  }

  /**
   * Get or set pattern - useful for cache-aside pattern
   */
  async getOrSet<T = any>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key, options);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch the data
      const data = await fetchFunction();
      
      // Store in cache for next time
      await this.set(key, data, options);
      
      return data;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      // If cache fails, still try to fetch the data
      return await fetchFunction();
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService(); 