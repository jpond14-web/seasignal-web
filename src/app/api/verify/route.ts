import { createClient } from "@/lib/supabase/server";

const CERT_TYPE_TO_SETTING: Record<string, string> = {
  coc: "allow_coc_verification",
  stcw: "allow_stcw_verification",
  medical: "allow_medical_verification",
  endorsement: "allow_endorsement_verification",
  specialty: "allow_specialty_verification",
};

function computeExpiryStatus(expiryDate: string | null): string {
  if (!expiryDate) return "unknown";
  const now = new Date();
  const expiry = new Date(expiryDate);
  if (expiry < now) return "expired";
  // Expiring if within 90 days
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  if (expiry.getTime() - now.getTime() < ninetyDays) return "expiring";
  return "valid";
}

function rateLimitHeaders() {
  return {
    "X-RateLimit-Limit": "60",
    "X-RateLimit-Remaining": "59",
    "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
  };
}

export async function POST(request: Request) {
  const headers = rateLimitHeaders();

  // Parse request body
  let body: { platform_token?: string; cert_type?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON", verified: false },
      { status: 400, headers }
    );
  }

  const { platform_token, cert_type } = body;

  if (!platform_token || typeof platform_token !== "string") {
    return Response.json(
      { error: "platform_token is required", verified: false },
      { status: 400, headers }
    );
  }

  // Validate cert_type if provided
  if (cert_type && !CERT_TYPE_TO_SETTING[cert_type]) {
    return Response.json(
      {
        error: `Invalid cert_type. Must be one of: ${Object.keys(CERT_TYPE_TO_SETTING).join(", ")}`,
        verified: false,
      },
      { status: 400, headers }
    );
  }

  const supabase = await createClient();

  // Look up profile by platform_token
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("platform_token", platform_token)
    .single();

  if (!profile) {
    return Response.json(
      { error: "Token not found", verified: false },
      { status: 404, headers }
    );
  }

  // Get verification settings
  const { data: settings } = await supabase
    .from("verification_settings")
    .select(
      "allow_coc_verification, allow_stcw_verification, allow_medical_verification, allow_endorsement_verification, allow_specialty_verification, auto_authorize_psc, notification_on_request"
    )
    .eq("profile_id", profile.id)
    .single();

  if (!settings) {
    return Response.json(
      { error: "Verification settings not configured", verified: false },
      { status: 404, headers }
    );
  }

  // If a specific cert_type is requested, check it is allowed
  if (cert_type) {
    const settingKey = CERT_TYPE_TO_SETTING[cert_type];
    if (!settings[settingKey as keyof typeof settings]) {
      // Log the denied request
      await supabase.from("verification_requests").insert({
        platform_token,
        cert_type,
        request_status: "denied",
        requester_email: "api@seasignal.app",
        requester_name: "API Request",
        requester_type: "api",
        completed_at: new Date().toISOString(),
      });

      return Response.json(
        {
          error: "Verification not authorized for this credential type",
          verified: false,
        },
        { status: 403, headers }
      );
    }
  }

  // Determine which cert types to query
  type CertType = "coc" | "stcw" | "medical" | "visa" | "endorsement" | "short_course" | "flag_state" | "gmdss" | "other";
  const enabledTypes: CertType[] = [];
  if (cert_type) {
    enabledTypes.push(cert_type as CertType);
  } else {
    for (const [type, settingKey] of Object.entries(CERT_TYPE_TO_SETTING)) {
      if (settings[settingKey as keyof typeof settings]) {
        enabledTypes.push(type as CertType);
      }
    }
  }

  if (enabledTypes.length === 0) {
    return Response.json(
      { error: "No credential types are enabled for verification", verified: false },
      { status: 403, headers }
    );
  }

  // Fetch certificates for enabled types
  const { data: certificates } = await supabase
    .from("certificates")
    .select("cert_type, status, expiry_date, verification_level")
    .eq("profile_id", profile.id)
    .in("cert_type", enabledTypes);

  const results = (certificates || []).map((cert) => ({
    cert_type: cert.cert_type,
    status: cert.status,
    verification_level: cert.verification_level,
    expiry_status: computeExpiryStatus(cert.expiry_date),
  }));

  // Log the verification request
  const requestStatus = settings.auto_authorize_psc ? "approved" : "pending";
  await supabase.from("verification_requests").insert({
    platform_token,
    cert_type: cert_type || enabledTypes[0],
    request_status: requestStatus,
    requester_email: "api@seasignal.app",
    requester_name: "API Request",
    requester_type: "api",
    seafarer_authorized: settings.auto_authorize_psc ? true : null,
    completed_at: settings.auto_authorize_psc ? new Date().toISOString() : null,
  });

  return Response.json(
    {
      verified: true,
      results,
      checked_at: new Date().toISOString(),
    },
    { status: 200, headers }
  );
}
