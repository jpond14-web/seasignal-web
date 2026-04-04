"use client";

import { useRef } from "react";
import Link from "next/link";
import type { ConversationWithMeta, ConversationType } from "./types";

const CHANNEL_TYPES: ConversationType[] = ["channel", "vessel_channel", "company_channel", "port_channel"];

function isChannel(type: ConversationType): boolean {
  return CHANNEL_TYPES.includes(type);
}

function formatType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString();
}

type ConversationItemProps = {
  conversation: ConversationWithMeta;
  isActionsOpen: boolean;
  onToggleActions: (id: string | null) => void;
  onTogglePin: (id: string, currentlyPinned: boolean) => void;
  onToggleMute: (id: string, currentlyMuted: boolean) => void;
  onToggleArchive: (id: string, currentlyArchived: boolean) => void;
};

export default function ConversationItem({
  conversation: c,
  isActionsOpen,
  onToggleActions,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
}: ConversationItemProps) {
  const actionsRef = useRef<HTMLDivElement>(null);
  const displayName = c.type === "dm" ? (c.dm_partner_name || "Direct Message") : (c.name || formatType(c.type));
  const hasUnread = (c.unread_count || 0) > 0;

  return (
    <div className="group relative">
      <Link href={`/messages/${c.id}`}
        className={`block bg-navy-900 border rounded-lg p-4 pr-10 transition-colors ${
          hasUnread ? "border-teal-500/30 bg-navy-900/80" : "border-navy-700 hover:border-navy-600"
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Online indicator for DM */}
            {c.type === "dm" && (
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center text-sm font-medium text-slate-300">
                  {(c.dm_partner_name || "?").charAt(0).toUpperCase()}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-navy-900 ${
                  c.dm_partner_online ? "bg-green-400" : "bg-slate-600"
                }`} />
              </div>
            )}
            {/* Channel icon */}
            {isChannel(c.type) && (
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" />
                </svg>
              </div>
            )}
            {/* Group icon */}
            {c.type === "group" && (
              <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center text-slate-400 shrink-0">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`font-medium truncate ${hasUnread ? "text-slate-100" : "text-slate-300"}`}>
                  {displayName}
                </p>
                {c.is_pinned && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-teal-400 shrink-0">
                    <path d="M4.146.146A.5.5 0 014.5 0h7a.5.5 0 01.5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 01-.5.5H8.5v5.5a.5.5 0 01-1 0V10H3.5a.5.5 0 01-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 015 6.708V2.277a2.77 2.77 0 01-.354-.298C4.342 1.674 4 1.18 4 .5a.5.5 0 01.146-.354z" />
                  </svg>
                )}
                {/* Muted indicator */}
                {c.is_muted && (
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-slate-500 shrink-0" aria-label="Muted">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                    <path d="M12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
                  </svg>
                )}
              </div>
              {c.last_message_preview && (
                <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-slate-300" : "text-slate-500"}`}>
                  {c.last_message_preview}
                </p>
              )}
              {!c.last_message_preview && c.context_port && (
                <p className="text-xs text-slate-500 mt-0.5">{c.context_port}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {c.member_count && c.type !== "dm" ? (
              <span className="text-[10px] text-slate-500">{c.member_count} members</span>
            ) : null}
            {hasUnread && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-teal-500 text-navy-950 text-[10px] font-bold rounded-full">
                {c.unread_count! > 99 ? "99+" : c.unread_count}
              </span>
            )}
            <span className="text-[10px] text-slate-500">
              {formatTime(c.last_message_at || c.updated_at)}
            </span>
          </div>
        </div>
      </Link>
      {/* More actions button */}
      <div className="absolute top-2 right-2" ref={isActionsOpen ? actionsRef : undefined}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleActions(isActionsOpen ? null : c.id); }}
          className={`p-1.5 rounded bg-navy-800/90 border border-navy-600 text-slate-400 hover:text-slate-200 transition-colors ${
            isActionsOpen ? "text-slate-200" : "md:opacity-0 md:group-hover:opacity-100"
          }`}
          aria-label="More actions"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {/* Actions dropdown */}
        {isActionsOpen && (
          <div className="absolute top-full right-0 mt-1 w-40 bg-navy-800 border border-navy-600 rounded-lg shadow-lg z-20 py-1 text-sm">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(c.id, !!c.is_pinned); onToggleActions(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-slate-300 hover:bg-navy-700 hover:text-teal-400 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.146.146A.5.5 0 014.5 0h7a.5.5 0 01.5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 01-.5.5H8.5v5.5a.5.5 0 01-1 0V10H3.5a.5.5 0 01-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 015 6.708V2.277a2.77 2.77 0 01-.354-.298C4.342 1.674 4 1.18 4 .5a.5.5 0 01.146-.354z" />
              </svg>
              {c.is_pinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleMute(c.id, !!c.is_muted); onToggleActions(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-slate-300 hover:bg-navy-700 hover:text-teal-400 transition-colors"
            >
              {c.is_muted ? (
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                  <path d="M12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
                </svg>
              )}
              {c.is_muted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleArchive(c.id, !!c.is_archived); onToggleActions(null); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-slate-300 hover:bg-navy-700 hover:text-amber-400 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              {c.is_archived ? "Unarchive" : "Archive"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
