import { LRUCache } from 'lru-cache'

/**
 * Generic cache interface — allows swapping LRU with KV or other backends.
 */
export interface CacheAdapter<V extends object> {
  get(key: string): V | undefined
  set(key: string, value: V): void
  has(key: string): boolean
}

/**
 * LRU-based cache adapter.
 */
export class LRUCacheAdapter<V extends object> implements CacheAdapter<V> {
  private cache: LRUCache<string, V>

  constructor(options?: Partial<LRUCache.Options<string, V, unknown>>) {
    this.cache = new LRUCache<string, V>({
      ttl: 1000 * 60 * 5,
      maxSize: 50 * 1024 * 1024,
      sizeCalculation: item => JSON.stringify(item).length,
      ...options,
    })
  }

  get(key: string): V | undefined {
    return this.cache.get(key)
  }

  set(key: string, value: V): void {
    this.cache.set(key, value)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }
}
