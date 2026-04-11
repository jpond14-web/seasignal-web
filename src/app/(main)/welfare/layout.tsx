import { HubNav } from "@/components/layout/hub-nav";

const tabs = [
  { href: "/welfare/rights", label: "Rights" },
  { href: "/welfare/incidents", label: "Incidents" },
  { href: "/welfare/emergency", label: "Emergency" },
  { href: "/welfare/mental-health", label: "Mental Health" },
  { href: "/welfare/fatigue", label: "Fatigue" },
  { href: "/welfare/wellness", label: "Wellness" },
  { href: "/welfare/trends", label: "Trends" },
  { href: "/welfare/mlc", label: "MLC Reference" },
];

export default function WelfareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 text-slate-100">Welfare</h1>
      <p className="text-sm text-slate-500 mb-4">
        Your wellbeing matters. Track your health, know your rights under MLC 2006, and access support resources — all private to you.
      </p>
      <HubNav items={tabs} />
      {children}
    </div>
  );
}
