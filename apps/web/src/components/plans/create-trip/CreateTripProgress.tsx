export function CreateTripProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex justify-center gap-2 py-3">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
            n < step
              ? "bg-primary-200"
              : n === step
                ? "bg-primary-500"
                : "bg-black/10"
          }`}
        />
      ))}
    </div>
  );
}
