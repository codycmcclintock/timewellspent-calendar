import { redirect } from "next/navigation";
import { Suspense } from "react";
import { VoiceRecordFlow } from "@/components/VoiceRecordFlow";
import { getUserContext } from "@/lib/user-context";
import type { VoiceParseMode } from "@/lib/voice-session-prompts";

function RecordContent({
  searchParams,
}: {
  searchParams: { mode?: string; plan?: string };
}) {
  const mode = (searchParams.mode as VoiceParseMode) || "weekly";
  const valid: VoiceParseMode[] = ["first", "weekly", "trip"];
  const resolved = valid.includes(mode) ? mode : "weekly";

  return (
    <VoiceRecordFlow
      mode={resolved}
      planSlug={searchParams.plan}
    />
  );
}

export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; plan?: string }>;
}) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/onboarding");

  const params = await searchParams;

  return (
    <Suspense fallback={null}>
      <RecordContent searchParams={params} />
    </Suspense>
  );
}
