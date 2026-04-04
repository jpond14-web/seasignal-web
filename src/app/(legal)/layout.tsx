import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-teal-500 font-bold text-xl">&#x2693;</span>
          <span className="font-bold text-lg text-slate-100">SeaSignal</span>
        </Link>
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
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800 bg-navy-950">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/about" className="hover:text-slate-300 transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-slate-600 mt-4">
            &copy; {new Date().getFullYear()} SeaSignal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
