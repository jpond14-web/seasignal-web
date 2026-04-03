"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export default function VerifyPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

      if (!data) {
        router.push("/profile/setup");
        return;
      }

      if (data.is_verified) {
        router.push("/profile");
        return;
      }

      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedFile) return;

    setUploading(true);
    setError("");

    const filePath = `${profile.id}/${selectedFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-docs")
      .upload(filePath, selectedFile, { upsert: true });

    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
    } else {
      setSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="text-slate-400 hover:text-teal-400 transition-colors text-sm"
        >
          &larr; Profile
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Get Verified</h1>
      <p className="text-slate-400 text-sm mb-6">
        Upload your seafarer credentials (CoC, STCW, seaman&apos;s book, or
        similar) to verify your identity. An admin will review your documents.
      </p>

      {/* Current status */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <p className="text-sm text-slate-300">
            Status: <span className="text-amber-400 font-medium">Unverified</span>
          </p>
        </div>
        <p className="text-xs text-slate-500 mt-1 ml-4">
          Verified seafarers get a badge on their profile and access to
          restricted forums.
        </p>
      </div>

      {success ? (
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6 text-center">
          <p className="text-teal-400 font-medium mb-1">
            Documents submitted for review
          </p>
          <p className="text-sm text-slate-400">
            An admin will review your upload shortly. You will be notified once
            your profile is verified.
          </p>
          <div className="mt-4 flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="px-4 py-2 text-sm bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 transition-colors"
            >
              Upload Another
            </button>
            <Link
              href="/profile"
              className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded transition-colors"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label
              htmlFor="docFile"
              className="block text-sm text-slate-300 mb-1.5"
            >
              Credential Document
            </label>
            <input
              ref={fileInputRef}
              id="docFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-navy-600 file:text-sm file:font-medium file:bg-navy-800 file:text-slate-300 hover:file:bg-navy-700 file:transition-colors file:cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-1">
              Accepted formats: PDF, JPG, PNG, WebP. Max 10 MB.
            </p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-medium rounded text-sm transition-colors"
          >
            {uploading ? "Uploading..." : "Submit for Verification"}
          </button>
        </form>
      )}
    </div>
  );
}
