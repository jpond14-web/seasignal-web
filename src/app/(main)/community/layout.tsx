import { HubNav } from "@/components/layout/hub-nav";

const tabs = [
  { href: "/community/forums", label: "Forums" },
  { href: "/community/seafarers", label: "Seafarers" },
  { href: "/community/stories", label: "Sea Stories" },
  { href: "/community/mentors", label: "Mentors" },
  { href: "/community/vessel-rooms", label: "Vessel Rooms" },
  { href: "/community/port-beacon", label: "Port Beacon" },
  { href: "/community/ask-fleet", label: "Ask the Fleet" },
];

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 text-slate-100">Community</h1>
      <p className="text-sm text-slate-500 mb-4">
        Connect with fellow seafarers. Share experiences, ask questions, find mentors, and support each other — your identity is always protected.
      </p>
      <HubNav items={tabs} />
      {children}
    </div>
  );
}
