export default function Loading() {
  return (
    <div className="flex gap-4 overflow-hidden p-4 sm:p-6">
      {Array.from({ length: 4 }).map((_, c) => (
        <div key={c} className="w-72 shrink-0 space-y-3 rounded-2xl border bg-card/40 p-3">
          <div className="skeleton h-5 w-24 rounded-md" />
          {Array.from({ length: 3 - (c % 2) }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
