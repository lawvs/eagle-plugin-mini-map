export interface LruCache<K, V> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
}

export function createLruCache<K, V>(maxEntries: number): LruCache<K, V> {
  const entries = new Map<K, V>();

  return {
    get(key) {
      if (!entries.has(key)) {
        return undefined;
      }

      const value = entries.get(key);
      entries.delete(key);
      entries.set(key, value as V);

      return value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, value);

      if (entries.size > maxEntries) {
        const oldestEntry = entries.keys().next();

        if (!oldestEntry.done) {
          entries.delete(oldestEntry.value);
        }
      }
    },
  };
}
