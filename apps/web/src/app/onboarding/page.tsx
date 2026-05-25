import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCouple, importLegacyCalendar, joinCouple } from "@/app/actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) redirect("/home");

  if (params.join) {
    await joinCouple(params.join);
    await importLegacyCalendar();
    redirect("/home");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-serif text-3xl font-semibold">Welcome to Ruffles</h1>
      <p className="mt-2 text-muted">Set up your shared space.</p>

      <form
        action={async () => {
          "use server";
          await createCouple();
          await importLegacyCalendar();
          redirect("/home");
        }}
        className="mt-8"
      >
        <button
          type="submit"
          className="w-full rounded-full bg-[#2563eb] py-3.5 text-sm font-semibold text-white shadow-md"
        >
          Create our calendar
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Have an invite? Open the link your partner sent.
      </p>
    </div>
  );
}
