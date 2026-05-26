type PostgrestLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

export function formatActionError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;

  if (e && typeof e === "object") {
    const err = e as PostgrestLike;
    if (err.code === "23505") {
      return "You already have a trip for this destination. Open it from Plans or choose another city.";
    }
    if (typeof err.message === "string" && err.message.length > 0) {
      return err.message;
    }
  }

  return "Something went wrong. Please try again.";
}
