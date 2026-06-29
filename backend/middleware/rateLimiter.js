function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 60,
  message = "Too many requests. Please try again later.",
} = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.originalUrl.split("?")[0]}`;
    const record = hits.get(key);

    if (!record || record.resetAt <= now) {
      hits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      res.set(
        "Retry-After",
        String(Math.ceil((record.resetAt - now) / 1000))
      );

      return res.status(429).json({
        message,
      });
    }

    return next();
  };
}

module.exports = createRateLimiter;
