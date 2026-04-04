export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="h-8 w-64 bg-navy-800 animate-pulse rounded mb-1" />
      <div className="h-4 w-48 bg-navy-800 animate-pulse rounded mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-navy-900 border border-navy-700 rounded-lg p-4"
          >
            <div className="h-3 w-20 bg-navy-800 animate-pulse rounded mb-2" />
            <div className="h-7 w-12 bg-navy-800 animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-navy-800 animate-pulse rounded" />
          </div>
        ))}
      </div>

      <div className="h-5 w-32 bg-navy-800 animate-pulse rounded mb-3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-11 bg-navy-900 border border-navy-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
