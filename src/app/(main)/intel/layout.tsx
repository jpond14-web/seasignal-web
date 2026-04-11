import { HubNav } from "@/components/layout/hub-nav";

const tabs = [
  { href: "/intel/companies", label: "Companies" },
  { href: "/intel/agencies", label: "Agencies" },
  { href: "/intel/vessels", label: "Vessels" },
  { href: "/intel/pay", label: "Pay Data" },
  { href: "/intel/flares", label: "Signal Flares" },
  { href: "/intel/signals", label: "Signal Reports" },
  { href: "/intel/alerts", label: "Alerts" },
  { href: "/intel/guides", label: "Guides" },
];

export default function IntelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 text-slate-100">Intel</h1>
      <p className="text-sm text-slate-500 mb-4">
        Seafarer-sourced intelligence on companies, vessels, agencies, and industry issues. All data comes from crew like you.
      </p>
      <HubNav items={tabs} />
      {children}
    </div>
  );
}
