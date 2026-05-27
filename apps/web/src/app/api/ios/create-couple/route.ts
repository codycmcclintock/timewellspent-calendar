import { createCoupleCore } from "@/lib/couple-onboarding";
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
    const { user } = await requireUserFromRequest(request);

    let body: { name?: string } = {};
    try {
      const text = await request.text();
      if (text.trim()) {
        body = JSON.parse(text) as { name?: string };
      }
    } catch {
      return iosBadRequest("Invalid JSON body");
    }

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : undefined;

    const coupleId = await createCoupleCore(user, { name });
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
