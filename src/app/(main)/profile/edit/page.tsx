"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import type { Tables, Enums } from "@/lib/supabase/types";

const departments: { value: Enums<"department_type">; label: string }[] = [
  { value: "deck", label: "Deck" },
  { value: "engine", label: "Engine" },
  { value: "electro", label: "Electro-Technical" },
  { value: "catering", label: "Catering" },
];

const rankCategories: { value: Enums<"rank_category">; label: string }[] = [
  { value: "cadet", label: "Cadet" },
  { value: "rating", label: "Rating" },
  { value: "officer", label: "Officer" },
];

const experienceBands: { value: Enums<"experience_band">; label: string }[] = [
  { value: "0_2y", label: "0-2 years" },
  { value: "3_5y", label: "3-5 years" },
  { value: "6_10y", label: "6-10 years" },
  { value: "10y_plus", label: "10+ years" },
];

const vesselTypes: { value: Enums<"vessel_type">; label: string }[] = [
  { value: "tanker", label: "Tanker" },
  { value: "bulk_carrier", label: "Bulk Carrier" },
  { value: "container", label: "Container" },
  { value: "general_cargo", label: "General Cargo" },
  { value: "offshore", label: "Offshore" },
  { value: "passenger", label: "Passenger" },
  { value: "roro", label: "RoRo" },
  { value: "lng", label: "LNG" },
  { value: "lpg", label: "LPG" },
  { value: "chemical", label: "Chemical" },
  { value: "reefer", label: "Reefer" },
  { value: "tug", label: "Tug" },
  { value: "fishing", label: "Fishing" },
  { value: "other", label: "Other" },
];

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [rankRange, setRankRange] = useState<string>("");
  const [experienceBand, setExperienceBand] = useState<string>("");
  const [bio, setBio] = useState("");
  const [homePort, setHomePort] = useState("");
  const [currentPort, setCurrentPort] = useState("");
  const [availableFor, setAvailableFor] = useState<string[]>([]);
  const [selectedVesselTypes, setSelectedVesselTypes] = useState<Enums<"vessel_type">[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        setDepartment(data.department_tag || "");
        setRankRange(data.rank_range || "");
        setExperienceBand(data.experience_band || "");
        setBio(data.bio || "");
        setHomePort(data.home_port || "");
        setCurrentPort((data as Record<string, unknown>).current_port as string || "");
        setAvailableFor(((data as Record<string, unknown>).available_for as string[]) || []);
        setSelectedVesselTypes(data.vessel_type_tags || []);
        setAvatarUrl((data as Record<string, unknown>).avatar_url as string | null);
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggleVesselType(vt: Enums<"vessel_type">) {
    setSelectedVesselTypes((prev) =>
      prev.includes(vt) ? prev.filter((t) => t !== vt) : [...prev, vt]
    );
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > MAX_AVATAR_SIZE) {
      showToast("Image must be under 2MB", "error");
      return;
    }

    setUploadingAvatar(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${profile.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showToast(uploadError.message, "error");
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      showToast(updateError.message, "error");
    } else {
      setAvatarUrl(publicUrl);
      showToast("Avatar updated");
    }

    setUploadingAvatar(false);
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemoveAvatar() {
    if (!profile) return;
    setUploadingAvatar(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", profile.id);

    if (updateError) {
      showToast(updateError.message, "error");
    } else {
      setAvatarUrl(null);
      showToast("Avatar removed");
    }
    setUploadingAvatar(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        department_tag: (department as Enums<"department_type">) || null,
        rank_range: (rankRange as Enums<"rank_category">) || null,
        experience_band: (experienceBand as Enums<"experience_band">) || null,
        bio: bio.trim() || null,
        home_port: homePort.trim() || null,
        current_port: currentPort.trim() || null,
        available_for: availableFor,
        vessel_type_tags: selectedVesselTypes.length > 0 ? selectedVesselTypes : null,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      showToast(updateError.message, "error");
    } else {
      showToast("Profile updated successfully");
      router.push("/profile");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile photo"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-2 border-navy-600"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-navy-600 flex items-center justify-center text-2xl font-medium text-slate-200">
              {displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-3 py-1.5 text-xs bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? "Uploading..." : "Change Photo"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="px-3 py-1.5 text-xs bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-red-400 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm text-slate-300 mb-1.5">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm text-slate-300 mb-1.5">
            Department
          </label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">None</option>
            {departments.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rankRange" className="block text-sm text-slate-300 mb-1.5">
            Rank Range
          </label>
          <select
            id="rankRange"
            value={rankRange}
            onChange={(e) => setRankRange(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">None</option>
            {rankCategories.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="experience" className="block text-sm text-slate-300 mb-1.5">
            Sea Experience
          </label>
          <select
            id="experience"
            value={experienceBand}
            onChange={(e) => setExperienceBand(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">None</option>
            {experienceBands.map((eb) => (
              <option key={eb.value} value={eb.value}>{eb.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="homePort" className="block text-sm text-slate-300 mb-1.5">
            Home Port
          </label>
          <input
            id="homePort"
            type="text"
            value={homePort}
            onChange={(e) => setHomePort(e.target.value)}
            placeholder="e.g. Manila, Rotterdam"
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            Vessel Types
          </label>
          <div className="flex flex-wrap gap-2">
            {vesselTypes.map((vt) => (
              <button
                key={vt.value}
                type="button"
                onClick={() => toggleVesselType(vt.value)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  selectedVesselTypes.includes(vt.value)
                    ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                    : "bg-navy-800 text-slate-400 border-navy-600 hover:text-slate-300"
                }`}
              >
                {vt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm text-slate-300 mb-1.5">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Tell other seafarers about yourself (max 500 characters)"
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
          <p className="text-xs text-slate-500 mt-1 text-right">{bio.length}/500</p>
        </div>

        <div>
          <label htmlFor="currentPort" className="block text-sm text-slate-300 mb-1.5">
            Current Port
          </label>
          <input
            id="currentPort"
            type="text"
            value={currentPort}
            onChange={(e) => setCurrentPort(e.target.value)}
            placeholder="e.g. Singapore, Hamburg"
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            Available For
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "jobs", label: "Jobs" },
              { value: "mentoring", label: "Mentoring" },
              { value: "networking", label: "Networking" },
              { value: "advice", label: "Advice" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setAvailableFor((prev) =>
                    prev.includes(opt.value)
                      ? prev.filter((v) => v !== opt.value)
                      : [...prev, opt.value]
                  )
                }
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  availableFor.includes(opt.value)
                    ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                    : "bg-navy-800 text-slate-400 border-navy-600 hover:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="px-4 py-2.5 bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
