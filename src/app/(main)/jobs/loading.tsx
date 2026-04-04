export default function JobsLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-navy-800/50 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-navy-800/50 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-navy-800/50 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] h-9 bg-navy-800/50 rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-navy-800/50 rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-navy-800/50 rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-navy-800/50 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Job card skeletons */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-navy-900 border border-navy-700 rounded-lg p-5 animate-pulse"
            style={{ animationDelay: `${i * 100}ms`, animationDuration: '1.5s' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-5 w-48 bg-navy-800 rounded mb-2" />
                <div className="h-4 w-32 bg-navy-800/60 rounded mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-navy-800/60 rounded" />
                  <div className="h-5 w-20 bg-navy-800/60 rounded" />
                  <div className="h-5 w-14 bg-navy-800/60 rounded" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-28 bg-navy-800 rounded mb-2" />
                <div className="h-3 w-20 bg-navy-800/60 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
