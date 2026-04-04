import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SeaSignal — The Professional Network for Seafarers",
  description:
    "Privacy-first platform connecting maritime professionals worldwide. Secure messaging, certificate tracking, pay transparency, and crew finder — built by seafarers, for seafarers.",
};

/* ──────────────────────────── SVG Icons ──────────────────────────── */

function BuildingIcon() {
  return (
    <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ShieldDocIcon() {
  return (
    <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  );
}

function LockChatIcon() {
  return (
    <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function ShieldLockIcon() {
  return (
    <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

/* Trust section icons */
function LockClosedIcon() {
  return (
    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.732-3.558" />
    </svg>
  );
}

/* Wave divider SVG */
function WaveDivider() {
  return (
    <div className="w-full overflow-hidden leading-[0] mt-16">
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="w-full h-[60px] text-navy-900/50"
      >
        <path
          d="M0,0 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,120 L0,120 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

/* ──────────────────────────── Page ──────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-teal-500 font-bold text-xl">&#x2693;</span>
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
        {/* Gradient bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center">
        <section className="relative w-full flex flex-col items-center px-6 pt-20 pb-4 text-center">
          {/* Radial glow background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full bg-teal-500/[0.07] blur-[100px] animate-glow" />
          </div>

          <h1 className="relative text-4xl md:text-5xl lg:text-6xl font-bold text-slate-100 max-w-3xl leading-tight">
            SeaSignal &mdash; The Professional Network{" "}
            <span className="text-teal-400">for Seafarers</span>
          </h1>
          <p className="relative text-slate-400 mt-5 max-w-xl text-lg leading-relaxed">
            Privacy-first platform connecting maritime professionals worldwide. Share intel, track pay, and protect each other.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/signup"
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold rounded-lg text-base transition-colors"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="px-6 py-3 bg-navy-800 border border-navy-600 hover:border-navy-500 text-slate-200 rounded-lg text-base transition-colors"
            >
              Learn More
            </a>
          </div>

          {/* Stats bar */}
          <div className="relative mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-dot" />
              5,000+ seafarers
            </span>
            <span className="hidden sm:inline text-navy-600">|</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-dot" />
              2,500+ company reviews
            </span>
            <span className="hidden sm:inline text-navy-600">|</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-dot" />
              80+ countries represented
            </span>
          </div>

          <WaveDivider />
        </section>

        {/* Feature grid */}
        <section id="features" className="w-full max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100 text-center mb-10">
            Everything you need at sea &mdash; and ashore
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<BuildingIcon />}
              title="Company Intel"
              description="Structured reviews with pay reliability, safety culture, and contract accuracy scores."
            />
            <FeatureCard
              icon={<ChartIcon />}
              title="Pay Transparency"
              description="See real compensation data by rank, vessel type, and flag state. Know what you're worth."
            />
            <FeatureCard
              icon={<ShieldDocIcon />}
              title="Cert Wallet"
              description="Track your certificates, get expiry alerts, and never miss a renewal deadline."
            />
            <FeatureCard
              icon={<LockChatIcon />}
              title="Secure Messaging"
              description="Private conversations with shipmates. Context channels for vessels, companies, and ports."
            />
            <FeatureCard
              icon={<ShieldLockIcon />}
              title="Incident Log"
              description="Your private evidence vault. Timestamped, encrypted, and always available."
            />
            <FeatureCard
              icon={<ScaleIcon />}
              title="Contract Check"
              description="Verify fair terms against MLC 2006 standards. Know your rights before you sign."
            />
            <FeatureCard
              icon={<UsersIcon />}
              title="Crew Finder"
              description="Reconnect with former crewmates and find trusted colleagues for your next voyage."
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full bg-navy-900/30 border-t border-b border-navy-800">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-12">
              Get started in three steps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-slate-100">Create your profile</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Sign up in under a minute. Your data stays private &mdash; no employer access, ever.</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-slate-100">Verify your credentials</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Upload certificates, track expiry dates, and build a trusted professional profile.</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-slate-100">Connect with the community</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Message crewmates, share pay data, review companies, and protect each other.</p>
              </div>
            </div>
            <div className="mt-10">
              <Link
                href="/signup"
                className="inline-block px-8 py-3 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold rounded-lg text-base transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>

        {/* Trust section */}
        <section className="w-full border-t border-navy-800 bg-navy-900/30">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-slate-100">
              Built for seafarers, by people who understand the sea.
            </h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <LockClosedIcon />
                </div>
                <h3 className="font-semibold text-slate-200 text-sm">No Employer Access &mdash; Ever</h3>
                <p className="text-slate-500 text-sm">Your data stays yours. No company can see who you are or what you post.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <ShieldCheckIcon />
                </div>
                <h3 className="font-semibold text-slate-200 text-sm">End-to-End Encrypted</h3>
                <p className="text-slate-500 text-sm">Messages and incident logs are encrypted so only you and your recipients can read them.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <GlobeIcon />
                </div>
                <h3 className="font-semibold text-slate-200 text-sm">MLC 2006 Compliant</h3>
                <p className="text-slate-500 text-sm">Built around the Maritime Labour Convention to protect your rights at sea.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800 bg-navy-950">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-teal-500 font-bold text-lg">&#x2693;</span>
                <span className="font-bold text-slate-100">SeaSignal</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Privacy-first.<br />
                No employer access.<br />
                Built for seafarers.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/companies" className="hover:text-slate-300 transition-colors">Companies</Link></li>
                <li><Link href="/pay" className="hover:text-slate-300 transition-colors">Pay Data</Link></li>
                <li><Link href="/forums" className="hover:text-slate-300 transition-colors">Forums</Link></li>
                <li><Link href="/rights" className="hover:text-slate-300 transition-colors">Rights</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/rights" className="hover:text-slate-300 transition-colors">MLC Guide</Link></li>
                <li><Link href="/rights" className="hover:text-slate-300 transition-colors">Emergency Contacts</Link></li>
                <li><Link href="/rights" className="hover:text-slate-300 transition-colors">Contract Check</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/about" className="hover:text-slate-300 transition-colors">About</Link></li>
                <li><Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-navy-800 text-center">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} SeaSignal. All rights reserved.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Built by seafarers, for seafarers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────── Feature Card ──────────────────────────── */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-navy-900 border border-navy-700 rounded-lg p-5 text-left border-t-2 border-t-teal-500/20 hover:border-teal-500/30 hover:shadow-[0_0_20px_rgba(14,165,233,0.08)] transition-all duration-300">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-slate-100 text-sm">{title}</h3>
      <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
