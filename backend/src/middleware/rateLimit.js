const windowMs = 60 * 1000;
const store = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.start > windowMs) store.delete(key);
  }
}, windowMs);

export function rateLimit(maxRequests = 10) {
  return (req, res, next) => {
    const key = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now - entry.start > windowMs) {
      entry = { count: 0, start: now };
      store.set(key, entry);
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({ message: "请求过于频繁，请稍后再试" });
    }

    next();
  };
}
