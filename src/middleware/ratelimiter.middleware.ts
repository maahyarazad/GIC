import rateLimit from "express-rate-limit";

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests to this endpoint"
});
