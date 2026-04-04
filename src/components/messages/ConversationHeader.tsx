"use client";

import Link from "next/link";
import type { MemberProfile } from "./types";

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Offline";
  if (isOnline(lastSeen)) return "Online";
  const d = new Date(lastSeen);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `Last seen ${diffHrs}h ago`;
  return `Last seen ${d.toLocaleDateString()}`;
}

type ConversationHeaderProps = {
  name: string;
  type: string;
  description: string;
  members: MemberProfile[];
  profileId: string | null;
  onLeave: () => void;
  onToggleSearch: () => void;
};

export default function ConversationHeader({
  name,
  type,
  members,
  profileId,
  onLeave,
  onToggleSearch,
}: ConversationHeaderProps) {
  const dmPartner = type === "dm" ? members.find(m => m.profile_id !== profileId) : null;
  const onlineCount = members.filter(m => isOnline(m.last_seen_at)).length;

  return (
    <div className="flex items-center gap-3 pb-3 border-b border-navy-700">
      <Link href="/messages" className="text-slate-400 hover:text-slate-300 text-sm shrink-0" aria-label="Back to messages">&larr;</Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-slate-100 capitalize truncate">{name}</h1>
        </div>
        <p className="text-[11px] text-slate-500">
          {type === "dm" && dmPartner
            ? formatLastSeen(dmPartner.last_seen_at)
            : `${members.length} members, ${onlineCount} online`}
        </p>
      </div>
      {type && type !== "dm" && (
        <button
          onClick={onLeave}
          className="px-2.5 py-1.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded transition-colors shrink-0"
          title="Leave conversation"
        >
          Leave
        </button>
      )}
      <button
        onClick={onToggleSearch}
        className="p-2 text-slate-400 hover:text-slate-300 rounded hover:bg-navy-800 transition-colors shrink-0"
        aria-label="Search messages"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
