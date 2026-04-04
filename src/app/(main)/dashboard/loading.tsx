export default function DashboardLoading() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-32 bg-navy-800/50 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-56 bg-navy-800/50 rounded animate-pulse" />
      </div>

      {/* Profile completeness skeleton */}
      <div className="h-16 bg-navy-900 border border-navy-700 rounded-lg animate-pulse mb-6" />

      {/* Port beacon skeleton */}
      <div className="h-12 w-40 bg-navy-800/50 rounded-xl animate-pulse mb-6" />

      {/* Signal feed skeletons */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-navy-900 border border-navy-700 rounded-lg p-4 animate-pulse"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: '1.5s' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-navy-800 rounded flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-navy-800 rounded mb-2" />
                <div className="h-3 w-64 bg-navy-800/60 rounded mb-2" />
                <div className="h-3 w-16 bg-navy-800/40 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="mt-8">
        <div className="h-4 w-28 bg-navy-800/50 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-11 bg-navy-900 border border-navy-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
