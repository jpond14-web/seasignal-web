import { createClient } from "@/lib/supabase/client";

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const supabase = createClient();
  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId || null,
    details: (details as unknown as import("@/lib/supabase/types").Json) ?? undefined,
  });
}
