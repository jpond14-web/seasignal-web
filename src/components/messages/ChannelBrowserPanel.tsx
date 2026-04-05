"use client";

import { useMemo, useState, useCallback } from "react";
import type { ConversationWithMeta, ConversationType } from "./types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Active now";
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Active ${days}d ago`;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  official:   { bg: "bg-teal-500/10",   text: "text-teal-400",   border: "border-teal-500/20" },
  sector:     { bg: "bg-blue-500/10",    text: "text-blue-400",   border: "border-blue-500/20" },
  department: { bg: "bg-amber-500/10",   text: "text-amber-400",  border: "border-amber-500/20" },
  regional:   { bg: "bg-green-500/10",   text: "text-green-400",  border: "border-green-500/20" },
  topic:      { bg: "bg-purple-500/10",  text: "text-purple-400", border: "border-purple-500/20" },
};

function categoryStyle(slug?: string) {
  return CATEGORY_COLORS[slug ?? ""] ?? CATEGORY_COLORS.topic;
}

/* ------------------------------------------------------------------ */
/*  Shared channel card                                               */
/* ------------------------------------------------------------------ */

function ChannelCard({
  ch,
  joined,
  onJoin,
}: {
  ch: ConversationWithMeta;
  joined: boolean;
  onJoin: (id: string) => void;
}) {
  const isFull = !!(ch.max_members && ch.max_members > 0 && (ch.member_count || 0) >= ch.max_members);
  const style = categoryStyle(ch.category_slug);

  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-navy-800 border border-navy-700 rounded-lg">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-200 truncate">
            {ch.name || formatType(ch.type)}
          </p>
          {ch.category_name && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${style.bg} ${style.text} ${style.border}`}
            >
              {ch.category_icon ? `${ch.category_icon} ` : ""}
              {ch.category_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {ch.description && (
            <p className="text-xs text-slate-500 truncate max-w-[260px]">{ch.description}</p>
          )}
          <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
            {ch.member_count !== undefined && ch.member_count > 0
              ? ch.max_members && ch.max_members > 0
                ? `${ch.member_count}/${ch.max_members} members`
                : `${ch.member_count} members`
              : ""}
            {ch.last_activity_at && ch.member_count ? " \u00b7 " : ""}
            {relativeTime(ch.last_activity_at)}
          </span>
        </div>
      </div>
      {joined ? (
        <span className="ml-3 px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-medium rounded shrink-0">
          Joined &#x2713;
        </span>
      ) : isFull ? (
        <span className="ml-3 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium rounded shrink-0">
          Full
        </span>
      ) : (
        <button
          onClick={() => onJoin(ch.id)}
          className="ml-3 px-3 py-1 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 text-xs font-medium rounded transition-colors shrink-0"
        >
          Join
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number | null;
};

type ChannelBrowserPanelProps = {
  unjoinedChannels: ConversationWithMeta[];
  joinedChannelIds: Set<string>;
  categories: Category[];
  userProfile: {
    department_tag?: string | null;
    vessel_type_tags?: string[] | null;
    rank_range?: string | null;
  } | null;
  newChannelName: string;
  onNewChannelNameChange: (name: string) => void;
  newChannelDesc: string;
  onNewChannelDescChange: (desc: string) => void;
  newChannelType: ConversationType;
  onNewChannelTypeChange: (type: ConversationType) => void;
  creatingChannel: boolean;
  onCreateChannel: () => void;
  joinError: string | null;
  onDismissJoinError: () => void;
  onJoinChannel: (channelId: string) => void;
};

/* ------------------------------------------------------------------ */
/*  Tab: For You                                                      */
/* ------------------------------------------------------------------ */

function ForYouTab({
  channels,
  joinedIds,
  userProfile,
  onJoin,
}: {
  channels: ConversationWithMeta[];
  joinedIds: Set<string>;
  userProfile: ChannelBrowserPanelProps["userProfile"];
  onJoin: (id: string) => void;
}) {
  const unjoined = useMemo(
    () => channels.filter((c) => !joinedIds.has(c.id)),
    [channels, joinedIds],
  );

  const recommended = useMemo(() => {
    if (!userProfile) return [];
    const vesselTags = userProfile.vessel_type_tags ?? [];
    const dept = userProfile.department_tag;
    return unjoined
      .filter((ch) => {
        const matchVessel =
          vesselTags.length > 0 &&
          ch.sector_tags?.some((t) => vesselTags.includes(t));
        const matchDept =
          dept && ch.department_tags?.includes(dept);
        return matchVessel || matchDept;
      })
      .sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0))
      .slice(0, 8);
  }, [unjoined, userProfile]);

  const popular = useMemo(
    () =>
      unjoined
        .sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0))
        .slice(0, 5),
    [unjoined],
  );

  return (
    <div className="space-y-5">
      {recommended.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
            Recommended for You
          </h4>
          <div className="space-y-1.5">
            {recommended.map((ch) => (
              <ChannelCard
                key={ch.id}
                ch={ch}
                joined={joinedIds.has(ch.id)}
                onJoin={onJoin}
              />
            ))}
          </div>
        </div>
      )}

      {popular.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
            Popular
          </h4>
          <div className="space-y-1.5">
            {popular.map((ch) => (
              <ChannelCard
                key={ch.id}
                ch={ch}
                joined={joinedIds.has(ch.id)}
                onJoin={onJoin}
              />
            ))}
          </div>
        </div>
      )}

      {recommended.length === 0 && popular.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">
          No channels to recommend right now.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Browse                                                       */
/* ------------------------------------------------------------------ */

function BrowseTab({
  channels,
  joinedIds,
  categories,
  onJoin,
}: {
  channels: ConversationWithMeta[];
  joinedIds: Set<string>;
  categories: Category[];
  onJoin: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["official"]));
  const [sectorFilter, setSectorFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  // Collect unique filter values
  const { sectors, departments, regions } = useMemo(() => {
    const s = new Set<string>();
    const d = new Set<string>();
    const r = new Set<string>();
    for (const ch of channels) {
      ch.sector_tags?.forEach((t) => s.add(t));
      ch.department_tags?.forEach((t) => d.add(t));
      if (ch.region_tag) r.add(ch.region_tag);
    }
    return {
      sectors: Array.from(s).sort(),
      departments: Array.from(d).sort(),
      regions: Array.from(r).sort(),
    };
  }, [channels]);

  // Apply filters
  const filtered = useMemo(() => {
    return channels.filter((ch) => {
      if (sectorFilter && !ch.sector_tags?.includes(sectorFilter)) return false;
      if (deptFilter && !ch.department_tags?.includes(deptFilter)) return false;
      if (regionFilter && ch.region_tag !== regionFilter) return false;
      return true;
    });
  }, [channels, sectorFilter, deptFilter, regionFilter]);

  // Group by category
  const grouped = useMemo(() => {
    const catMap = new Map<string, ConversationWithMeta[]>();
    for (const ch of filtered) {
      const slug = ch.category_slug ?? "topic";
      if (!catMap.has(slug)) catMap.set(slug, []);
      catMap.get(slug)!.push(ch);
    }
    // Sort channels within each group by member_count desc
    for (const arr of catMap.values()) {
      arr.sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0));
    }
    return categories
      .filter((cat) => catMap.has(cat.slug))
      .map((cat) => ({ ...cat, channels: catMap.get(cat.slug)! }));
  }, [filtered, categories]);

  const toggleExpand = useCallback(
    (slug: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) next.delete(slug);
        else next.add(slug);
        return next;
      });
    },
    [],
  );

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-navy-800 border border-navy-600 rounded text-slate-300 focus:border-teal-500 focus:outline-none"
          aria-label="Filter by sector"
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {formatType(s)}
            </option>
          ))}
        </select>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-navy-800 border border-navy-600 rounded text-slate-300 focus:border-teal-500 focus:outline-none"
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {formatType(d)}
            </option>
          ))}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-navy-800 border border-navy-600 rounded text-slate-300 focus:border-teal-500 focus:outline-none"
          aria-label="Filter by region"
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {formatType(r)}
            </option>
          ))}
        </select>
      </div>

      {/* Category accordions */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {grouped.map(({ slug, name, icon, channels: catChannels }) => {
          const isOpen = expanded.has(slug);
          return (
            <div key={slug}>
              <button
                onClick={() => toggleExpand(slug)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-navy-800/50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-sm">{icon}</span>
                <span className="text-sm font-medium text-slate-200">{name}</span>
                <span className="text-[10px] text-slate-500">({catChannels.length})</span>
                <div className="flex-1" />
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isOpen && (
                <div className="space-y-1.5 mt-1 ml-1">
                  {catChannels.map((ch) => (
                    <ChannelCard
                      key={ch.id}
                      ch={ch}
                      joined={joinedIds.has(ch.id)}
                      onJoin={onJoin}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {grouped.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">
            No channels match the selected filters.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Search                                                       */
/* ------------------------------------------------------------------ */

function SearchTab({
  channels,
  joinedIds,
  onJoin,
}: {
  channels: ConversationWithMeta[];
  joinedIds: Set<string>;
  onJoin: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return channels
      .filter((ch) => {
        const name = (ch.name ?? "").toLowerCase();
        const desc = (ch.description ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
      .sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0));
  }, [channels, query]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search channels by name or description..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
      />
      {query.trim() && results.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">No channels match your search.</p>
      )}
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
        {results.map((ch) => (
          <ChannelCard
            key={ch.id}
            ch={ch}
            joined={joinedIds.has(ch.id)}
            onJoin={onJoin}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Channel section                                            */
/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS = [
  { value: "sector", label: "Sector" },
  { value: "department", label: "Department" },
  { value: "regional", label: "Regional" },
  { value: "topic", label: "Topic" },
];

function CreateChannelSection({
  newChannelName,
  onNewChannelNameChange,
  newChannelDesc,
  onNewChannelDescChange,
  newChannelType,
  onNewChannelTypeChange,
  creatingChannel,
  onCreateChannel,
}: {
  newChannelName: string;
  onNewChannelNameChange: (v: string) => void;
  newChannelDesc: string;
  onNewChannelDescChange: (v: string) => void;
  newChannelType: ConversationType;
  onNewChannelTypeChange: (v: ConversationType) => void;
  creatingChannel: boolean;
  onCreateChannel: () => void;
}) {
  const [category, setCategory] = useState("topic");
  const [sectorTag, setSectorTag] = useState("");
  const [deptTag, setDeptTag] = useState("");
  const [regionTag, setRegionTag] = useState("");

  return (
    <div className="border-t border-navy-700 pt-4 mt-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Create a Channel</h3>

      {/* Channel type buttons */}
      <div className="flex gap-2 mb-3">
        {(["channel", "vessel_channel", "port_channel"] as ConversationType[]).map((ct) => (
          <button
            key={ct}
            onClick={() => onNewChannelTypeChange(ct)}
            className={`px-3 py-1.5 text-xs rounded border ${
              newChannelType === ct
                ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                : "bg-navy-800 text-slate-400 border-navy-600"
            }`}
          >
            {formatType(ct)}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={newChannelName}
        onChange={(e) => onNewChannelNameChange(e.target.value)}
        placeholder="Channel name"
        className="w-full px-3 py-2 mb-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
      />
      <input
        type="text"
        value={newChannelDesc}
        onChange={(e) => onNewChannelDescChange(e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 mb-3 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
      />

      {/* Category dropdown */}
      <div className="mb-3">
        <label className="block text-xs text-slate-400 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-navy-800 border border-navy-600 rounded text-slate-300 focus:border-teal-500 focus:outline-none"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Context-specific tag fields */}
      {category === "sector" && (
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Sector / Vessel Type Tag</label>
          <input
            type="text"
            value={sectorTag}
            onChange={(e) => setSectorTag(e.target.value)}
            placeholder="e.g. bulk_carrier, tanker"
            className="w-full px-3 py-2 text-sm bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
      )}
      {category === "department" && (
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Department Tag</label>
          <input
            type="text"
            value={deptTag}
            onChange={(e) => setDeptTag(e.target.value)}
            placeholder="e.g. deck, engine, catering"
            className="w-full px-3 py-2 text-sm bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
      )}
      {category === "regional" && (
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Region Tag</label>
          <input
            type="text"
            value={regionTag}
            onChange={(e) => setRegionTag(e.target.value)}
            placeholder="e.g. southeast_asia, mediterranean"
            className="w-full px-3 py-2 text-sm bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
      )}

      <button
        onClick={onCreateChannel}
        disabled={creatingChannel || !newChannelName.trim()}
        className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
      >
        {creatingChannel ? "Creating..." : "Create Channel"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

type TabId = "for-you" | "browse" | "search";

const TABS: { id: TabId; label: string }[] = [
  { id: "for-you", label: "For You" },
  { id: "browse", label: "Browse" },
  { id: "search", label: "Search" },
];

export default function ChannelBrowserPanel({
  unjoinedChannels,
  joinedChannelIds,
  categories,
  userProfile,
  newChannelName,
  onNewChannelNameChange,
  newChannelDesc,
  onNewChannelDescChange,
  newChannelType,
  onNewChannelTypeChange,
  creatingChannel,
  onCreateChannel,
  joinError,
  onDismissJoinError,
  onJoinChannel,
}: ChannelBrowserPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("for-you");

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-navy-700 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
              activeTab === tab.id
                ? "text-teal-400 border-b-2 border-teal-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Join error */}
      {joinError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300 flex items-start gap-2">
          <svg
            className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{joinError}</span>
          <button onClick={onDismissJoinError} className="ml-auto text-red-400 hover:text-red-300">
            &#x2715;
          </button>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "for-you" && (
        <ForYouTab
          channels={unjoinedChannels}
          joinedIds={joinedChannelIds}
          userProfile={userProfile}
          onJoin={onJoinChannel}
        />
      )}
      {activeTab === "browse" && (
        <BrowseTab
          channels={unjoinedChannels}
          joinedIds={joinedChannelIds}
          categories={categories}
          onJoin={onJoinChannel}
        />
      )}
      {activeTab === "search" && (
        <SearchTab
          channels={unjoinedChannels}
          joinedIds={joinedChannelIds}
          onJoin={onJoinChannel}
        />
      )}

      {/* Create channel section */}
      <CreateChannelSection
        newChannelName={newChannelName}
        onNewChannelNameChange={onNewChannelNameChange}
        newChannelDesc={newChannelDesc}
        onNewChannelDescChange={onNewChannelDescChange}
        newChannelType={newChannelType}
        onNewChannelTypeChange={onNewChannelTypeChange}
        creatingChannel={creatingChannel}
        onCreateChannel={onCreateChannel}
      />
    </div>
  );
}
