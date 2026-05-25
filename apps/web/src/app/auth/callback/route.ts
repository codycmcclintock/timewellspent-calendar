import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/?error=auth&error_description=${msg}`);
  }

  const oauthError = searchParams.get("error_description");
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/?error=server_error&error_description=${encodeURIComponent(oauthError)}`,
    );
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
