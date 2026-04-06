"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type PortChannel = Tables<"conversations"> & { member_count: number | null };

export default function PortBeaconPage() {
  const supabase = createClient();

  const [channels, setChannels] = useState<PortChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [portName, setPortName] = useState("");
  const [country, setCountry] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("type", "port_channel")
      .order("last_activity_at", { ascending: false, nullsFirst: false });
    if (data) setChannels(data as PortChannel[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        await fetchChannels();
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (profile) setProfileId(profile.id);
      await fetchChannels();
    })();
  }, [supabase, fetchChannels]);

  const handleCreate = async () => {
    if (!profileId) return;
    if (portName.length < 2) {
      setError("Port name must be at least 2 characters.");
      return;
    }
    setCreating(true);
    setError(null);

    // Check if a port channel already exists for this port
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("type", "port_channel")
      .ilike("context_port", portName.trim())
      .limit(1)
      .single();

    if (existing) {
      // Join existing channel
      await supabase.from("conversation_members").upsert(
        {
          conversation_id: existing.id,
          profile_id: profileId,
          role: "member",
        },
        { onConflict: "conversation_id,profile_id" }
      );
      setCreating(false);
      setShowCreate(false);
      setPortName("");
      setCountry("");
      await fetchChannels();
      return;
    }

    const displayName = portName.trim() + (country.trim() ? `, ${country.trim()}` : "");
    const { data: convo, error: insertErr } = await supabase
      .from("conversations")
      .insert({
        type: "port_channel" as const,
        context_port: portName.trim(),
        country_code: country.trim() || null,
        name: displayName + " Port",
        created_by: profileId,
        auto_joinable: true,
        access_mode: "open",
      })
      .select()
      .single();

    if (insertErr) {
      setError(insertErr.message);
    } else if (convo) {
      await supabase.from("conversation_members").insert({
        conversation_id: convo.id,
        profile_id: profileId,
        role: "admin",
      });
      setPortName("");
      setCountry("");
      setShowCreate(false);
      await fetchChannels();
    }
    setCreating(false);
  };

  const handleJoin = async (conversationId: string) => {
    if (!profileId) return;
    await supabase.from("conversation_members").upsert(
      {
        conversation_id: conversationId,
        profile_id: profileId,
        role: "member",
      },
      { onConflict: "conversation_id,profile_id" }
    );
  };

  const filteredChannels = channels.filter(
    (c) =>
      (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.context_port ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date: string | null) => {
    if (!date) return "No activity";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Active now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="animate-pulse text-slate-500 text-sm">
          Loading port channels...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">
          Connect with seafarers in the same port.
        </p>
        {profileId && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            Signal Your Port
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search ports..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm mb-6"
      />

      {/* Create Form */}
      {showCreate && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-slate-100 font-semibold mb-3">
            Signal Your Port
          </h3>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Port name (e.g. Rotterdam, Singapore)"
              value={portName}
              onChange={(e) => setPortName(e.target.value)}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <input
              type="text"
              placeholder="Country (optional)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {creating ? "Creating..." : "Create Port Channel"}
            </button>
          </div>
        </div>
      )}

      {/* Channel List */}
      {filteredChannels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">
            {search
              ? "No port channels match your search."
              : "No port channels yet. Signal your port to start connecting!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredChannels.map((ch) => (
            <Link
              key={ch.id}
              href={`/messages/${ch.id}`}
              onClick={() => handleJoin(ch.id)}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors block"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-slate-100 font-semibold text-sm truncate">
                    {ch.name ?? ch.context_port ?? "Unknown Port"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {ch.country_code && (
                      <span className="text-xs text-slate-400">
                        {ch.country_code}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {ch.member_count ?? 0} members
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTime(ch.last_activity_at)}
                    </span>
                  </div>
                </div>
                <span className="text-slate-500 text-xs ml-3">Join &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
