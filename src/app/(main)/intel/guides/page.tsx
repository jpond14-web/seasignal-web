"use client";

import { useState } from "react";

type GuideCategory = "Safety" | "Career" | "Technical" | "Wellbeing" | "Legal";

interface Guide {
  id: string;
  title: string;
  author: string;
  category: GuideCategory;
  readTime: string;
  upvotes: number;
  excerpt: string;
}

const CATEGORIES: GuideCategory[] = ["Safety", "Career", "Technical", "Wellbeing", "Legal"];

const CATEGORY_STYLES: Record<GuideCategory, string> = {
  Safety: "bg-red-500/10 border-red-500/30 text-red-400",
  Career: "bg-teal-500/10 border-teal-500/30 text-teal-400",
  Technical: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  Wellbeing: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  Legal: "bg-amber-500/10 border-amber-500/30 text-amber-400",
};

const GUIDES: Guide[] = [
  {
    id: "1",
    title: "Heavy Weather Mooring: What I Learned the Hard Way",
    author: "Bosun_Pete",
    category: "Safety",
    readTime: "8 min",
    upvotes: 147,
    excerpt:
      "After 20 years on deck, I've seen mooring operations go wrong more times than I care to count. This guide covers what the textbooks skip: reading the weather between forecasts, recognizing when a line is about to part before you hear the snap, and the mooring arrangements that actually work in the real world.",
  },
  {
    id: "2",
    title: "Surviving Your First LNG Contract",
    author: "C/E_Nair",
    category: "Career",
    readTime: "12 min",
    upvotes: 203,
    excerpt:
      "Moving from conventional tankers to LNG is a bigger leap than most people expect. The cargo system is a completely different world. Here's what I wish someone had told me before I signed that first LNG contract — from the IGC Code basics to the unwritten rules of membrane tank operations.",
  },
  {
    id: "3",
    title: "Understanding Your MLC Rights: A Plain-Language Guide",
    author: "ITF_Advocate",
    category: "Legal",
    readTime: "15 min",
    upvotes: 312,
    excerpt:
      "The Maritime Labour Convention is your bill of rights at sea, but it's written in legal language that puts most people to sleep. This guide breaks down the provisions that actually matter in your daily life: rest hours, repatriation, wages, and what to do when your company ignores them.",
  },
  {
    id: "4",
    title: "Managing Fatigue on Back-to-Back Contracts",
    author: "2/O_Rashid",
    category: "Wellbeing",
    readTime: "7 min",
    upvotes: 189,
    excerpt:
      "I did three back-to-back contracts in my junior years because I needed the money. By the end I was a zombie — making mistakes I'd never normally make. Here are the strategies that got me through, and the honest truth about when you need to say no to the next contract.",
  },
  {
    id: "5",
    title: "Diesel Generator Troubleshooting: A Watchkeeper's Field Guide",
    author: "3/E_Kowalski",
    category: "Technical",
    readTime: "20 min",
    upvotes: 256,
    excerpt:
      "When the DG trips at 0300 and you're the only engineer awake, you need a systematic approach. This guide walks through the most common failure modes on MAN and Wartsila auxiliary engines — from fuel system issues to governor hunting — with the diagnostic steps that actually work on tired old machinery.",
  },
  {
    id: "6",
    title: "How to File a PSC Complaint Without Losing Your Job",
    author: "Anonymous_Seafarer",
    category: "Legal",
    readTime: "10 min",
    upvotes: 278,
    excerpt:
      "You know the safety deficiencies are real but you're afraid of being blacklisted. This guide explains the anonymous complaint mechanisms available through port state control, ITF, and flag states — and the legal protections that exist under MLC Standard A5.1.4 to prevent retaliation.",
  },
];

export default function GuidesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<GuideCategory | "All">("All");

  const filtered = GUIDES.filter((g) => {
    if (categoryFilter !== "All" && g.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.author.toLowerCase().includes(q) ||
        g.excerpt.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="text-slate-400 text-sm">
          Practical guides written by seafarers, for seafarers.
        </p>
        <button className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap">
          Write a Guide
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search guides..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {(["All", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors font-medium ${
                categoryFilter === cat
                  ? "bg-teal-500/15 border-teal-500/40 text-teal-400"
                  : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guides grid */}
      {filtered.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">
          No guides match your search. Try different keywords.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((guide) => (
            <article
              key={guide.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-5 flex flex-col hover:border-teal-500/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_STYLES[guide.category]}`}
                >
                  {guide.category}
                </span>
                <span className="text-xs text-slate-500">{guide.readTime} read</span>
              </div>

              <h3 className="text-slate-100 font-semibold text-sm mb-2 leading-snug">
                {guide.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-3">
                {guide.excerpt}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-navy-700">
                <span className="text-xs text-slate-500">by {guide.author}</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  {guide.upvotes}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
