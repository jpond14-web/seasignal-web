"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

const categoryColors = [
  "bg-teal-500/20 text-teal-400",
  "bg-cyan-400/20 text-cyan-400",
  "bg-blue-500/20 text-blue-400",
  "bg-purple-500/20 text-purple-400",
  "bg-amber-500/20 text-amber-400",
  "bg-green-500/20 text-green-400",
  "bg-red-500/20 text-red-400",
  "bg-orange-400/20 text-orange-400",
];

export default function ForumsPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Tables<"forum_categories">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("forum_categories")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setCategories(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-navy-800/50 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-navy-800/50 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-16 bg-navy-800/50 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms`, animationDuration: "1.5s" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Forums</h1>
        <Link
          href="/forums/new"
          className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No forum categories yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, index) => {
            const colorClass = categoryColors[index % categoryColors.length];
            const initial = cat.name.charAt(0).toUpperCase();

            return (
              <Link
                key={cat.id}
                href={`/forums/${cat.slug}`}
                className="flex items-center gap-4 bg-navy-900 border border-navy-700 rounded-lg p-4 card-hover"
              >
                {/* Category icon */}
                <div
                  className={`w-10 h-10 rounded-full border border-navy-700 flex items-center justify-center flex-shrink-0 text-sm font-bold ${colorClass}`}
                >
                  {initial}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-100 capitalize">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-slate-400 mt-0.5">{cat.description}</p>
                  )}
                </div>

                <div className="text-right shrink-0 ml-4">
                  <p className="text-lg font-mono font-bold text-slate-300">{cat.post_count}</p>
                  <p className="text-xs text-slate-500">posts</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
