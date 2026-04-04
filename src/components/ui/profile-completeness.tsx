"use client";

import Link from "next/link";
import { useProfileCompleteness } from "@/lib/hooks/useProfileCompleteness";

function ringColor(pct: number): string {
  if (pct < 30) return "stroke-red-500";
  if (pct <= 70) return "stroke-amber-400";
  return "stroke-green-400";
}

function textColor(pct: number): string {
  if (pct < 30) return "text-red-500";
  if (pct <= 70) return "text-amber-400";
  return "text-green-400";
}

function bgColor(pct: number): string {
  if (pct < 30) return "border-red-500/20 bg-red-500/5";
  if (pct <= 70) return "border-amber-400/20 bg-amber-400/5";
  return "border-green-400/20 bg-green-400/5";
}

export function ProfileCompleteness() {
  const { percentage, missingFields, loading } = useProfileCompleteness();

  if (loading) {
    return (
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-navy-800 rounded w-40" />
            <div className="h-3 bg-navy-800 rounded w-56" />
          </div>
        </div>
      </div>
    );
  }

  if (percentage >= 100) return null;

  // SVG ring calculations
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`border rounded-lg p-5 ${bgColor(percentage)}`}>
      <div className="flex items-center gap-4">
        {/* Circular progress ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              className="stroke-navy-700"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${ringColor(percentage)} transition-all duration-700`}
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textColor(percentage)}`}
          >
            {percentage}%
          </span>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100">
            Complete your profile
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {missingFields.length} item{missingFields.length !== 1 ? "s" : ""}{" "}
            remaining
          </p>
        </div>
      </div>

      {/* Missing items list */}
      {missingFields.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {missingFields.map((field) => (
            <Link
              key={field}
              href="/profile/edit"
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 transition-colors group"
            >
              <div className="w-4 h-4 rounded-full border border-slate-600 group-hover:border-teal-500 flex-shrink-0 transition-colors" />
              <span>{field}</span>
              <svg
                className="w-3 h-3 ml-auto text-slate-600 group-hover:text-teal-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
