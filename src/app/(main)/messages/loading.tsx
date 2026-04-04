export default function MessagesLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-navy-800/50 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-navy-800/50 rounded-lg animate-pulse" />
      </div>

      {/* Conversation list skeletons */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-navy-900 border border-navy-700 rounded-lg p-4 animate-pulse"
            style={{ animationDelay: `${i * 100}ms`, animationDuration: '1.5s' }}
          >
            {/* Avatar skeleton */}
            <div className="w-10 h-10 rounded-full bg-navy-800 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 w-32 bg-navy-800 rounded" />
                <div className="h-3 w-12 bg-navy-800/60 rounded" />
              </div>
              <div className="h-3 w-48 bg-navy-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
