"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Account</h2>
        <button
          onClick={handleSignOut}
          className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/20 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
