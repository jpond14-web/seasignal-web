import { HubNav } from "@/components/layout/hub-nav";

const tabs = [
  { href: "/career/certs", label: "Certs" },
  { href: "/career/sea-time", label: "Sea Time" },
  { href: "/career/record", label: "My Record" },
  { href: "/career/verification", label: "Verification" },
  { href: "/career/contract-check", label: "Contract Check" },
  { href: "/career/jobs", label: "Jobs" },
];

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-slate-100">My Career</h1>
      <HubNav items={tabs} />
      {children}
    </div>
  );
}
