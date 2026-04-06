import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-teal-400 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Page not found</h1>
      <p className="text-slate-400 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/home"
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/intel/companies"
          className="px-5 py-2.5 bg-navy-800 border border-navy-600 hover:border-navy-500 text-slate-200 rounded text-sm transition-colors"
        >
          Browse Companies
        </Link>
      </div>
    </div>
  );
}
