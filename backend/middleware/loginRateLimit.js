import { rateLimit } from 'express-rate-limit';

// One store per router/process. Successful logins are removed from the count.
export const createLoginRateLimit = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { success: false, error: 'Too many login attempts. Please try again later.' },
});
