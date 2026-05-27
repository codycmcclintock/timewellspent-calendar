import { ingestLinkCore } from "@/lib/link-ingest-core";
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

    const { data: membership } = await supabase
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.couple_id) {
      return iosBadRequest("Create or join a couple before saving links.");
    }

    let body: {
      sourceUrl?: string;
      title?: string;
      planId?: string;
      destination?: string;
      destinationKey?: string;
      forceInbox?: boolean;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return iosBadRequest("Invalid JSON body");
    }

    const sourceUrl =
      typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    if (!sourceUrl) {
      return iosBadRequest("sourceUrl is required");
    }

    const result = await ingestLinkCore(
      supabase,
      user,
      membership.couple_id,
      sourceUrl,
      {
        title: typeof body.title === "string" ? body.title : undefined,
        planId: typeof body.planId === "string" ? body.planId : undefined,
        destination:
          typeof body.destination === "string" ? body.destination : undefined,
        destinationKey:
          typeof body.destinationKey === "string"
            ? body.destinationKey
            : undefined,
        forceInbox: body.forceInbox === true,
      },
    );

    if (result.needsDestination) {
      return iosJson({
        needsDestination: true,
        sourceUrl: result.sourceUrl,
        sourceType: result.sourceType,
        forceInbox: result.forceInbox,
      });
    }

    return iosJson({
      needsDestination: false,
      inbox: result.inbox,
      autoRouted: result.autoRouted ?? false,
      planId: result.planId,
      planSlug: result.planSlug,
      planTitle: result.planTitle,
      draftId: result.draft?.id,
      matched: result.matched ?? false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "Unauthorized") {
      return iosUnauthorized();
    }
    if (message === "SAVE_LIMIT_REACHED") {
      return iosJson(
        {
          error: "SAVE_LIMIT_REACHED",
          code: "SAVE_LIMIT_REACHED",
        },
        402,
      );
    }
    if (e instanceof Error && e.message) {
      return iosErrorResponse(e);
    }
    return iosServerError();
  }
}
