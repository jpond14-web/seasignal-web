"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HubNavProps {
  items: { href: string; label: string }[];
}

export function HubNav({ items }: HubNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto gap-0 border-b border-navy-700 mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${
              isActive
                ? "text-teal-400 font-medium border-b-2 border-teal-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
