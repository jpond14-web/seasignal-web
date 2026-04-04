"use client";

import type { FoundUser, DepartmentType, RankCategory, VesselType } from "./types";

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type NewConversationPanelProps = {
  newType: "dm" | "group";
  onNewTypeChange: (type: "dm" | "group") => void;
  newName: string;
  onNewNameChange: (name: string) => void;
  newDescription: string;
  onNewDescriptionChange: (desc: string) => void;
  searchUser: string;
  onSearchUsers: (query: string) => void;
  foundUsers: FoundUser[];
  selectedUsers: FoundUser[];
  onSelectUser: (user: FoundUser) => void;
  onRemoveUser: (userId: string) => void;
  creating: boolean;
  onCreateConversation: () => void;
  filterDepartment: DepartmentType | "";
  onFilterDepartmentChange: (dept: DepartmentType | "") => void;
  filterRank: RankCategory | "";
  onFilterRankChange: (rank: RankCategory | "") => void;
  filterVesselType: VesselType | "";
  onFilterVesselTypeChange: (vt: VesselType | "") => void;
};

export default function NewConversationPanel({
  newType,
  onNewTypeChange,
  newName,
  onNewNameChange,
  newDescription,
  onNewDescriptionChange,
  searchUser,
  onSearchUsers,
  foundUsers,
  selectedUsers,
  onSelectUser,
  onRemoveUser,
  creating,
  onCreateConversation,
  filterDepartment,
  onFilterDepartmentChange,
  filterRank,
  onFilterRankChange,
  filterVesselType,
  onFilterVesselTypeChange,
}: NewConversationPanelProps) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
      <div className="flex gap-2 mb-4">
        <button onClick={() => onNewTypeChange("dm")}
          className={`flex-1 py-2 text-sm rounded border ${newType === "dm" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"}`}>
          Direct Message
        </button>
        <button onClick={() => onNewTypeChange("group")}
          className={`flex-1 py-2 text-sm rounded border ${newType === "group" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"}`}>
          Group Chat
        </button>
      </div>
      {newType === "group" && (
        <>
          <input type="text" value={newName} onChange={(e) => onNewNameChange(e.target.value)} placeholder="Group name"
            className="w-full px-3 py-2 mb-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
          <input type="text" value={newDescription} onChange={(e) => onNewDescriptionChange(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-2 mb-3 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
        </>
      )}

      {/* Discovery filters */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <select value={filterDepartment} onChange={(e) => onFilterDepartmentChange(e.target.value as DepartmentType | "")}
          className="px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-300 text-xs focus:border-teal-500 focus:outline-none">
          <option value="">All Departments</option>
          <option value="deck">Deck</option>
          <option value="engine">Engine</option>
          <option value="electro">Electro</option>
          <option value="catering">Catering</option>
        </select>
        <select value={filterRank} onChange={(e) => onFilterRankChange(e.target.value as RankCategory | "")}
          className="px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-300 text-xs focus:border-teal-500 focus:outline-none">
          <option value="">All Ranks</option>
          <option value="officer">Officer</option>
          <option value="rating">Rating</option>
          <option value="cadet">Cadet</option>
        </select>
        <select value={filterVesselType} onChange={(e) => onFilterVesselTypeChange(e.target.value as VesselType | "")}
          className="px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-300 text-xs focus:border-teal-500 focus:outline-none">
          <option value="">All Vessel Types</option>
          <option value="tanker">Tanker</option>
          <option value="bulk_carrier">Bulk Carrier</option>
          <option value="container">Container</option>
          <option value="general_cargo">General Cargo</option>
          <option value="offshore">Offshore</option>
          <option value="passenger">Passenger</option>
          <option value="roro">RoRo</option>
          <option value="lng">LNG</option>
          <option value="lpg">LPG</option>
          <option value="chemical">Chemical</option>
          <option value="tug">Tug</option>
          <option value="fishing">Fishing</option>
        </select>
      </div>

      <input type="text" value={searchUser} onChange={(e) => onSearchUsers(e.target.value)} placeholder="Search seafarers by name..."
        className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />

      {foundUsers.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-navy-700 rounded-lg p-1">
          {foundUsers.map((u) => (
            <button key={u.id}
              onClick={() => onSelectUser(u)}
              className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-navy-800 rounded">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-xs font-medium text-slate-300">
                  {u.display_name.charAt(0).toUpperCase()}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-navy-900 ${
                  isOnline(u.last_seen_at) ? "bg-green-400" : "bg-slate-600"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.display_name}</p>
                <p className="text-[10px] text-slate-500">
                  {[u.department_tag, u.rank_range].filter(Boolean).map(v => formatType(v!)).join(" / ") || "No details"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedUsers.map((u) => (
            <span key={u.id} className="flex items-center gap-1 px-2 py-1 text-xs bg-navy-800 border border-navy-600 rounded text-slate-300">
              {u.display_name}
              <button onClick={() => onRemoveUser(u.id)} className="text-slate-500 hover:text-red-400" aria-label={`Remove ${u.display_name}`}>&times;</button>
            </span>
          ))}
        </div>
      )}

      {/* E2E encryption toggle removed — key exchange not yet implemented */}

      <button onClick={onCreateConversation} disabled={creating || selectedUsers.length === 0}
        className="mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
        {creating ? "Creating..." : "Start Conversation"}
      </button>
    </div>
  );
}
