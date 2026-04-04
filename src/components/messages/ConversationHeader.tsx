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
  isEncrypted: boolean;
  members: MemberProfile[];
  profileId: string | null;
  onLeave: () => void;
  onToggleSearch: () => void;
};

export default function ConversationHeader({
  name,
  type,
  isEncrypted,
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
          {isEncrypted && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/25 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
                <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
              </svg>
              E2E
            </span>
          )}
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
