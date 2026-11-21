import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/lib/container";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { validateStudentRegistration, type StudentRegistration } from "@/module/auth/domain/entities/StudentRegistration";
import { ApiError, isApiError } from "@/shared/errors/ApiError";
import { DomainError } from "@/shared/errors/DomainError";

// Anti-robots : 10 demandes d'inscription par adresse IP et par heure.
const REGISTER_LIMIT = 10;
const REGISTER_WINDOW_MS = 60 * 60_000;

export async function POST(request: NextRequest) {
  const limited = rateLimit(`register:${getClientIp(request)}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  try {
    const body = (await request.json().catch(() => null)) as StudentRegistration | null;
    if (!body || typeof body !== "object") throw new ApiError("Requête invalide.", 400, "BAD_REQUEST");

    // Le client n'est jamais cru sur parole : on revalide tout côté serveur.
    const input = validateStudentRegistration(body);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    const { registerService } = await getContainer(siteUrl);
    await registerService.register(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (isApiError(e)) return NextResponse.json(e.toJSON(), { status: e.status });
    if (e instanceof DomainError) return NextResponse.json(new ApiError(e.message, 400, e.code).toJSON(), { status: 400 });
    console.error("[api/auth/register]", e);
    return NextResponse.json(new ApiError("Erreur interne.", 500).toJSON(), { status: 500 });
  }
}
