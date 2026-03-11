import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../../services/cacheService';

describe('CacheService', () => {
  beforeEach(() => {
    CacheService.clearAll();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set and get values from cache', () => {
    const result = { recommendations: [], topRackets: [], timestamp: Date.now() };
    CacheService.set('test-key', result as any);
    expect(CacheService.get('test-key')).toEqual(result);
  });

  it('should return null for non-existent keys', () => {
    expect(CacheService.get('missing')).toBeNull();
  });

  it('should clear all keys', () => {
    const result = { recommendations: [], topRackets: [], timestamp: Date.now() };
    CacheService.set('k1', result as any);
    CacheService.clearAll();
    expect(CacheService.get('k1')).toBeNull();
  });
});
