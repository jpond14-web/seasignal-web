"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

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

  if (loading) return <div className="max-w-3xl mx-auto"><p className="text-slate-400">Loading...</p></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Forums</h1>

      {categories.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No forum categories yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/forums/${cat.slug}`}
              className="flex items-center justify-between bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors"
            >
              <div>
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
          ))}
        </div>
      )}
    </div>
  );
}
