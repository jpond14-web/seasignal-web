"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ConversationWithMeta, ConversationType, FoundUser, DepartmentType, RankCategory, VesselType } from "@/components/messages/types";
import ConversationItem from "@/components/messages/ConversationItem";
import NewConversationPanel from "@/components/messages/NewConversationPanel";
import ChannelBrowserPanel from "@/components/messages/ChannelBrowserPanel";

type Tab = "direct" | "channels";

const CHANNEL_TYPES: ConversationType[] = ["channel", "vessel_channel", "company_channel", "port_channel"];

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function isChannel(type: ConversationType): boolean {
  return CHANNEL_TYPES.includes(type);
}

export default function MessagesPage() {
  const supabase = createClient();
  const supabaseRef = useRef(supabase);
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [allChannels, setAllChannels] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("direct");
  const [showNew, setShowNew] = useState(false);
  const [showChannelBrowser, setShowChannelBrowser] = useState(false);
  const [newType, setNewType] = useState<"dm" | "group">("dm");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<FoundUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Discovery filters
  const [filterDepartment, setFilterDepartment] = useState<DepartmentType | "">("");
  const [filterRank, setFilterRank] = useState<RankCategory | "">("");
  const [filterVesselType, setFilterVesselType] = useState<VesselType | "">("");

  // Channel creation
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelType, setNewChannelType] = useState<ConversationType>("channel");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState("");

  // Heartbeat: update last_seen_at
  useEffect(() => {
    const sb = supabaseRef.current;
    async function heartbeat() {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: profile } = await sb.from("profiles").select("id").eq("auth_user_id", user.id).single();
        if (profile) {
          await sb.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profile.id);
        }
      }
    }
    heartbeat();
    const interval = setInterval(heartbeat, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close actions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setOpenActionsId(null);
      }
    }
    if (openActionsId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openActionsId]);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) return;
    setProfileId(profile.id);

    // Get user's memberships with pin/archive state
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at, is_pinned, is_archived, is_muted")
      .eq("profile_id", profile.id);

    if (!memberships || memberships.length === 0) {
      // Auto-join system channels for new users
      const { data: systemChannels } = await supabase
        .from("conversations")
        .select("id")
        .eq("is_system", true);

      if (systemChannels && systemChannels.length > 0) {
        const joins = systemChannels.map(ch => ({
          conversation_id: ch.id,
          profile_id: profile.id,
          role: "member" as const,
        }));
        await supabase.from("conversation_members").insert(joins);
        // Reload after auto-joining
        setLoading(false);
        load();
        return;
      }
      setLoading(false);
      return;
    }

    const membershipMap = new Map(memberships.map(m => [m.conversation_id, m]));
    const ids = memberships.map((m) => m.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", ids)
      .order("updated_at", { ascending: false });

    if (!convos) { setLoading(false); return; }

    // --- Batch query: unread counts ---
    const earliestLastRead = memberships.reduce<string | null>((earliest, m) => {
      if (!m.last_read_at) return null;
      if (earliest === null) return null;
      return m.last_read_at < earliest ? m.last_read_at : earliest;
    }, memberships[0]?.last_read_at ?? null);

    let unreadQuery = supabase
      .from("messages")
      .select("conversation_id, created_at")
      .in("conversation_id", ids)
      .neq("sender_id", profile.id);

    if (earliestLastRead) {
      unreadQuery = unreadQuery.gt("created_at", earliestLastRead);
    }

    const { data: unreadMessages } = await unreadQuery;

    const unreadCountMap = new Map<string, number>();
    if (unreadMessages) {
      for (const msg of unreadMessages) {
        const membership = membershipMap.get(msg.conversation_id);
        const lastRead = membership?.last_read_at;
        if (!lastRead || msg.created_at > lastRead) {
          unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) || 0) + 1);
        }
      }
    }

    // --- Batch query: all conversation_members for all conversations ---
    const { data: allMembers } = await supabase
      .from("conversation_members")
      .select("conversation_id, profile_id")
      .in("conversation_id", ids);

    const memberCountMap = new Map<string, number>();
    const dmPartnerIdMap = new Map<string, string>();
    const dmConvoIds = new Set(convos.filter(c => c.type === "dm").map(c => c.id));
    const nonDmConvoIds = new Set(convos.filter(c => c.type !== "dm").map(c => c.id));

    if (allMembers) {
      for (const m of allMembers) {
        if (nonDmConvoIds.has(m.conversation_id)) {
          memberCountMap.set(m.conversation_id, (memberCountMap.get(m.conversation_id) || 0) + 1);
        }
        if (dmConvoIds.has(m.conversation_id) && m.profile_id !== profile.id) {
          dmPartnerIdMap.set(m.conversation_id, m.profile_id);
        }
      }
    }

    // --- Batch query: DM partner profiles ---
    const partnerIds = [...new Set(dmPartnerIdMap.values())];
    const partnerProfileMap = new Map<string, { display_name: string; last_seen_at: string | null }>();
    if (partnerIds.length > 0) {
      const { data: partnerProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, last_seen_at")
        .in("id", partnerIds);
      if (partnerProfiles) {
        for (const p of partnerProfiles) {
          partnerProfileMap.set(p.id, { display_name: p.display_name, last_seen_at: p.last_seen_at });
        }
      }
    }

    // --- Assemble enriched conversations ---
    const enriched: ConversationWithMeta[] = convos.map(c => {
      const membership = membershipMap.get(c.id);
      const partnerId = dmPartnerIdMap.get(c.id);
      const partner = partnerId ? partnerProfileMap.get(partnerId) : undefined;

      return {
        ...c,
        is_pinned: membership?.is_pinned || false,
        is_archived: membership?.is_archived || false,
        is_muted: membership?.is_muted || false,
        last_read_at: membership?.last_read_at,
        unread_count: unreadCountMap.get(c.id) || 0,
        dm_partner_name: partner?.display_name,
        dm_partner_online: partner ? isOnline(partner.last_seen_at) : false,
        member_count: memberCountMap.get(c.id) || 0,
      };
    });

    setConversations(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Load browseable channels
  useEffect(() => {
    if (tab === "channels") loadChannels();
  }, [tab]);

  async function loadChannels() {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .in("type", CHANNEL_TYPES)
      .order("updated_at", { ascending: false });

    if (!data) { setAllChannels([]); return; }

    const channelIds = data.map(c => c.id);
    const { data: memberRows } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .in("conversation_id", channelIds);

    const countMap = new Map<string, number>();
    if (memberRows) {
      for (const m of memberRows) {
        countMap.set(m.conversation_id, (countMap.get(m.conversation_id) || 0) + 1);
      }
    }

    const enriched = data.map(c => ({
      ...c,
      member_count: countMap.get(c.id) || 0,
    }));

    setAllChannels(enriched as ConversationWithMeta[]);
  }

  async function handleSearchUsers(q: string) {
    setSearchUser(q);
    if (q.length < 2 && !filterDepartment && !filterRank && !filterVesselType) {
      setFoundUsers([]);
      return;
    }

    let query = supabase
      .from("profiles")
      .select("id, display_name, department_tag, rank_range, vessel_type_tags, last_seen_at")
      .neq("id", profileId!)
      .limit(20);

    if (q.length >= 2) {
      query = query.ilike("display_name", `%${q}%`);
    }
    if (filterDepartment) {
      query = query.eq("department_tag", filterDepartment);
    }
    if (filterRank) {
      query = query.eq("rank_range", filterRank);
    }
    if (filterVesselType) {
      query = query.contains("vessel_type_tags", [filterVesselType]);
    }

    const { data } = await query;
    setFoundUsers((data as FoundUser[]) || []);
  }

  // Re-search when filters change
  useEffect(() => {
    if (showNew && (searchUser.length >= 2 || filterDepartment || filterRank || filterVesselType)) {
      handleSearchUsers(searchUser);
    }
  }, [filterDepartment, filterRank, filterVesselType]);

  async function createConversation() {
    if (!profileId || selectedUsers.length === 0) return;
    setCreating(true);

    // For DMs, check if a conversation already exists with this user
    if (newType === "dm" && selectedUsers.length === 1) {
      const targetId = selectedUsers[0].id;
      const { data: myDmMemberships } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("profile_id", profileId);

      if (myDmMemberships && myDmMemberships.length > 0) {
        const myConvoIds = myDmMemberships.map(m => m.conversation_id);
        const { data: existingDm } = await supabase
          .from("conversation_members")
          .select("conversation_id, conversations!inner(type)")
          .eq("profile_id", targetId)
          .in("conversation_id", myConvoIds);

        const dmMatch = existingDm?.find(
          (m) => (m.conversations as unknown as { type: string })?.type === "dm"
        );
        if (dmMatch) {
          setCreating(false);
          setShowNew(false);
          setSelectedUsers([]);
          router.push(`/messages/${dmMatch.conversation_id}`);
          return;
        }
      }
    }

    const { data: convo, error } = await supabase.from("conversations").insert({
      type: newType,
      name: newType === "group" ? newName || null : null,
      description: newType === "group" ? newDescription || null : null,
      is_encrypted: false,
      created_by: profileId,
    }).select("id").single();

    if (error || !convo) { setCreating(false); return; }

    const members = [
      { conversation_id: convo.id, profile_id: profileId, role: "admin" },
      ...selectedUsers.map((u) => ({ conversation_id: convo.id, profile_id: u.id, role: "member" })),
    ];
    await supabase.from("conversation_members").insert(members);

    setCreating(false);
    setShowNew(false);
    setSelectedUsers([]);
    setNewName("");
    setNewDescription("");
    setFilterDepartment("");
    setFilterRank("");
    setFilterVesselType("");
    router.push(`/messages/${convo.id}`);
  }

  async function createChannel() {
    if (!profileId || !newChannelName.trim()) return;
    setCreatingChannel(true);

    const { data: convo, error } = await supabase.from("conversations").insert({
      type: newChannelType,
      name: newChannelName.trim(),
      description: newChannelDesc.trim() || null,
      created_by: profileId,
      access_mode: "open",
      is_system: false,
    }).select("id").single();

    if (error || !convo) { setCreatingChannel(false); return; }

    await supabase.from("conversation_members").insert({
      conversation_id: convo.id,
      profile_id: profileId,
      role: "admin",
    });

    setCreatingChannel(false);
    setShowChannelBrowser(false);
    setNewChannelName("");
    setNewChannelDesc("");
    router.push(`/messages/${convo.id}`);
  }

  async function joinChannel(channelId: string) {
    if (!profileId) return;
    try {
      const res = await fetch("/api/channels/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: channelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Failed to join channel");
        return;
      }
      setJoinError(null);
      router.push(`/messages/${channelId}`);
    } catch {
      setJoinError("Network error. Please try again.");
    }
  }

  async function togglePin(convoId: string, currentlyPinned: boolean) {
    if (!profileId) return;
    await supabase.from("conversation_members")
      .update({ is_pinned: !currentlyPinned })
      .eq("conversation_id", convoId)
      .eq("profile_id", profileId);
    load();
  }

  async function toggleArchive(convoId: string, currentlyArchived: boolean) {
    if (!profileId) return;
    await supabase.from("conversation_members")
      .update({ is_archived: !currentlyArchived })
      .eq("conversation_id", convoId)
      .eq("profile_id", profileId);
    load();
  }

  async function toggleMute(convoId: string, currentlyMuted: boolean) {
    if (!profileId) return;
    await supabase.from("conversation_members")
      .update({ is_muted: !currentlyMuted })
      .eq("conversation_id", convoId)
      .eq("profile_id", profileId);
    load();
  }

  function handleSelectUser(user: FoundUser) {
    setSelectedUsers((prev) => prev.find((p) => p.id === user.id) ? prev : [...prev, user]);
    setSearchUser("");
    setFoundUsers([]);
  }

  function handleRemoveUser(userId: string) {
    setSelectedUsers((p) => p.filter((x) => x.id !== userId));
  }

  // Sort and section conversations
  const myConvos = conversations.filter(c =>
    tab === "direct" ? !isChannel(c.type) : isChannel(c.type)
  );
  const activeConvos = myConvos.filter(c => !c.is_archived);
  const archivedConvos = myConvos.filter(c => c.is_archived);
  const pinnedConvos = activeConvos.filter(c => c.is_pinned);
  const unreadConvos = activeConvos.filter(c => !c.is_pinned && (c.unread_count || 0) > 0);
  const readConvos = activeConvos.filter(c => !c.is_pinned && (c.unread_count || 0) === 0);

  // Total unread for the nav badge (across all convos, excluding muted)
  const totalUnread = conversations.reduce((sum, c) => c.is_muted ? sum : sum + (c.unread_count || 0), 0);

  // Channels the user has NOT joined (for browsing)
  const joinedChannelIds = new Set(conversations.filter(c => isChannel(c.type)).map(c => c.id));
  const unjoinedChannels = allChannels.filter(c => !joinedChannelIds.has(c.id));

  function renderSection(title: string, items: ConversationWithMeta[]) {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2 px-1">{title}</p>
        <div className="space-y-1.5">
          {items.map(c => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActionsOpen={openActionsId === c.id}
              onToggleActions={setOpenActionsId}
              onTogglePin={togglePin}
              onToggleMute={toggleMute}
              onToggleArchive={toggleArchive}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Messages</h1>
          {totalUnread > 0 && (
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-teal-500 text-navy-950 text-xs font-bold rounded-full">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={() => { tab === "direct" ? setShowNew(!showNew) : setShowChannelBrowser(!showChannelBrowser); }}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
        >
          {tab === "direct" ? "+ New Message" : "+ Browse Channels"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-navy-900 rounded-lg p-1 border border-navy-700">
        <button
          onClick={() => setTab("direct")}
          className={`flex-1 py-2 text-sm rounded font-medium transition-colors ${
            tab === "direct" ? "bg-teal-500/15 text-teal-400" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Direct Messages
        </button>
        <button
          onClick={() => setTab("channels")}
          className={`flex-1 py-2 text-sm rounded font-medium transition-colors ${
            tab === "channels" ? "bg-teal-500/15 text-teal-400" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Channels
        </button>
      </div>

      {/* New DM/Group panel */}
      {showNew && tab === "direct" && (
        <NewConversationPanel
          newType={newType}
          onNewTypeChange={setNewType}
          newName={newName}
          onNewNameChange={setNewName}
          newDescription={newDescription}
          onNewDescriptionChange={setNewDescription}
          searchUser={searchUser}
          onSearchUsers={handleSearchUsers}
          foundUsers={foundUsers}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          onRemoveUser={handleRemoveUser}
          creating={creating}
          onCreateConversation={createConversation}
          filterDepartment={filterDepartment}
          onFilterDepartmentChange={setFilterDepartment}
          filterRank={filterRank}
          onFilterRankChange={setFilterRank}
          filterVesselType={filterVesselType}
          onFilterVesselTypeChange={setFilterVesselType}
        />
      )}

      {/* Channel browser/create panel */}
      {showChannelBrowser && tab === "channels" && (
        <ChannelBrowserPanel
          newChannelName={newChannelName}
          onNewChannelNameChange={setNewChannelName}
          newChannelDesc={newChannelDesc}
          onNewChannelDescChange={setNewChannelDesc}
          newChannelType={newChannelType}
          onNewChannelTypeChange={setNewChannelType}
          creatingChannel={creatingChannel}
          onCreateChannel={createChannel}
          joinError={joinError}
          onDismissJoinError={() => setJoinError(null)}
          unjoinedChannels={unjoinedChannels}
          channelSearch={channelSearch}
          onChannelSearchChange={setChannelSearch}
          onJoinChannel={joinChannel}
        />
      )}

      {/* Conversation list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-navy-800 animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-navy-800 animate-pulse rounded mb-1.5" />
                  <div className="h-3 w-48 bg-navy-800 animate-pulse rounded" />
                </div>
                <div className="h-3 w-10 bg-navy-800 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activeConvos.length === 0 && !showNew && !showChannelBrowser ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-300 font-medium">
            {tab === "direct" ? "No conversations yet" : "No channels joined"}
          </p>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            {tab === "direct"
              ? "Connect with other seafarers through direct or group messages."
              : "Browse and join channels to connect with the community."}
          </p>
          <button
            onClick={() => tab === "direct" ? setShowNew(true) : setShowChannelBrowser(true)}
            className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            {tab === "direct" ? "Start a Conversation" : "Browse Channels"}
          </button>
          {tab === "direct" && (
            <div className="mt-4 pt-3 border-t border-navy-700">
              <p className="text-slate-500 text-sm">You can also browse Channels to find active communities</p>
              <button
                onClick={() => setTab("channels")}
                className="mt-2 inline-flex items-center px-3 py-1.5 bg-navy-800 border border-navy-600 hover:border-navy-500 text-slate-300 text-sm rounded transition-colors"
              >
                Browse Channels
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {renderSection("Pinned", pinnedConvos)}
          {renderSection("Unread", unreadConvos)}
          {renderSection("Recent", readConvos)}

          {archivedConvos.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 transition-colors mb-2 px-1"
              >
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" className={`transition-transform ${showArchived ? "rotate-90" : ""}`}>
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Archived ({archivedConvos.length})
              </button>
              {showArchived && (
                <div className="space-y-1.5 opacity-60">
                  {archivedConvos.map(c => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      isActionsOpen={openActionsId === c.id}
                      onToggleActions={setOpenActionsId}
                      onTogglePin={togglePin}
                      onToggleMute={toggleMute}
                      onToggleArchive={toggleArchive}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
