import rateLimit from "express-rate-limit";

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests to this endpoint"
});

// Looser cap for read-only, high-frequency endpoints such as the live letter preview, which can
// fire once per debounced edit. Still bounded to curb abuse.
export const previewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many requests to this endpoint"
});
