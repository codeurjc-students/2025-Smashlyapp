import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from '../../services/cacheService';

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set and get values from cache', () => {
    cacheService.set('test-key', { data: 'value' });
    expect(cacheService.get('test-key')).toEqual({ data: 'value' });
  });

  it('should return null for non-existent keys', () => {
    expect(cacheService.get('missing')).toBeNull();
  });

  it('should expire keys after TTL', () => {
    // default TTL is 5 mins (300000ms)
    cacheService.set('short-lived', { foo: 'bar' });
    expect(cacheService.get('short-lived')).not.toBeNull();

    // Advance time by 6 minutes
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(cacheService.get('short-lived')).toBeNull();
  });

  it('should respect custom TTL', () => {
    cacheService.set('very-short', { val: 1 }, 1000); // 1 sec
    expect(cacheService.get('very-short')).not.toBeNull();

    vi.advanceTimersByTime(1500);
    expect(cacheService.get('very-short')).toBeNull();
  });

  it('should remove specific keys', () => {
    cacheService.set('k1', 'v1');
    cacheService.remove('k1');
    expect(cacheService.get('k1')).toBeNull();
  });

  it('should clear all keys', () => {
    cacheService.set('k1', 'v1');
    cacheService.set('k2', 'v2');
    cacheService.clear();
    expect(cacheService.get('k1')).toBeNull();
    expect(cacheService.get('k2')).toBeNull();
  });
});
