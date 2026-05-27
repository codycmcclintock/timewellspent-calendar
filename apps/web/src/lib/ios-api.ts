import { NextResponse } from "next/server";
import { formatActionError } from "@/lib/format-action-error";

export function iosJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function iosUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function iosBadRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function iosErrorResponse(e: unknown) {
  const message = formatActionError(e);
  if (message === "Unauthorized" || message === "Not authenticated") {
    return iosUnauthorized();
  }
  return iosBadRequest(message);
}

export function iosServerError() {
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
