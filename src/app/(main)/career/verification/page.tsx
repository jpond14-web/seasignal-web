"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type VerificationSettings = {
  id: string;
  profile_id: string;
  allow_coc_verification: boolean;
  allow_stcw_verification: boolean;
  allow_medical_verification: boolean;
  allow_endorsement_verification: boolean;
  allow_specialty_verification: boolean;
  auto_authorize_psc: boolean;
  notification_on_request: boolean;
};

type VerificationRequest = {
  id: string;
  requester_name: string;
  requester_organization: string | null;
  requester_type: string;
  cert_type: string;
  request_status: string;
  created_at: string;
  expires_at: string | null;
};

const CERT_TOGGLES = [
  { key: "allow_coc_verification" as const, label: "Certificate of Competency (CoC)", description: "Allows verification of your CoC number, grade, and validity status." },
  { key: "allow_stcw_verification" as const, label: "STCW Certificates", description: "Basic safety training, survival craft, fire prevention, medical first aid, etc." },
  { key: "allow_medical_verification" as const, label: "Medical Certificate", description: "ENG1/PEME validity and fitness status. No medical details are shared." },
  { key: "allow_endorsement_verification" as const, label: "Flag State Endorsements", description: "Endorsements issued by flag states for your certificates." },
  { key: "allow_specialty_verification" as const, label: "Specialty Certificates", description: "IGF Code, Polar Code, Dynamic Positioning, and other specialty qualifications." },
];

export default function VerificationPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [platformToken, setPlatformToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<VerificationSettings | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [showToken, setShowToken] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, platform_token")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);
    setPlatformToken(profile.platform_token);

    // Load or create verification settings
    const { data: existingSettings } = await supabase
      .from("verification_settings")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    if (existingSettings) {
      setSettings(existingSettings as VerificationSettings);
    } else {
      // Create default settings (all OFF)
      const { data: newSettings } = await supabase
        .from("verification_settings")
        .insert({ profile_id: profile.id })
        .select()
        .single();
      if (newSettings) setSettings(newSettings as VerificationSettings);
    }

    // Load verification requests
    if (profile.platform_token) {
      const { data: reqs } = await supabase
        .from("verification_requests")
        .select("id, requester_name, requester_organization, requester_type, cert_type, request_status, created_at, expires_at")
        .eq("platform_token", profile.platform_token)
        .order("created_at", { ascending: false })
        .limit(20);
      if (reqs) setRequests(reqs as VerificationRequest[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateSetting = async (key: string, value: boolean) => {
    if (!settings || !profileId) return;
    setSaving(true);

    const updated = { ...settings, [key]: value };
    setSettings(updated);

    await supabase
      .from("verification_settings")
      .update({ [key]: value })
      .eq("profile_id", profileId);

    setSaving(false);
  };

  const handleRequest = async (requestId: string, authorize: boolean) => {
    const status = authorize ? "authorized" : "denied";
    await supabase
      .from("verification_requests")
      .update({
        request_status: status,
        seafarer_authorized: authorize,
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, request_status: status } : r))
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 bg-navy-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Explainer */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Credential Verification</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Manning agencies, shipowners, and port state control may request to verify your
          certificates. You control exactly which certificate types can be verified. When a
          request is made, the requester receives only a <strong className="text-slate-300">yes/no/expired</strong> response
          &mdash; they never see your profile, name, vessel history, or any other personal data.
        </p>
        <p className="text-slate-400 text-sm mt-3 leading-relaxed">
          All toggles default to <strong className="text-slate-300">OFF</strong>. You can revoke
          access at any time by turning a toggle off.
        </p>
      </div>

      {/* Platform Token */}
      {platformToken && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Your Verification Token</h3>
            <button
              onClick={() => setShowToken(!showToken)}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              {showToken ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Share this token with authorized parties who need to verify your credentials. It cannot be used to access your profile.
          </p>
          <div className="bg-navy-800 border border-navy-600 rounded px-3 py-2 font-mono text-sm text-slate-300">
            {showToken ? platformToken : "\u2022".repeat(32)}
          </div>
        </div>
      )}

      {/* Certificate Verification Toggles */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
          Certificate Types
        </h3>
        <div className="space-y-4">
          {CERT_TOGGLES.map((toggle) => (
            <div
              key={toggle.key}
              className="flex items-start justify-between gap-4 pb-4 border-b border-navy-700 last:border-0 last:pb-0"
            >
              <div>
                <label className="text-sm font-medium text-slate-200">{toggle.label}</label>
                <p className="text-xs text-slate-500 mt-0.5">{toggle.description}</p>
              </div>
              <button
                onClick={() => updateSetting(toggle.key, !settings?.[toggle.key])}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings?.[toggle.key] ? "bg-teal-500" : "bg-navy-600"
                }`}
                role="switch"
                aria-checked={settings?.[toggle.key] ?? false}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings?.[toggle.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
          Advanced Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-navy-700">
            <div>
              <label className="text-sm font-medium text-slate-200">Auto-authorize Port State Control</label>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically approve verification requests from port state control authorities.
                PSC inspections are a legal requirement &mdash; enabling this speeds up the process.
              </p>
            </div>
            <button
              onClick={() => updateSetting("auto_authorize_psc", !settings?.auto_authorize_psc)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.auto_authorize_psc ? "bg-teal-500" : "bg-navy-600"
              }`}
              role="switch"
              aria-checked={settings?.auto_authorize_psc ?? false}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings?.auto_authorize_psc ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <label className="text-sm font-medium text-slate-200">Notify on verification request</label>
              <p className="text-xs text-slate-500 mt-0.5">
                Receive a notification on The Pulse when someone requests to verify your credentials.
              </p>
            </div>
            <button
              onClick={() => updateSetting("notification_on_request", !settings?.notification_on_request)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.notification_on_request ? "bg-teal-500" : "bg-navy-600"
              }`}
              role="switch"
              aria-checked={settings?.notification_on_request ?? false}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings?.notification_on_request ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Verification Request Log */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
          Verification Requests
        </h3>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No verification requests yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              When a manning agency or authority requests to verify your credentials, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const statusStyles: Record<string, string> = {
                pending: "bg-amber-500/15 border-amber-500/40 text-amber-400",
                authorized: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
                denied: "bg-red-500/15 border-red-500/40 text-red-400",
                completed: "bg-blue-500/15 border-blue-500/40 text-blue-400",
                expired: "bg-slate-500/15 border-slate-500/40 text-slate-400",
              };
              const typeLabels: Record<string, string> = {
                manning_agency: "Manning Agency",
                shipowner: "Shipowner",
                port_state_control: "Port State Control",
                flag_state: "Flag State",
                training_provider: "Training Provider",
              };
              return (
                <div key={req.id} className="bg-navy-800 border border-navy-600 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-slate-200">{req.requester_name}</span>
                        {req.requester_organization && (
                          <span className="text-xs text-slate-500">({req.requester_organization})</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded border ${statusStyles[req.request_status] || statusStyles.pending}`}>
                          {req.request_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{typeLabels[req.requester_type] || req.requester_type}</span>
                        <span>&middot;</span>
                        <span>Requesting: {req.cert_type.toUpperCase()}</span>
                        <span>&middot;</span>
                        <span>{new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                    {req.request_status === "pending" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleRequest(req.id, true)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          Authorize
                        </button>
                        <button
                          onClick={() => handleRequest(req.id, false)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-colors"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
