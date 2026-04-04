"use client";

const entries = [
  {
    version: "0.3.0",
    date: "2026-04-04",
    title: "Major Feature Sprint",
    items: [
      "Phone/SMS login for seafarers without reliable email",
      "Profile photos and avatar uploads",
      "Font size preferences (small, medium, large) in Settings",
      "Multi-step forms for certificates and sea time — less overwhelming on mobile",
      "Bulk CSV import for sea time records",
      "GDPR data export — download all your data",
      "Settings now persist to your account across devices",
      "Incident PDF export for evidential documentation",
      "Find Crew — discover seafarers you've served with",
      "Contract Check methodology transparency",
      "In-app changelog (you're reading it!)",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-04-03",
    title: "Launch Ready",
    items: [
      "Complete visual redesign with maritime dark theme",
      "The Pulse — personalized dashboard with signal feed",
      "Port Beacon — connect with seafarers in your port",
      "E2E encrypted messaging with channels and DMs",
      "Contract Check — evaluate your contract terms",
      "Sea Time tracking with STCW progression calculator",
      "Manning agency directory with pattern flag alerts",
      "Company reviews with batch-release privacy",
      "Certificate wallet with offline access",
      "Incident log with timestamped evidence vault",
      "Seafarer directory with filters",
      "Forum community",
      "Pay transparency reports",
      "MLC 2006 rights guide",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-03-28",
    title: "Initial Build",
    items: [
      "Core authentication (email + magic link)",
      "Profile creation and editing",
      "Basic navigation and routing",
      "Supabase backend integration",
      "PWA support with service worker",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">
          What&apos;s New{" "}
          <span className="text-lg" aria-hidden="true">
            &#x1F680;
          </span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Recent updates and improvements to SeaSignal
        </p>
      </div>

      <div className="space-y-5">
        {entries.map((entry) => (
          <div
            key={entry.version}
            className="bg-navy-900 border border-navy-700 rounded-lg p-5 card-hover"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400">
                v{entry.version}
              </span>
              <span className="text-xs text-slate-500">{entry.date}</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-100 mb-3">
              {entry.title}
            </h2>
            <ul className="space-y-1.5">
              {entry.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
