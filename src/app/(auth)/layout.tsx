export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">
            <span className="text-teal-500">⚓</span> SeaSignal
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Privacy-first hub for seafarers
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
