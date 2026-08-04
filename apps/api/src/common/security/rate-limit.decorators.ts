import { SkipThrottle, Throttle } from '@nestjs/throttler';

export const RATE_LIMIT_POLICY_TTL_MS = 60_000;

export const RATE_LIMIT_POLICIES = {
  strict: {
    limit: 10,
    ttl: RATE_LIMIT_POLICY_TTL_MS,
  },
  expanded: {
    limit: 300,
    ttl: RATE_LIMIT_POLICY_TTL_MS,
  },
} as const;

type RateLimitDecorator = MethodDecorator & ClassDecorator;

export function StrictRateLimit(): RateLimitDecorator {
  return Throttle({ default: RATE_LIMIT_POLICIES.strict });
}

export function ExpandedRateLimit(): RateLimitDecorator {
  return Throttle({ default: RATE_LIMIT_POLICIES.expanded });
}

/** Explicitly bypasses the global guard for future health probes and similar infrastructure routes. */
export function SkipRateLimit(): RateLimitDecorator {
  return SkipThrottle();
}
