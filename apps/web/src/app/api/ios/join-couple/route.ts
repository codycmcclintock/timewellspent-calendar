import { joinCoupleCore } from "@/lib/couple-onboarding";
import {
  iosBadRequest,
  iosErrorResponse,
  iosJson,
  iosServerError,
  iosUnauthorized,
} from "@/lib/ios-api";
import { requireUserFromRequest } from "@/lib/supabase/bearer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUserFromRequest(request);

    let body: { inviteToken?: string };
    try {
      body = (await request.json()) as { inviteToken?: string };
    } catch {
      return iosBadRequest("Invalid JSON body");
    }

    const inviteToken =
      typeof body.inviteToken === "string" ? body.inviteToken.trim() : "";
    if (!inviteToken) {
      return iosBadRequest("inviteToken is required");
    }

    const coupleId = await joinCoupleCore(user, supabase, inviteToken);
    return iosJson({ coupleId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "Unauthorized") {
      return iosUnauthorized();
    }
    if (e instanceof Error && e.message) {
      return iosErrorResponse(e);
    }
    return iosServerError();
  }
}
