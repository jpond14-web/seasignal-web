export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 relative overflow-hidden">
      {/* Decorative compass rose / wave pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
        <svg className="w-full h-full" viewBox="0 0 800 800" fill="none">
          {/* Compass rose */}
          <g transform="translate(400,400)">
            <path d="M0,-200 L20,-40 L0,-60 L-20,-40 Z" fill="currentColor" className="text-teal-400" />
            <path d="M0,200 L20,40 L0,60 L-20,40 Z" fill="currentColor" className="text-teal-400" />
            <path d="M-200,0 L-40,20 L-60,0 L-40,-20 Z" fill="currentColor" className="text-teal-400" />
            <path d="M200,0 L40,20 L60,0 L40,-20 Z" fill="currentColor" className="text-teal-400" />
            <circle cx="0" cy="0" r="180" stroke="currentColor" className="text-teal-400" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="140" stroke="currentColor" className="text-teal-400" strokeWidth="0.3" />
            <circle cx="0" cy="0" r="60" stroke="currentColor" className="text-teal-400" strokeWidth="0.5" />
            {/* Degree marks */}
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 10 * Math.PI) / 180;
              const x1 = Math.cos(angle) * 170;
              const y1 = Math.sin(angle) * 170;
              const x2 = Math.cos(angle) * 180;
              const y2 = Math.sin(angle) * 180;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  className="text-teal-400"
                  strokeWidth="0.5"
                />
              );
            })}
          </g>
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">
            <span className="text-teal-500">&#x2693;</span> SeaSignal
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
