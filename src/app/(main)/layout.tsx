import { Sidebar, MobileNav } from "@/components/layout/nav";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { InstallPrompt } from "@/components/ui/install-prompt";
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
  let isAdmin = false;
  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, is_verified, avatar_url")
      .eq("auth_user_id", user.id)
      .single();
    if (profile?.display_name) {
      userInitial = profile.display_name.charAt(0).toUpperCase();
    }
    if (profile?.is_verified) {
      isAdmin = true;
    }
    if ((profile as Record<string, unknown>)?.avatar_url) {
      avatarUrl = (profile as Record<string, unknown>).avatar_url as string;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userInitial={userInitial} isAdmin={isAdmin} avatarUrl={avatarUrl} />
      <div className="flex flex-col flex-1 min-w-0">
        <MobileNav userInitial={userInitial} isAdmin={isAdmin} avatarUrl={avatarUrl} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <InstallPrompt />
    </div>
  );
}
