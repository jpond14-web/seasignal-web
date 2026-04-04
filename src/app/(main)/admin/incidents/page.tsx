"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Incident = Tables<"incident_logs">;

export default function AdminIncidentsPage() {
  const supabase = createClient();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("incident_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setIncidents(data ?? []);
        setLoading(false);
      });
  }, []);

  function categoryBadge(category: string) {
    const colors: Record<string, string> = {
      safety: "bg-red-500/10 text-red-400 border-red-500/30",
      maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      wages: "bg-green-500/10 text-green-400 border-green-500/30",
      harassment: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      contract: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      other: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${
          colors[category] ?? colors.other
        }`}
      >
        {category}
      </span>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Incident Logs</h1>

      {loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <p className="text-slate-400">Loading incidents...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No incidents logged yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-100 text-sm">{inc.title}</h3>
                    {categoryBadge(inc.category)}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {inc.incident_date && (
                      <p className="text-xs text-slate-500">
                        Incident date: {new Date(inc.incident_date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Reported: {new Date(inc.created_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 shrink-0 font-mono">
                  {inc.id.slice(0, 8)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
