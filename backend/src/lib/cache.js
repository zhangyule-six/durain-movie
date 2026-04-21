const store = new Map();

/**
 * @param {string} key
 * @param {() => Promise<any>} fetcher
 * @param {number} ttlMs - cache lifetime in milliseconds
 */
export async function getOrSet(key, fetcher, ttlMs) {
  const cached = store.get(key);
  if (cached && Date.now() - cached.ts < ttlMs) {
    return cached.data;
  }

  if (cached?.pending) {
    return cached.pending;
  }

  const pending = fetcher().then((data) => {
    store.set(key, { data, ts: Date.now(), pending: null });
    return data;
  }).catch((err) => {
    store.delete(key);
    throw err;
  });

  store.set(key, { data: cached?.data ?? null, ts: cached?.ts ?? 0, pending });
  return pending;
}

export function invalidate(key) {
  store.delete(key);
}

export function clearAll() {
  store.clear();
}
