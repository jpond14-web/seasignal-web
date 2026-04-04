import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";

/**
 * Track a search query anonymously for analytics.
 * Fire-and-forget — does not block the caller.
 */
export function trackSearch(
  type: string,
  query: string,
  filters: Record<string, string | undefined>,
  resultCount: number
) {
  const supabase = createClient();

  // Strip undefined values for clean JSON storage
  const cleanFilters: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined) cleanFilters[k] = v;
  }

  supabase
    .from("search_analytics")
    .insert({
      search_type: type,
      search_query: query,
      filters: cleanFilters as unknown as Json,
      result_count: resultCount,
    })
    .then(({ error }) => {
      if (error && process.env.NODE_ENV !== "production") {
        console.error("[analytics] trackSearch failed:", error.message);
      }
    });
}
