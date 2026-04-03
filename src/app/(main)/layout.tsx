import { Sidebar, MobileNav } from "@/components/layout/nav";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userInitial = "U";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("auth_user_id", user.id)
      .single();
    if (profile?.display_name) {
      userInitial = profile.display_name.charAt(0).toUpperCase();
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userInitial={userInitial} />
      <div className="flex flex-col flex-1 min-w-0">
        <MobileNav userInitial={userInitial} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
