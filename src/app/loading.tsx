export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] bg-bg-page px-6 py-12">
      <div className="container mx-auto max-w-6xl space-y-8 animate-pulse">
        <div className="h-10 w-72 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-44 rounded-2xl bg-white border border-border" />
          ))}
        </div>
      </div>
    </div>
  );
}
