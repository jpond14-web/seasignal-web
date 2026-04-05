import { HubNav } from "@/components/layout/hub-nav";

const tabs = [
  { href: "/community/forums", label: "Forums" },
  { href: "/community/seafarers", label: "Seafarers" },
  { href: "/community/stories", label: "Sea Stories" },
  { href: "/community/mentors", label: "Mentors" },
];

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-slate-100">Community</h1>
      <HubNav items={tabs} />
      {children}
    </div>
  );
}
