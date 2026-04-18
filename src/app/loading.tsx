export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] px-4 py-12 sm:px-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Title skeleton */}
        <div className="h-10 w-64 animate-pulse rounded-xl bg-gray-200/80" />

        {/* Cards skeleton grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl border border-white/80 bg-white/50 p-5 backdrop-blur-sm">
              <div className="mb-4 h-32 rounded-xl bg-gray-100" />
              <div className="mb-2 h-4 w-20 rounded-md bg-gray-100" />
              <div className="mb-1 h-4 w-full rounded-md bg-gray-100" />
              <div className="mb-4 h-4 w-3/4 rounded-md bg-gray-100" />
              <div className="h-6 w-24 rounded-md bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
