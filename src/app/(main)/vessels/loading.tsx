export default function VesselsLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="h-8 w-32 bg-navy-800 animate-pulse rounded mb-6" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 h-10 bg-navy-800 animate-pulse rounded" />
        <div className="h-10 w-40 bg-navy-800 animate-pulse rounded" />
      </div>

      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-navy-900 border border-navy-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="h-5 w-40 bg-navy-800 animate-pulse rounded mb-2" />
                <div className="flex items-center gap-2">
                  <div className="h-3 w-24 bg-navy-800 animate-pulse rounded" />
                  <div className="h-5 w-16 bg-navy-800 animate-pulse rounded" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-6 w-10 bg-navy-800 animate-pulse rounded mb-1" />
                <div className="h-3 w-16 bg-navy-800 animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
