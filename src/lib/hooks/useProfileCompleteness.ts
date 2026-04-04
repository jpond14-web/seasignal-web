"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

interface ProfileCompleteness {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  loading: boolean;
}

interface FieldCheck {
  key: string;
  label: string;
  weight: number;
  check: (profile: Tables<"profiles">, extra: ExtraData) => boolean;
}

interface ExtraData {
  certCount: number;
  seaTimeCount: number;
}

const FIELD_CHECKS: FieldCheck[] = [
  {
    key: "display_name",
    label: "Display name",
    weight: 10,
    check: (p) => !!p.display_name && p.display_name.trim().length > 0,
  },
  {
    key: "avatar_url",
    label: "Profile photo",
    weight: 10,
    check: (p) => !!p.avatar_url,
  },
  {
    key: "department",
    label: "Department",
    weight: 10,
    check: (p) => !!p.department_tag,
  },
  {
    key: "rank_category",
    label: "Rank",
    weight: 10,
    check: (p) => !!p.rank_range,
  },
  {
    key: "experience_band",
    label: "Sea experience",
    weight: 10,
    check: (p) => !!p.experience_band,
  },
  {
    key: "bio",
    label: "Bio",
    weight: 10,
    check: (p) => !!p.bio && p.bio.trim().length > 0,
  },
  {
    key: "home_port",
    label: "Home port",
    weight: 5,
    check: (p) => !!p.home_port && p.home_port.trim().length > 0,
  },
  {
    key: "current_port",
    label: "Current port",
    weight: 5,
    check: (p) => !!p.current_port && p.current_port.trim().length > 0,
  },
  {
    key: "vessel_type_preferences",
    label: "Vessel type preferences",
    weight: 10,
    check: (p) => !!p.vessel_type_tags && p.vessel_type_tags.length > 0,
  },
  {
    key: "certificates",
    label: "At least 1 certificate",
    weight: 10,
    check: (_p, extra) => extra.certCount > 0,
  },
  {
    key: "sea_time",
    label: "At least 1 sea time record",
    weight: 10,
    check: (_p, extra) => extra.seaTimeCount > 0,
  },
];

export function useProfileCompleteness(): ProfileCompleteness {
  const [state, setState] = useState<ProfileCompleteness>({
    percentage: 0,
    completedFields: [],
    missingFields: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function calculate() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (!profile || cancelled) return;

      const { count: certCount } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile.id);

      const { count: seaTimeCount } = await supabase
        .from("sea_time_records")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile.id);

      if (cancelled) return;

      const extra: ExtraData = {
        certCount: certCount ?? 0,
        seaTimeCount: seaTimeCount ?? 0,
      };

      let totalWeight = 0;
      const completedFields: string[] = [];
      const missingFields: string[] = [];

      for (const field of FIELD_CHECKS) {
        if (field.check(profile, extra)) {
          totalWeight += field.weight;
          completedFields.push(field.label);
        } else {
          missingFields.push(field.label);
        }
      }

      if (!cancelled) {
        setState({
          percentage: totalWeight,
          completedFields,
          missingFields,
          loading: false,
        });
      }
    }

    calculate();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
