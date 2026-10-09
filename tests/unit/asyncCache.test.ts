import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAsyncCache } from '../../src/utils/asyncCache';

afterEach(() => {
  vi.useRealTimers();
});

describe('createAsyncCache', () => {
  it('deduplicates concurrent reads and reuses the value within the TTL', async () => {
    const cache = createAsyncCache(1_000);
    let resolve!: (value: string) => void;
    const loader = vi.fn(() => new Promise<string>(done => { resolve = done; }));

    const first = cache.get('catalog', loader);
    const second = cache.get('catalog', loader);
    resolve('products');

    await expect(Promise.all([first, second])).resolves.toEqual(['products', 'products']);
    await expect(cache.get('catalog', loader)).resolves.toBe('products');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('expires bounded entries and supports explicit invalidation', async () => {
    vi.useFakeTimers();
    const cache = createAsyncCache(100);
    const loader = vi.fn()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2')
      .mockResolvedValueOnce('v3');

    await expect(cache.get('config', loader)).resolves.toBe('v1');
    vi.advanceTimersByTime(101);
    await expect(cache.get('config', loader)).resolves.toBe('v2');
    cache.invalidate('config');
    await expect(cache.get('config', loader)).resolves.toBe('v3');
  });

  it('does not cache failed reads', async () => {
    const cache = createAsyncCache();
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('recovered');

    await expect(cache.get('products', loader)).rejects.toThrow('offline');
    await expect(cache.get('products', loader)).resolves.toBe('recovered');
  });

  it('does not let an invalidated in-flight read restore stale data', async () => {
    const cache = createAsyncCache();
    let resolveStale!: (value: string) => void;
    const staleRead = cache.get('products', () => new Promise<string>(done => {
      resolveStale = done;
    }));

    cache.invalidate('products');
    resolveStale('stale');
    await staleRead;

    const loader = vi.fn().mockResolvedValue('fresh');
    await expect(cache.get('products', loader)).resolves.toBe('fresh');
    expect(loader).toHaveBeenCalledOnce();
  });
});
