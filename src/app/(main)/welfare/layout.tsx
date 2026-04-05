import { HubNav } from "@/components/layout/hub-nav";

const tabs = [
  { href: "/welfare/rights", label: "Rights" },
  { href: "/welfare/incidents", label: "Incidents" },
  { href: "/welfare/emergency", label: "Emergency" },
  { href: "/welfare/mental-health", label: "Mental Health" },
  { href: "/welfare/mlc", label: "MLC Reference" },
];

export default function WelfareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-slate-100">Welfare</h1>
      <HubNav items={tabs} />
      {children}
    </div>
  );
}
