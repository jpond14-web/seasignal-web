"use client";

import { useState } from "react";

type Severity = "Critical" | "Warning" | "Info";
type Category = "Safety" | "Regulatory" | "Companies";

interface Alert {
  id: string;
  severity: Severity;
  title: string;
  source: string;
  date: string;
  description: string;
  categories: Category[];
}

const ALERTS: Alert[] = [
  {
    id: "1",
    severity: "Critical",
    title: "PSC Detention: MV Ocean Fortune — Busan, South Korea",
    source: "Tokyo MoU",
    date: "2026-04-02",
    description:
      "Bulk carrier detained for 14 deficiencies including non-functional fire detection system, expired liferaft servicing, and inadequate rest hour records. Crew reported working 16-hour days. Flag: Panama. Company: Fortune Maritime Ltd.",
    categories: ["Safety", "Companies"],
  },
  {
    id: "2",
    severity: "Warning",
    title: "STCW Amendment: New ECDIS Familiarization Requirements",
    source: "IMO MSC.1/Circ.1503/Rev.2",
    date: "2026-03-30",
    description:
      "Effective 1 July 2026, all navigating officers must complete type-specific ECDIS familiarization training. Generic ECDIS certificates alone will no longer satisfy flag state requirements. Check with your company training department.",
    categories: ["Regulatory"],
  },
  {
    id: "3",
    severity: "Critical",
    title: "Crew Abandonment: 12 Seafarers Stranded in Chittagong",
    source: "ITF Inspectorate",
    date: "2026-03-28",
    description:
      "Twelve crew members aboard MT Seabird Venture abandoned by owner with 5 months unpaid wages. Provisions running low. ITF Inspector engaged. If you have information about this vessel or company (Seabird Shipping Co.), contact ITF immediately.",
    categories: ["Companies", "Safety"],
  },
  {
    id: "4",
    severity: "Info",
    title: "MLC Amendment: Enhanced Shore Leave Provisions",
    source: "ILO",
    date: "2026-03-25",
    description:
      "New MLC 2006 amendment strengthens Regulation 2.4 on shore leave. Port states must now facilitate timely visa arrangements. Seafarers denied shore leave may file complaints directly to the port state. Enters into force January 2027.",
    categories: ["Regulatory"],
  },
  {
    id: "5",
    severity: "Warning",
    title: "Flag State Alert: Comoros Registry Under Enhanced Scrutiny",
    source: "Paris MoU",
    date: "2026-03-22",
    description:
      "Comoros flag placed on Paris MoU grey list following increased detention rates. Vessels flying Comoros flag can expect more frequent and intensive PSC inspections in European ports. Consider implications for your next contract.",
    categories: ["Regulatory", "Safety"],
  },
  {
    id: "6",
    severity: "Critical",
    title: "Safety Bulletin: Mooring Line Snapback Fatality — Rotterdam",
    source: "Dutch Maritime Authority",
    date: "2026-03-19",
    description:
      "Fatal accident during mooring operations at Europoort. AB struck by parting mooring line. Preliminary investigation cites worn line not replaced despite inspection findings. All vessels reminded to inspect mooring lines per OCIMF MEG4 guidelines.",
    categories: ["Safety"],
  },
  {
    id: "7",
    severity: "Info",
    title: "Manning Agency Warning: Global Crew Solutions — Unlicensed",
    source: "POEA Philippines",
    date: "2026-03-15",
    description:
      "POEA confirms that 'Global Crew Solutions' operating from Manila is NOT a licensed manning agency. Several seafarers have reported paying placement fees. Do not engage. Report any contact to POEA hotline.",
    categories: ["Companies"],
  },
  {
    id: "8",
    severity: "Warning",
    title: "Cyber Security: Phishing Emails Targeting Seafarer Credentials",
    source: "BIMCO / ICS",
    date: "2026-03-12",
    description:
      "Coordinated phishing campaign targeting seafarers via emails posing as MCA certificate renewal notices. Emails contain links to fake gov.uk pages requesting CDC and passport data. Verify all certificate communications via official channels only.",
    categories: ["Safety"],
  },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: "bg-red-500/15 border-red-500/40 text-red-400",
  Warning: "bg-amber-500/15 border-amber-500/40 text-amber-400",
  Info: "bg-blue-500/15 border-blue-500/40 text-blue-400",
};

const SEVERITY_BORDER: Record<Severity, string> = {
  Critical: "border-l-red-500",
  Warning: "border-l-amber-500",
  Info: "border-l-blue-500",
};

type FilterTab = "All" | Category;
const TABS: FilterTab[] = ["All", "Safety", "Regulatory", "Companies"];

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [showForm, setShowForm] = useState(false);

  const filtered =
    activeTab === "All"
      ? ALERTS
      : ALERTS.filter((a) => a.categories.includes(activeTab as Category));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="text-slate-400 text-sm">
          PSC detentions, regulatory changes, safety bulletins, and company warnings.
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          Submit Alert
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-slate-100 font-semibold mb-3">Submit an Alert</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Alert title..."
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <textarea
              placeholder="Describe the alert — include sources, dates, and any evidence..."
              rows={4}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm">
                <option value="">Severity...</option>
                <option value="Critical">Critical</option>
                <option value="Warning">Warning</option>
                <option value="Info">Info</option>
              </select>
              <select className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm">
                <option value="">Category...</option>
                <option value="Safety">Safety</option>
                <option value="Regulatory">Regulatory</option>
                <option value="Companies">Companies</option>
              </select>
              <button className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs px-3 py-2 rounded-lg border transition-colors font-medium ${
              activeTab === tab
                ? "bg-teal-500/15 border-teal-500/40 text-teal-400"
                : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts feed */}
      <div className="space-y-3">
        {filtered.map((alert) => (
          <article
            key={alert.id}
            className={`bg-navy-900 border border-navy-700 border-l-4 ${SEVERITY_BORDER[alert.severity]} rounded-lg p-4`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border font-medium ${SEVERITY_STYLES[alert.severity]}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(alert.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h3 className="text-slate-100 font-semibold text-sm mb-1">
                  {alert.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-2">
                  {alert.description}
                </p>
                <span className="text-xs text-slate-500">Source: {alert.source}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
