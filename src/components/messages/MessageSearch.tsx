"use client";

import type { Message } from "./types";

type MessageSearchProps = {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  results: Message[];
  onSelectResult: (msgId: string) => void;
  searchQuery: string;
  getSenderName: (senderId: string) => string;
};

export default function MessageSearch({
  isOpen,
  onSearch,
  results,
  onSelectResult,
  searchQuery,
  getSenderName,
}: MessageSearchProps) {
  if (!isOpen) return null;

  return (
    <div className="border-b border-navy-700 p-3 bg-navy-900/50">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search in conversation..."
        className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
        autoFocus
      />
      {results.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
          {results.map(r => (
            <button key={r.id} onClick={() => onSelectResult(r.id)}
              className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-navy-800 rounded truncate">
              <span className="text-teal-400">{getSenderName(r.sender_id)}</span>: {r.plaintext}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
