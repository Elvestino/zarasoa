import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/lib/container";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { Email } from "@/module/auth/domain/value-object/Email";
import { DomainError } from "@/shared/errors/DomainError";
import { ApiError, isApiError } from "@/shared/errors/ApiError";

// Anti-robots : 20 tentatives par adresse IP et par tranche de 10 minutes (en plus du blocage du compte après 5 échecs).
const LOGIN_LIMIT = 20;
const LOGIN_WINDOW_MS = 10 * 60_000;

export async function POST(request: NextRequest) {
  const limited = rateLimit(`login:${getClientIp(request)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  try {
    const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
    if (typeof body?.email !== "string" || typeof body.password !== "string" || !body.email || !body.password || body.password.length > 256) {
      throw new ApiError("E-mail et mot de passe requis.", 400, "BAD_REQUEST");
    }

    const { loginService } = await getContainer();
    const user = await loginService.login(Email.create(body.email), body.password, {
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({ user });
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown) {
  if (isApiError(e)) return NextResponse.json(e.toJSON(), { status: e.status });
  if (e instanceof DomainError) return NextResponse.json(new ApiError(e.message, 400, e.code).toJSON(), { status: 400 });
  console.error("[api/auth/login]", e);
  return NextResponse.json(new ApiError("Erreur interne.", 500).toJSON(), { status: 500 });
}
