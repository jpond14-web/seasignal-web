"use client";

import { useState } from "react";

interface Story {
  id: string;
  author: string;
  title: string;
  content: string;
  reactions: { wave: number; anchor: number; salute: number };
  date: string;
  sector: string;
}

const SECTORS = [
  "Offshore",
  "Tanker",
  "Container",
  "Bulk Carrier",
  "Fishing",
  "Cruise",
  "Tug & Salvage",
  "LNG/LPG",
];

const STORIES: Story[] = [
  {
    id: "1",
    author: "ChiefMate_K",
    title: "The Night the Anchor Chain Parted in Typhoon Season",
    content:
      "We were anchored off Kaohsiung waiting for a berth. The forecast said moderate winds but by 0200 it was blowing 50 knots and rising. The whole vessel was shuddering. I was on watch when I heard the sound no mate ever wants to hear — that deep metallic groan followed by a crack like a rifle shot. The port anchor chain had parted at the bitter end. We went from anchored to drifting in seconds, two cables from the breakwater...",
    reactions: { wave: 34, anchor: 18, salute: 22 },
    date: "2026-03-28",
    sector: "Bulk Carrier",
  },
  {
    id: "2",
    author: "EngCadet_Sara",
    title: "My First Watch Alone in the Engine Room",
    content:
      "Everyone talks about bridge watches, but nobody prepares you for your first solo engine room watch at 3am. The noise is deafening even with ear protection. Every alarm tone sounds the same when you are panicking. The 2nd Engineer told me before he left: 'If something goes wrong, don't try to be a hero. Call me.' That advice saved my career that night when the purifier started vibrating badly...",
    reactions: { wave: 45, anchor: 12, salute: 38 },
    date: "2026-03-25",
    sector: "Container",
  },
  {
    id: "3",
    author: "Bosun_Pete",
    title: "Rescued a Fisherman 200nm Off West Africa",
    content:
      "We were transiting south of the Canaries, bound for Lagos. Lookout spotted something on the radar that didn't make sense — too small for a vessel, wrong shape for debris. Captain altered course. Turned out to be a local fisherman whose pirogue had capsized three days earlier. He was clinging to the hull, severely dehydrated. Getting him aboard in that swell was the hardest crane operation of my life...",
    reactions: { wave: 67, anchor: 41, salute: 55 },
    date: "2026-03-20",
    sector: "Tanker",
  },
  {
    id: "4",
    author: "AB_Mikhail",
    title: "Christmas in the South China Sea",
    content:
      "My fourth Christmas away from home. The cook made a proper roast with all the trimmings — how he managed that in Force 6 I will never know. We had a Secret Santa in the mess room. The Old Man got a rubber duck wearing a captain's hat. For five minutes the whole crew was laughing together — Filipino, Ukrainian, Indian, Romanian — didn't matter where you were from. That's what I miss most about being at sea, those moments.",
    reactions: { wave: 52, anchor: 29, salute: 44 },
    date: "2026-03-15",
    sector: "Container",
  },
  {
    id: "5",
    author: "DPO_Jensen",
    title: "When the DP System Dropped Out During Crane Ops",
    content:
      "Offshore work teaches you that technology is brilliant until it isn't. We were doing a heavy lift alongside a platform in the North Sea, wind on the limit. I'm watching my screen and suddenly both position references drop. The vessel starts drifting. The crane is loaded. In those seconds between the alarm and my hands moving to manual, time stretched out completely. Fifteen years of training compressed into three seconds of decision-making...",
    reactions: { wave: 38, anchor: 27, salute: 31 },
    date: "2026-03-10",
    sector: "Offshore",
  },
  {
    id: "6",
    author: "Cook_Maria",
    title: "Feeding 25 Hungry Seafarers on a Broken Oven",
    content:
      "The main galley oven died on day two of a 14-day crossing. No spare parts until the next port. I had two hotplates, a microwave, and a deep fryer. For twelve days I fed 25 people three meals a day plus night lunches. I learned to make things I never thought possible without an oven. The crew never complained once — they knew I was doing my best. On arrival, the Captain wrote a commendation letter. That letter means more to me than any certificate.",
    reactions: { wave: 58, anchor: 33, salute: 49 },
    date: "2026-03-05",
    sector: "Bulk Carrier",
  },
];

export default function SeaStoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSector, setFormSector] = useState("");
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});

  const toggleReaction = (storyId: string, type: string) => {
    setUserReactions((prev) => {
      const current = prev[storyId] || [];
      if (current.includes(type)) {
        return { ...prev, [storyId]: current.filter((r) => r !== type) };
      }
      return { ...prev, [storyId]: [...current, type] };
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">
          Real stories from life at sea. The good, the hard, and everything in between.
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          Share Your Story
        </button>
      </div>

      {/* Story form */}
      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-slate-100 font-semibold mb-3">Tell Us Your Story</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Give your story a title..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <textarea
              placeholder="What happened? Share as much or as little as you like..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={5}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={formSector}
                onChange={(e) => setFormSector(e.target.value)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm"
              >
                <option value="">Select sector...</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
                Publish Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stories feed */}
      <div className="space-y-4">
        {STORIES.map((story) => {
          const reacted = userReactions[story.id] || [];
          return (
            <article
              key={story.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-teal-400 font-bold text-sm">
                  {story.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-200 text-sm font-medium">
                    {story.author}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <time>{new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time>
                    <span className="text-xs px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400">
                      {story.sector}
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="text-slate-100 font-semibold text-base mb-2">
                {story.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {story.content}
              </p>

              {/* Reactions */}
              <div className="flex items-center gap-2">
                {([
                  ["wave", "\uD83C\uDF0A", story.reactions.wave],
                  ["anchor", "\u2693", story.reactions.anchor],
                  ["salute", "\uD83E\uDEE1", story.reactions.salute],
                ] as [string, string, number][]).map(([type, emoji, count]) => (
                  <button
                    key={type}
                    onClick={() => toggleReaction(story.id, type)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      reacted.includes(type)
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                        : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{reacted.includes(type) ? count + 1 : count}</span>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
