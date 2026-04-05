"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SearchResult = {
  id: string;
  category: "vessels" | "companies" | "seafarers" | "forums" | "certificates";
  title: string;
  subtitle: string | null;
  href: string;
};

const CATEGORY_META: Record<
  SearchResult["category"],
  { label: string; icon: (props: { className?: string }) => React.ReactNode }
> = {
  vessels: { label: "Vessels", icon: VesselIcon },
  companies: { label: "Companies", icon: CompanyIcon },
  seafarers: { label: "Seafarers", icon: SeafarersIcon },
  forums: { label: "Forums", icon: ForumIcon },
  certificates: { label: "Certificates", icon: CertIcon },
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Keyboard shortcut to open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(-1);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      performSearch(query.trim()).then((r) => {
        setResults(r);
        setLoading(false);
        setActiveIndex(-1);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = useCallback(async (q: string): Promise<SearchResult[]> => {
    const supabase = createClient();
    const pattern = `%${q}%`;
    const all: SearchResult[] = [];

    const [vessels, companies, profiles, forums, certs] = await Promise.all([
      supabase
        .from("vessels")
        .select("id, name, vessel_type, flag_state")
        .ilike("name", pattern)
        .limit(5),
      supabase
        .from("companies")
        .select("id, name, company_type, country")
        .ilike("name", pattern)
        .limit(5),
      supabase
        .from("profiles")
        .select("id, display_name, rank_range, department_tag")
        .ilike("display_name", pattern)
        .limit(5),
      supabase
        .from("forum_posts")
        .select("id, title, category_id")
        .not("title", "is", null)
        .ilike("title", pattern)
        .limit(5),
      supabase
        .from("certificates")
        .select("id, title, cert_type, expiry_date")
        .ilike("title", pattern)
        .limit(5),
    ]);

    if (vessels.data) {
      for (const v of vessels.data) {
        all.push({
          id: v.id,
          category: "vessels",
          title: v.name,
          subtitle: [v.vessel_type, v.flag_state].filter(Boolean).join(" · "),
          href: `/intel/vessels/${v.id}`,
        });
      }
    }

    if (companies.data) {
      for (const c of companies.data) {
        all.push({
          id: c.id,
          category: "companies",
          title: c.name,
          subtitle: [c.company_type, c.country].filter(Boolean).join(" · "),
          href: `/intel/companies/${c.id}`,
        });
      }
    }

    if (profiles.data) {
      for (const p of profiles.data) {
        all.push({
          id: p.id,
          category: "seafarers",
          title: p.display_name,
          subtitle: [p.rank_range, p.department_tag].filter(Boolean).join(" · "),
          href: `/community/seafarers/${p.id}`,
        });
      }
    }

    if (forums.data) {
      for (const f of forums.data) {
        all.push({
          id: f.id,
          category: "forums",
          title: f.title ?? "Untitled post",
          subtitle: null,
          href: `/community/forums/post/${f.id}`,
        });
      }
    }

    if (certs.data) {
      for (const c of certs.data) {
        all.push({
          id: c.id,
          category: "certificates",
          title: c.title,
          subtitle: [c.cert_type, c.expiry_date ? `Exp: ${c.expiry_date}` : null]
            .filter(Boolean)
            .join(" · "),
          href: `/career/certs`,
        });
      }
    }

    return all;
  }, []);

  function navigate(result: SearchResult) {
    setOpen(false);
    router.push(result.href);
  }

  // Keyboard navigation within results
  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      navigate(results[activeIndex]);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!open) return null;

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  const categoryOrder: SearchResult["category"][] = [
    "vessels",
    "companies",
    "seafarers",
    "forums",
    "certificates",
  ];

  // Build flat index for keyboard nav
  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 bg-navy-900 border border-navy-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-700">
          <SearchIcon className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search vessels, companies, seafarers..."
            className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-sm outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <Spinner />}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-navy-800 border border-navy-600 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto overscroll-contain">
          {/* Empty state: no query yet */}
          {!query.trim() && !loading && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Type to search across SeaSignal
            </div>
          )}

          {/* No results */}
          {query.trim() && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Grouped results */}
          {categoryOrder.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            const meta = CATEGORY_META[cat];
            return (
              <div key={cat}>
                <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-600 font-medium flex items-center gap-1.5">
                  <meta.icon className="w-3.5 h-3.5" />
                  {meta.label}
                </div>
                {items.map((result) => {
                  const idx = flatIdx++;
                  return (
                    <button
                      key={result.id}
                      data-index={idx}
                      onClick={() => navigate(result)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                        idx === activeIndex
                          ? "bg-navy-800 text-teal-400"
                          : "text-slate-300 hover:bg-navy-800/50 hover:text-slate-100"
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{result.title}</span>
                        {result.subtitle && (
                          <span className="block truncate text-xs text-slate-500">
                            {result.subtitle}
                          </span>
                        )}
                      </span>
                      <ArrowIcon className="w-4 h-4 text-slate-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-navy-700 flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-navy-800 border border-navy-600 rounded text-[10px]">&uarr;</kbd>
              <kbd className="px-1 py-0.5 bg-navy-800 border border-navy-600 rounded text-[10px]">&darr;</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-navy-800 border border-navy-600 rounded text-[10px]">&crarr;</kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-navy-800 border border-navy-600 rounded text-[10px]">esc</kbd>
              close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Trigger button for use in nav */
export function SearchTrigger({ collapsed }: { collapsed?: boolean }) {
  return (
    <button
      onClick={() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
        );
      }}
      className="text-slate-400 hover:text-slate-100 shrink-0 flex items-center gap-1.5"
      aria-label="Search"
      title="Search (⌘K)"
    >
      <SearchIcon className="w-4 h-4" />
      {!collapsed && (
        <kbd className="hidden sm:inline-flex items-center px-1 py-0.5 text-[10px] font-medium text-slate-500 bg-navy-800 border border-navy-600 rounded">
          ⌘K
        </kbd>
      )}
    </button>
  );
}

// --- Icons ---

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 text-teal-500 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function VesselIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 14s1 3 7 3 7-3 7-3H3zm7-12l-3 8h6L10 2z" />
    </svg>
  );
}

function CompanyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SeafarersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

function ForumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
    </svg>
  );
}

function CertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z"
        clipRule="evenodd"
      />
    </svg>
  );
}
