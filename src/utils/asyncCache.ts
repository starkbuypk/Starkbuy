type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export function createAsyncCache(defaultTtlMs = 60_000) {
  const values = new Map<string, CacheEntry<unknown>>();
  const pending = new Map<string, Promise<unknown>>();
  const revisions = new Map<string, number>();

  async function get<T>(
    key: string,
    loader: () => Promise<T>,
    options: { force?: boolean; ttlMs?: number } = {},
  ): Promise<T> {
    if (options.force) invalidate(key);

    const now = Date.now();
    const cached = values.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > now) return cached.value;

    const inFlight = pending.get(key) as Promise<T> | undefined;
    if (inFlight) return inFlight;

    const requestRevision = revisions.get(key) ?? 0;
    const request = loader()
      .then(value => {
        if ((revisions.get(key) ?? 0) === requestRevision) {
          values.set(key, {
            value,
            expiresAt: Date.now() + (options.ttlMs ?? defaultTtlMs),
          });
        }
        return value;
      })
      .finally(() => {
        if (pending.get(key) === request) pending.delete(key);
      });

    pending.set(key, request);
    return request;
  }

  function invalidate(key?: string) {
    if (key) {
      revisions.set(key, (revisions.get(key) ?? 0) + 1);
      values.delete(key);
      pending.delete(key);
      return;
    }
    for (const cachedKey of new Set([...values.keys(), ...pending.keys()])) {
      revisions.set(cachedKey, (revisions.get(cachedKey) ?? 0) + 1);
    }
    values.clear();
    pending.clear();
  }

  return { get, invalidate };
}
