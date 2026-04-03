import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return redirect("/profile/setup");

  // Fetch cert counts for dashboard
  const { data: certs } = await supabase
    .from("certificates")
    .select("id, status")
    .eq("profile_id", profile.id);

  const expiringCerts = certs?.filter((c) => c.status === "expiring").length ?? 0;
  const expiredCerts = certs?.filter((c) => c.status === "expired").length ?? 0;

  // Fetch message conversation count
  const { count: messageCount } = await supabase
    .from("conversation_members")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profile.id);

  // Fetch incident log count
  const { count: incidentCount } = await supabase
    .from("incident_logs")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profile.id);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">
        Welcome back, {profile.display_name}
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        {profile.is_verified ? "Verified Seafarer" : "Unverified account"}{" "}
        &middot; {profile.department_tag ? profile.department_tag.replace(/_/g, " ") : "No department set"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <DashCard
          href="/certs"
          title="Certificates"
          value={certs?.length ?? 0}
          subtitle={
            expiringCerts > 0 || expiredCerts > 0
              ? `${expiringCerts} expiring, ${expiredCerts} expired`
              : "All valid"
          }
          alert={expiringCerts > 0 || expiredCerts > 0}
        />
        <DashCard
          href="/messages"
          title="Messages"
          value={messageCount ?? 0}
          subtitle="Open conversations"
        />
        <DashCard
          href="/incidents"
          title="Incidents"
          value={incidentCount ?? 0}
          subtitle="Private log entries"
        />
      </div>

      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction href="/reviews/new" label="Write Review" />
        <QuickAction href="/pay" label="Check Pay Data" />
        <QuickAction href="/companies" label="Browse Companies" />
        <QuickAction href="/forums" label="Visit Forums" />
        <QuickAction href="/rights" label="Know Your Rights" />
        <QuickAction href="/vessels" label="Browse Vessels" />
        <QuickAction href="/certs" label="Manage Certs" />
        <QuickAction href="/incidents" label="Log Incident" />
      </div>
    </div>
  );
}

function DashCard({
  href,
  title,
  value,
  subtitle,
  alert,
}: {
  href: string;
  title: string;
  value: number | string;
  subtitle: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors"
    >
      <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-mono font-bold text-slate-100 mt-1">
        {value}
      </p>
      <p
        className={`text-xs mt-1 ${
          alert ? "text-amber-400" : "text-slate-500"
        }`}
      >
        {subtitle}
      </p>
    </Link>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center px-3 py-3 bg-navy-900 border border-navy-700 rounded-lg text-sm text-slate-300 hover:text-teal-400 hover:border-teal-500/30 transition-colors text-center"
    >
      {label}
    </Link>
  );
}
