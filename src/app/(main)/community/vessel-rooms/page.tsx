"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type VesselRoom = Tables<"conversations"> & { member_count: number | null };

type VesselOption = { id: string; name: string; imo_number: string | null };

export default function VesselRoomsPage() {
  const supabase = createClient();

  const [rooms, setRooms] = useState<VesselRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentVessel, setCurrentVessel] = useState<{
    vessel_id: string;
    vessel_name: string;
    room: VesselRoom | null;
  } | null>(null);

  // Create room modal state
  const [showCreate, setShowCreate] = useState(false);
  const [vesselSearch, setVesselSearch] = useState("");
  const [vesselResults, setVesselResults] = useState<VesselOption[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<VesselOption | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("type", "vessel_channel")
      .order("last_activity_at", { ascending: false, nullsFirst: false });
    if (data) setRooms(data as VesselRoom[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (profile) {
        setProfileId(profile.id);

        // Get current vessel from crew_history
        const { data: crew } = await supabase
          .from("crew_history")
          .select("vessel_id")
          .eq("profile_id", profile.id)
          .eq("is_current", true)
          .limit(1)
          .single();

        if (crew?.vessel_id) {
          const { data: vessel } = await supabase
            .from("vessels")
            .select("id, name")
            .eq("id", crew.vessel_id)
            .single();

          if (vessel) {
            // Check if there's already a room for this vessel
            const { data: existingRoom } = await supabase
              .from("conversations")
              .select("*")
              .eq("type", "vessel_channel")
              .eq("context_vessel_id", vessel.id)
              .limit(1)
              .single();

            setCurrentVessel({
              vessel_id: vessel.id,
              vessel_name: vessel.name,
              room: existingRoom as VesselRoom | null,
            });
          }
        }
      }
      await fetchRooms();
    })();
  }, [supabase, fetchRooms]);

  // Search vessels for create modal
  useEffect(() => {
    if (vesselSearch.length < 2) {
      setVesselResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("vessels")
        .select("id, name, imo_number")
        .ilike("name", `%${vesselSearch}%`)
        .limit(10);
      if (data) setVesselResults(data);
    }, 300);
    return () => clearTimeout(timeout);
  }, [vesselSearch, supabase]);

  const handleCreateRoom = async () => {
    if (!profileId || !selectedVessel) return;
    setCreating(true);

    // Check if room already exists for this vessel
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("type", "vessel_channel")
      .eq("context_vessel_id", selectedVessel.id)
      .limit(1)
      .single();

    if (existing) {
      // Just join the existing room
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
      setSelectedVessel(null);
      setVesselSearch("");
      return;
    }

    const { data: convo, error } = await supabase
      .from("conversations")
      .insert({
        type: "vessel_channel" as const,
        context_vessel_id: selectedVessel.id,
        name: selectedVessel.name + " Room",
        created_by: profileId,
        auto_joinable: true,
        access_mode: "open",
      })
      .select()
      .single();

    if (convo && !error) {
      await supabase.from("conversation_members").insert({
        conversation_id: convo.id,
        profile_id: profileId,
        role: "admin",
      });
      await fetchRooms();
    }

    setCreating(false);
    setShowCreate(false);
    setSelectedVessel(null);
    setVesselSearch("");
  };

  const handleJoinRoom = async (conversationId: string) => {
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

  const filteredRooms = rooms.filter((r) =>
    (r.name ?? "").toLowerCase().includes(search.toLowerCase())
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
          Loading vessel rooms...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-slate-400 text-sm">
            Private channels for current and former crew of specific vessels.
          </p>
        </div>
        {profileId && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            Create Room
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search vessel rooms..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm mb-6"
      />

      {/* Create Room Form */}
      {showCreate && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-slate-100 font-semibold mb-3">
            Create a Vessel Room
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search for a vessel by name..."
              value={vesselSearch}
              onChange={(e) => {
                setVesselSearch(e.target.value);
                setSelectedVessel(null);
              }}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            {vesselResults.length > 0 && !selectedVessel && (
              <div className="bg-navy-800 border border-navy-600 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {vesselResults.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVessel(v);
                      setVesselSearch(v.name);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-navy-700 text-slate-200 text-sm border-b border-navy-700 last:border-b-0"
                  >
                    {v.name}
                    {v.imo_number && (
                      <span className="text-slate-500 ml-2">
                        IMO {v.imo_number}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedVessel && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  Selected:{" "}
                  <span className="text-teal-400 font-medium">
                    {selectedVessel.name}
                  </span>
                </span>
                <button
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
                >
                  {creating ? "Creating..." : "Create Room"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Vessel Card */}
      {currentVessel && (
        <div className="bg-navy-900 border border-teal-500/30 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-teal-400 font-medium uppercase tracking-wider mb-1">
                Your Current Vessel
              </p>
              <h3 className="text-slate-100 font-semibold text-lg">
                {currentVessel.vessel_name}
              </h3>
            </div>
            {currentVessel.room ? (
              <Link
                href={`/messages/${currentVessel.room.id}`}
                onClick={() => handleJoinRoom(currentVessel.room!.id)}
                className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Open
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSelectedVessel({
                    id: currentVessel.vessel_id,
                    name: currentVessel.vessel_name,
                    imo_number: null,
                  });
                  setShowCreate(true);
                }}
                className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Create Room
              </button>
            )}
          </div>
        </div>
      )}

      {/* Room List */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">
            {search
              ? "No vessel rooms match your search."
              : "No vessel rooms yet. Create one for your ship!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredRooms.map((room) => (
            <Link
              key={room.id}
              href={`/messages/${room.id}`}
              onClick={() => handleJoinRoom(room.id)}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors block"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-slate-100 font-semibold text-sm truncate">
                    {room.name ?? "Unnamed Vessel Room"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">
                      {room.member_count ?? 0} members
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTime(room.last_activity_at)}
                    </span>
                  </div>
                </div>
                <span className="text-slate-500 text-xs ml-3">Open &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
