"use client";

import { useState } from "react";

const screwedQuestions = [
  { question: "Are you being paid on time as per your contract?", flag: "late_pay", right: "MLC 2006 Reg. 2.2 — Wages must be paid monthly, no later than the agreed date." },
  { question: "Is your rest period less than 10 hours in any 24-hour period?", flag: "rest_hours", right: "MLC 2006 Reg. 2.3 — Minimum 10 hours rest in any 24-hour period, 77 hours in any 7-day period." },
  { question: "Have you been denied shore leave when the vessel is in port?", flag: "shore_leave", right: "MLC 2006 Reg. 2.4 — Seafarers have the right to shore leave for health and well-being." },
  { question: "Is your contract different from what was originally agreed?", flag: "contract", right: "MLC 2006 Reg. 2.1 — Seafarers must have a written agreement that matches what was promised." },
  { question: "Is the food or drinking water inadequate?", flag: "food", right: "MLC 2006 Reg. 3.2 — Adequate food and drinking water of appropriate quality must be provided free of charge." },
  { question: "Is the medical care on board insufficient?", flag: "medical", right: "MLC 2006 Reg. 4.1 — Right to adequate medical care, including essential dental care." },
  { question: "Are you being asked to pay recruitment fees to an agency?", flag: "recruitment", right: "MLC 2006 Reg. 1.4 — Seafarers shall not be charged directly or indirectly for recruitment services." },
  { question: "Is the vessel in poor condition affecting your safety?", flag: "safety", right: "MLC 2006 Reg. 4.3 — Working environment must be safe and hygienic. Port State Control can detain unsafe vessels." },
];

const emergencyContacts = [
  { name: "ITF Inspectorate", desc: "International Transport Workers' Federation", contact: "itf@itf.org.uk", phone: "+44 20 7403 2733" },
  { name: "ILO Maritime Help", desc: "International Labour Organization", contact: "maritime@ilo.org", phone: "+41 22 799 7111" },
  { name: "IMO GISIS", desc: "Port State Control contacts by country", contact: "https://gisis.imo.org" },
  { name: "Sailors' Society", desc: "24/7 helpline for seafarers", phone: "+44 23 8051 5950" },
  { name: "ISWAN (Seafarer Help)", desc: "Free, confidential helpline", phone: "+44 20 7323 2737" },
  { name: "Mission to Seafarers", desc: "Welfare support worldwide", phone: "+44 20 7248 5202" },
];

export default function RightsPage() {
  const [tab, setTab] = useState<"guide" | "check" | "contacts">("guide");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  const flagged = screwedQuestions.filter((q) => answers[q.flag]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Know Your Rights</h1>

      <div className="flex gap-2 mb-6">
        {(["guide", "check", "contacts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 text-sm rounded border transition-colors ${
              tab === t ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "bg-navy-800 text-slate-400 border-navy-600"
            }`}>
            {t === "guide" ? "MLC Guide" : t === "check" ? "Am I Being Screwed?" : "Emergency Contacts"}
          </button>
        ))}
      </div>

      {tab === "guide" && (
        <div className="space-y-4">
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-slate-100 mb-3">Maritime Labour Convention 2006</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              The MLC is the global standard for seafarers' rights. Ratified by over 100 countries,
              it sets minimum requirements for working conditions, health, safety, and welfare of seafarers.
            </p>
            <div className="space-y-3">
              {[
                { title: "Title 1: Minimum Requirements", items: ["Minimum age (16, or 18 for hazardous work)", "Medical certificate required", "Training and qualifications", "No recruitment fees to agencies"] },
                { title: "Title 2: Conditions of Employment", items: ["Written employment agreement", "Monthly wages, paid on time", "Maximum work hours (14h/day, 72h/week) or minimum rest (10h/day, 77h/week)", "Right to shore leave", "Repatriation at owner's expense"] },
                { title: "Title 3: Accommodation & Food", items: ["Adequate living space and ventilation", "Sanitary facilities", "Quality food and drinking water, free of charge", "Recreational facilities"] },
                { title: "Title 4: Health & Welfare", items: ["Medical care on board and ashore", "Shipowner liability for sickness/injury", "Health and safety protection", "Access to shore-based welfare facilities"] },
                { title: "Title 5: Compliance & Enforcement", items: ["Flag State inspection and certification", "Port State Control can detain non-compliant vessels", "Onboard complaint procedures", "Seafarer complaint (ashore) mechanisms"] },
              ].map((section) => (
                <div key={section.title} className="border border-navy-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-teal-400 mb-2">{section.title}</h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-teal-500 shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "check" && (
        <div className="space-y-4">
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-slate-100 mb-1">Am I Being Screwed?</h2>
            <p className="text-sm text-slate-400 mb-4">Answer these questions about your current situation.</p>

            <div className="space-y-3">
              {screwedQuestions.map((q) => (
                <div key={q.flag} className="flex items-start gap-3">
                  <button
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.flag]: !prev[q.flag] }))}
                    className={`mt-0.5 w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      answers[q.flag] ? "bg-red-500 border-red-500 text-white" : "bg-navy-800 border-navy-600"
                    }`}>
                    {answers[q.flag] && <span className="text-xs">✓</span>}
                  </button>
                  <span className="text-sm text-slate-300">{q.question}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowResults(true)}
              className="mt-6 w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors">
              Check My Rights
            </button>
          </div>

          {showResults && (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
              {flagged.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-green-400 font-semibold">No issues flagged.</p>
                  <p className="text-sm text-slate-400 mt-1">Based on your answers, your conditions appear to be within MLC standards.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-red-400 mb-3">
                    {flagged.length} potential violation{flagged.length > 1 ? "s" : ""} found
                  </h3>
                  <div className="space-y-3">
                    {flagged.map((q) => (
                      <div key={q.flag} className="border border-red-500/20 bg-red-500/5 rounded-lg p-3">
                        <p className="text-sm text-slate-200 font-medium">{q.question}</p>
                        <p className="text-sm text-teal-400 mt-1">{q.right}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-navy-700">
                    <p className="text-sm text-slate-300 font-medium">What to do next:</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-400">
                      <li>1. Document everything — use the Incident Log</li>
                      <li>2. Contact ITF or your flag state authority</li>
                      <li>3. File a complaint through the onboard procedure</li>
                      <li>4. If in port, contact Port State Control</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "contacts" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400 mb-2">Emergency and welfare contacts for seafarers worldwide.</p>
          {emergencyContacts.map((c) => (
            <div key={c.name} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-100">{c.name}</h3>
              <p className="text-sm text-slate-400">{c.desc}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                {c.phone && (
                  <span className="text-sm font-mono text-teal-400">{c.phone}</span>
                )}
                {c.contact && (
                  <span className="text-sm text-slate-300">{c.contact}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
