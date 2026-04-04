"use client";

import type { ConversationWithMeta, ConversationType } from "./types";

function formatType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type ChannelBrowserPanelProps = {
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
  unjoinedChannels: ConversationWithMeta[];
  channelSearch: string;
  onChannelSearchChange: (query: string) => void;
  onJoinChannel: (channelId: string) => void;
};

export default function ChannelBrowserPanel({
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
  unjoinedChannels,
  channelSearch,
  onChannelSearchChange,
  onJoinChannel,
}: ChannelBrowserPanelProps) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Create a Channel</h3>
      <div className="flex gap-2 mb-3">
        {(["channel", "vessel_channel", "port_channel"] as ConversationType[]).map(ct => (
          <button key={ct} onClick={() => onNewChannelTypeChange(ct)}
            className={`px-3 py-1.5 text-xs rounded border ${newChannelType === ct ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"}`}>
            {formatType(ct)}
          </button>
        ))}
      </div>
      <input type="text" value={newChannelName} onChange={(e) => onNewChannelNameChange(e.target.value)} placeholder="Channel name"
        className="w-full px-3 py-2 mb-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
      <input type="text" value={newChannelDesc} onChange={(e) => onNewChannelDescChange(e.target.value)} placeholder="Description (optional)"
        className="w-full px-3 py-2 mb-3 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
      <button onClick={onCreateChannel} disabled={creatingChannel || !newChannelName.trim()}
        className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
        {creatingChannel ? "Creating..." : "Create Channel"}
      </button>

      {/* Join error message */}
      {joinError && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{joinError}</span>
          <button onClick={onDismissJoinError} className="ml-auto text-red-400 hover:text-red-300">&#x2715;</button>
        </div>
      )}

      {/* Discoverable channels */}
      {unjoinedChannels.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-slate-200 mt-5 mb-3">Browse Channels</h3>
          <input
            type="text"
            placeholder="Search channels..."
            value={channelSearch}
            onChange={e => onChannelSearchChange(e.target.value)}
            className="w-full mb-2 px-3 py-2 bg-navy-800 border border-navy-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
          />
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {unjoinedChannels.filter(ch => {
              if (!channelSearch.trim()) return true;
              const name = ch.name || "";
              return name.toLowerCase().includes(channelSearch.toLowerCase());
            }).map(ch => {
              const isFull = !!(ch.max_members && ch.max_members > 0 && (ch.member_count || 0) >= ch.max_members);
              return (
              <div key={ch.id} className="flex items-center justify-between px-3 py-2.5 bg-navy-800 border border-navy-700 rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{ch.name || formatType(ch.type)}</p>
                    {ch.type === "vessel_channel" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        Crew Only
                      </span>
                    )}
                    {ch.type === "company_channel" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4z" clipRule="evenodd" /></svg>
                        Company
                      </span>
                    )}
                    {ch.type === "port_channel" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded">
                        Open
                      </span>
                    )}
                    {Boolean((ch as Record<string, unknown>).is_system) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded">
                        Official
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ch.description && <p className="text-xs text-slate-500 truncate">{ch.description}</p>}
                    {(ch.member_count !== undefined && ch.member_count > 0) && (
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {ch.max_members && ch.max_members > 0
                          ? `${ch.member_count}/${ch.max_members} members`
                          : `${ch.member_count} members`}
                      </span>
                    )}
                  </div>
                </div>
                {isFull ? (
                  <span className="ml-3 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium rounded shrink-0">
                    Full
                  </span>
                ) : (
                  <button onClick={() => onJoinChannel(ch.id)}
                    className="ml-3 px-3 py-1 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 text-xs font-medium rounded transition-colors shrink-0">
                    Join
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
