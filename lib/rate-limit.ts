import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/shared/errors/ApiError";

interface Bucket {
  count: number;
  resetAt: number;
}

// Compteurs en mémoire : suffisant pour freiner les robots sur une instance.
// Sur un hébergement « serverless » multi-instances, utiliser un stockage partagé (Redis/Upstash) ou le CAPTCHA Supabase.
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export interface RateLimitResult {
  ok: boolean;
  /** Secondes avant de pouvoir réessayer (si bloqué). */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Réponse 429 au format d'erreur des routes API (code RATE_LIMITED traduit côté interface). */
export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(new ApiError("Trop de tentatives. Réessayez plus tard.", 429, "RATE_LIMITED").toJSON(), {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}
