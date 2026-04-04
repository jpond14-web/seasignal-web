"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/lib/supabase/types";

type CrewEntry = {
  id: string;
  rank_held: string;
  joined_at: string | null;
  left_at: string | null;
  is_current: boolean;
  vessel: { id: string; name: string; vessel_type: Enums<"vessel_type"> } | null;
};

const DEPT_COLORS: Record<string, string> = {
  deck: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  engine: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  electro: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  catering: "bg-green-500/20 text-green-400 border-green-500/30",
};

const AVAILABLE_FOR_OPTIONS = [
  { value: "jobs", label: "Jobs" },
  { value: "mentoring", label: "Mentoring" },
  { value: "networking", label: "Networking" },
  { value: "advice", label: "Advice" },
];

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export default function SeafarerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [crewHistory, setCrewHistory] = useState<CrewEntry[]>([]);
  const [forumPostCount, setForumPostCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [sharedVessels, setSharedVessels] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      // Get current user's profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        if (myProfile) setMyProfileId(myProfile.id);
      }

      // Get the seafarer's profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Fetch crew history with vessel info
      const { data: crewData } = await supabase
        .from("crew_history")
        .select("id, rank_held, joined_at, left_at, is_current, vessel:vessels(id, name, vessel_type)")
        .eq("profile_id", profileId)
        .order("is_current", { ascending: false })
        .order("left_at", { ascending: false, nullsFirst: true });

      if (crewData) {
        setCrewHistory(
          crewData.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            rank_held: c.rank_held as string,
            joined_at: c.joined_at as string | null,
            left_at: c.left_at as string | null,
            is_current: c.is_current as boolean,
            vessel: c.vessel as CrewEntry["vessel"],
          }))
        );
      }

      // Forum post count
      const { count: postCount } = await supabase
        .from("forum_posts")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profileId);
      setForumPostCount(postCount || 0);

      // Review count
      const { count: revCount } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profileId);
      setReviewCount(revCount || 0);

      setLoading(false);
    }
    load();
  }, [profileId, supabase]);

  // Find shared vessels once both profiles loaded
  useEffect(() => {
    async function findShared() {
      if (!myProfileId || myProfileId === profileId) return;
      const { data: myVessels } = await supabase
        .from("crew_history")
        .select("vessel:vessels(name)")
        .eq("profile_id", myProfileId);
      const { data: theirVessels } = await supabase
        .from("crew_history")
        .select("vessel:vessels(name)")
        .eq("profile_id", profileId);

      if (myVessels && theirVessels) {
        const myNames = new Set(
          myVessels
            .map((v: Record<string, unknown>) => {
              const vessel = v.vessel as { name: string } | null;
              return vessel?.name;
            })
            .filter(Boolean)
        );
        const shared = theirVessels
          .map((v: Record<string, unknown>) => {
            const vessel = v.vessel as { name: string } | null;
            return vessel?.name;
          })
          .filter((name): name is string => !!name && myNames.has(name));
        setSharedVessels([...new Set(shared)]);
      }
    }
    findShared();
  }, [myProfileId, profileId, supabase]);

  async function handleSendMessage() {
    if (!myProfileId || sendingMessage) return;
    setSendingMessage(true);

    // Check if DM already exists between us
    const { data: myConvos } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("profile_id", myProfileId);

    const { data: theirConvos } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("profile_id", profileId);

    if (myConvos && theirConvos) {
      const myIds = new Set(myConvos.map((c) => c.conversation_id));
      const sharedConvoIds = theirConvos
        .map((c) => c.conversation_id)
        .filter((id) => myIds.has(id));

      for (const convoId of sharedConvoIds) {
        const { data: convo } = await supabase
          .from("conversations")
          .select("id, type")
          .eq("id", convoId)
          .eq("type", "dm")
          .single();
        if (convo) {
          router.push(`/messages?conversation=${convo.id}`);
          return;
        }
      }
    }

    // Create a new DM conversation
    const { data: newConvo, error: convoErr } = await supabase
      .from("conversations")
      .insert({ type: "dm" as const, created_by: myProfileId })
      .select("id")
      .single();

    if (convoErr || !newConvo) {
      setSendingMessage(false);
      return;
    }

    // Add both members
    await supabase.from("conversation_members").insert([
      { conversation_id: newConvo.id, profile_id: myProfileId, role: "member" },
      { conversation_id: newConvo.id, profile_id: profileId, role: "member" },
    ]);

    router.push(`/messages?conversation=${newConvo.id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-slate-400 mb-4">Seafarer not found.</p>
        <Link
          href="/seafarers"
          className="text-teal-400 hover:text-teal-300 text-sm"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  const online = isOnline(profile.last_seen_at);
  const availableFor = (profile as Record<string, unknown>).available_for as string[] | undefined;
  const currentPort = (profile as Record<string, unknown>).current_port as string | null;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/seafarers"
        className="text-sm text-slate-400 hover:text-teal-400 transition-colors mb-4 inline-block"
      >
        &larr; Back to Directory
      </Link>

      {/* Profile Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-navy-700 flex items-center justify-center text-3xl font-bold text-teal-400">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                profile.display_name.charAt(0).toUpperCase()
              )}
            </div>
            {online && (
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full ring-2 ring-navy-900" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-100">
                {profile.display_name}
              </h1>
              {profile.is_verified && (
                <svg
                  className="w-5 h-5 text-teal-500 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {online && (
                <span className="text-xs text-green-400">Online</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {profile.department_tag && (
                <span
                  className={`px-2 py-0.5 text-xs rounded border ${DEPT_COLORS[profile.department_tag] || "bg-navy-800 text-slate-400 border-navy-600"}`}
                >
                  {formatEnum(profile.department_tag)}
                </span>
              )}
              {profile.rank_range && (
                <span className="px-2 py-0.5 text-xs bg-navy-800 text-slate-300 border border-navy-600 rounded">
                  {formatEnum(profile.rank_range)}
                </span>
              )}
              {profile.experience_band && (
                <span className="px-2 py-0.5 text-xs bg-navy-800 text-slate-300 border border-navy-600 rounded">
                  {formatEnum(profile.experience_band)}
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="text-slate-300 text-sm mt-3">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-navy-700">
          <div>
            <p className="text-xs text-slate-500">Home Port</p>
            <p className="text-sm text-slate-200 mt-0.5">
              {profile.home_port || <span className="text-slate-600">&mdash;</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current Port</p>
            <p className="text-sm text-slate-200 mt-0.5">
              {currentPort || <span className="text-slate-600">&mdash;</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Forum Posts</p>
            <p className="text-sm font-mono text-teal-400 mt-0.5">{forumPostCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Reviews</p>
            <p className="text-sm font-mono text-teal-400 mt-0.5">{reviewCount}</p>
          </div>
        </div>

        {/* Vessel Types */}
        {profile.vessel_type_tags && profile.vessel_type_tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-navy-700">
            <p className="text-xs text-slate-500 mb-2">Vessel Types</p>
            <div className="flex flex-wrap gap-2">
              {profile.vessel_type_tags.map((vt) => (
                <span
                  key={vt}
                  className="px-2 py-1 text-xs bg-navy-800 border border-navy-600 rounded text-slate-300"
                >
                  {formatEnum(vt)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Available For */}
        {availableFor && availableFor.length > 0 && (
          <div className="mt-4 pt-4 border-t border-navy-700">
            <p className="text-xs text-slate-500 mb-2">Available For</p>
            <div className="flex flex-wrap gap-2">
              {availableFor.map((a) => {
                const opt = AVAILABLE_FOR_OPTIONS.find((o) => o.value === a);
                return (
                  <span
                    key={a}
                    className="px-2 py-1 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded"
                  >
                    {opt?.label || formatEnum(a)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Send Message button */}
        {myProfileId && myProfileId !== profileId && (
          <div className="mt-6 pt-6 border-t border-navy-700">
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium rounded text-sm transition-colors"
            >
              {sendingMessage ? "Opening conversation..." : "Send Message"}
            </button>
          </div>
        )}
      </div>

      {/* Crew History */}
      {crewHistory.length > 0 && (
        <div className="mt-6 bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Crew History
          </h2>
          <div className="space-y-3">
            {crewHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-navy-800 rounded border border-navy-700"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {entry.vessel ? (
                      <Link
                        href={`/vessels/${entry.vessel.id}`}
                        className="text-sm font-medium text-teal-400 hover:text-teal-300"
                      >
                        {entry.vessel.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-slate-400">Unknown Vessel</span>
                    )}
                    {entry.is_current && (
                      <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.rank_held}
                    {entry.vessel &&
                      ` - ${formatEnum(entry.vessel.vessel_type)}`}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {formatDate(entry.joined_at)}
                  {entry.joined_at && " - "}
                  {entry.is_current ? "Present" : formatDate(entry.left_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Vessels / Connect Section */}
      {myProfileId && myProfileId !== profileId && sharedVessels.length > 0 && (
        <div className="mt-6 bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">
            Connections
          </h2>
          <p className="text-sm text-slate-400 mb-2">
            You have served on shared vessels:
          </p>
          <div className="flex flex-wrap gap-2">
            {sharedVessels.map((name) => (
              <span
                key={name}
                className="px-2 py-1 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
