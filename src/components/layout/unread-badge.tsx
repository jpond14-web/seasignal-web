"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let interval: NodeJS.Timeout;

    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (!profile) return;

      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("profile_id", profile.id)
        .eq("is_archived", false);

      if (!memberships || memberships.length === 0) { setCount(0); return; }

      let total = 0;
      for (const m of memberships) {
        let query = supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", m.conversation_id)
          .neq("sender_id", profile.id);

        if (m.last_read_at) {
          query = query.gt("created_at", m.last_read_at);
        }

        const { count: c } = await query;
        total += c || 0;
      }

      setCount(total);
    }

    fetchUnread();
    interval = setInterval(fetchUnread, 30000); // poll every 30s

    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-teal-500 text-navy-950 text-[10px] font-bold rounded-full leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}
