import { HubNav } from "@/components/layout/hub-nav";

const tabs = [
  { href: "/intel/companies", label: "Companies" },
  { href: "/intel/agencies", label: "Agencies" },
  { href: "/intel/vessels", label: "Vessels" },
  { href: "/intel/pay", label: "Pay Data" },
  { href: "/intel/alerts", label: "Alerts" },
  { href: "/intel/guides", label: "Guides" },
];

export default function IntelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-slate-100">Intel</h1>
      <HubNav items={tabs} />
      {children}
    </div>
  );
}
