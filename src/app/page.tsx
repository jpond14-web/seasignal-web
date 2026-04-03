import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <span className="text-teal-500 font-bold text-xl">⚓</span>
          <span className="font-bold text-lg text-slate-100">SeaSignal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-slate-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded transition-colors"
          >
            Join Free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-100 max-w-2xl leading-tight">
          Connect. Protect.{" "}
          <span className="text-teal-400">Know your worth.</span>
        </h1>
        <p className="text-slate-400 mt-4 max-w-lg text-lg">
          A private community built by seafarers, for seafarers. No employer access — ever.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            href="/signup"
            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold rounded-lg text-base transition-colors"
          >
            Create Free Account
          </Link>
          <Link
            href="/companies"
            className="px-6 py-3 bg-navy-800 border border-navy-600 hover:border-navy-500 text-slate-200 rounded-lg text-base transition-colors"
          >
            Browse Companies
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16 max-w-4xl w-full">
          <FeatureCard
            title="Company Intel"
            description="Structured reviews with pay reliability, safety culture, and contract accuracy scores."
          />
          <FeatureCard
            title="Pay Transparency"
            description="See real compensation data by rank, vessel type, and flag state. Know what you're worth."
          />
          <FeatureCard
            title="Cert Wallet"
            description="Track your certificates, get expiry alerts, and never miss a renewal deadline."
          />
          <FeatureCard
            title="Secure Messaging"
            description="Private conversations with shipmates. Context channels for vessels, companies, and ports."
          />
          <FeatureCard
            title="Incident Log"
            description="Your private evidence vault. Timestamped, encrypted, and always available."
          />
          <FeatureCard
            title="Know Your Rights"
            description="MLC 2006 guide, emergency contacts, and an 'Am I Being Screwed?' assessment tool."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-6 px-6 text-center">
        <p className="text-xs text-slate-500">
          SeaSignal — Privacy-first. No employer access. Built for seafarers.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 text-left">
      <h3 className="font-semibold text-slate-100 text-sm">{title}</h3>
      <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
