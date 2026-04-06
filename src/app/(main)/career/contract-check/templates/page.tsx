"use client";

import { useState } from "react";
import Link from "next/link";

type RankCategory = "ab" | "officer" | "master_ce";

const rankLabels: Record<RankCategory, string> = {
  ab: "AB / Rating",
  officer: "Officer",
  master_ce: "Master / CE",
};

const salaryRanges: Record<RankCategory, string> = {
  ab: "$1,500 - $2,500",
  officer: "$3,000 - $6,000",
  master_ce: "$7,000 - $12,000",
};

const recommendedTerms = [
  { label: "Max contract length", value: "9 months recommended, 12 months max" },
  { label: "Overtime rate", value: "1.25x minimum" },
  { label: "Leave", value: "Minimum 2.5 days per month served" },
  { label: "Repatriation", value: "Must be at employer's expense" },
  { label: "Medical", value: "Comprehensive coverage required" },
  { label: "Notice period", value: "1 month minimum" },
  { label: "Hours of work", value: "Max 14h/day, 72h/week" },
];

const redFlags = [
  "Contract longer than 12 months",
  "No overtime provisions",
  "Recruitment fees charged to seafarer",
  "Ambiguous repatriation terms",
  "No medical coverage specified",
  "\"All-in\" salary with no overtime",
  "Penalty clauses for early termination",
];

const greenFlags = [
  "Clear wage breakdown",
  "CBA (Collective Bargaining Agreement) referenced",
  "ITF-approved terms",
  "Internet/connectivity allowance",
  "Travel allowance included",
  "Insurance details specified",
];

export default function ContractTemplatesPage() {
  const [filter, setFilter] = useState<RankCategory | null>(null);

  const ranks: RankCategory[] = ["ab", "officer", "master_ce"];
  const displayed = filter ? [filter] : ranks;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/career/contract-check"
        className="text-sm text-teal-400 hover:text-teal-300 transition-colors mb-4 inline-block"
      >
        &larr; Back to Contract Check
      </Link>

      <h1 className="text-2xl font-bold text-slate-100 mb-2">
        Contract Templates &amp; Benchmarks
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        Reference examples of fair contract terms by rank and vessel type.
      </p>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            filter === null
              ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
              : "bg-navy-800 text-slate-400 border-navy-600 hover:border-navy-500"
          }`}
        >
          All Ranks
        </button>
        {ranks.map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              filter === r
                ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                : "bg-navy-800 text-slate-400 border-navy-600 hover:border-navy-500"
            }`}
          >
            {rankLabels[r]}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="space-y-6">
        {displayed.map((rank) => (
          <div
            key={rank}
            className="bg-navy-900 border border-navy-700 rounded-lg p-5"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-1">
              {rankLabels[rank]}
            </h2>
            <p className="text-sm text-teal-400 font-medium mb-4">
              Fair salary range (USD/month): {salaryRanges[rank]}
            </p>

            {/* Recommended terms */}
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Recommended Contract Terms
            </h3>
            <div className="grid gap-2 mb-5">
              {recommendedTerms.map((term) => (
                <div
                  key={term.label}
                  className="flex justify-between items-start gap-4 text-sm border-b border-navy-800 pb-1.5"
                >
                  <span className="text-slate-400">{term.label}</span>
                  <span className="text-slate-200 text-right">{term.value}</span>
                </div>
              ))}
            </div>

            {/* Red flags */}
            <h3 className="text-sm font-semibold text-red-400 mb-2">
              Red Flags to Watch For
            </h3>
            <ul className="space-y-1 mb-5">
              {redFlags.map((flag) => (
                <li key={flag} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-red-400 shrink-0">!</span>
                  {flag}
                </li>
              ))}
            </ul>

            {/* Green flags */}
            <h3 className="text-sm font-semibold text-green-400 mb-2">
              Green Flags (Good Signs)
            </h3>
            <ul className="space-y-1">
              {greenFlags.map((flag) => (
                <li key={flag} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-green-400 shrink-0">&#10003;</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
