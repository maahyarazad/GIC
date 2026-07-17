/**
 * Tiny in-memory response cache for read-heavy, rarely-written data
 * (products / continents / country intelligence).
 *
 * Entries never expire on their own — the whole cache is cleared on any write,
 * so clients always get fresh data after a create/update/delete. Process-local —
 * fine for a single Node instance; swap for Redis if you scale horizontally.
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const DEFAULT_TTL_MS = Infinity; // never expire on its own — only cleared on writes

class CacheService {
  private store = new Map<string, CacheEntry>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs: number = DEFAULT_TTL_MS): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Return the cached value for `key`, or run `producer()`, cache its result and
   * return it. `shouldCache` lets callers skip caching (e.g. error/empty results).
   */
  async getOrSet<T>(
    key: string,
    producer: () => Promise<T>,
    opts: { ttlMs?: number; shouldCache?: (value: T) => boolean } = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await producer();
    if (!opts.shouldCache || opts.shouldCache(value)) {
      this.set(key, value, opts.ttlMs);
    }
    return value;
  }

  /** Drop a single key. */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Drop every key whose name starts with `prefix`. */
  deletePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Clear the whole cache — called on any product/continent write. */
  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const cacheService = new CacheService();
