"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mentor = {
  id: string;
  profile_id: string;
  bio: string;
  expertise_tags: string[];
  max_mentees: number;
  is_active: boolean;
  profiles: { display_name: string } | null;
};

type MentorshipRequest = {
  id: string;
  mentor_id: string;
  mentee_id: string;
  message: string | null;
  status: string;
  created_at: string;
  mentors: { profiles: { display_name: string } | null } | null;
};

type IncomingRequest = {
  id: string;
  mentee_id: string;
  message: string | null;
  status: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

const EXPERTISE_OPTIONS = [
  "Navigation",
  "Engineering",
  "LNG/LPG",
  "Offshore/DP",
  "Tanker Operations",
  "Ice Navigation",
  "ECDIS",
  "Electro-Technical",
  "Catering/Galley",
  "Safety/ISM",
  "Cargo Handling",
  "Career Transition",
  "Women in Maritime",
  "Cadet Guidance",
];

export default function MentorsPage() {
  const supabase = createClient();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [myMentorId, setMyMentorId] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([]);
  const [requestedMentorIds, setRequestedMentorIds] = useState<Set<string>>(new Set());
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("");

  // Become mentor form
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [mentorBio, setMentorBio] = useState("");
  const [mentorTags, setMentorTags] = useState<string[]>([]);
  const [mentorMaxMentees, setMentorMaxMentees] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request form
  const [requestingMentorId, setRequestingMentorId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  const fetchMentors = useCallback(async () => {
    const { data } = await supabase
      .from("mentors")
      .select("id, profile_id, bio, expertise_tags, max_mentees, is_active, profiles(display_name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (data) setMentors(data as unknown as Mentor[]);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { await fetchMentors(); setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (profile) {
        setProfileId(profile.id);

        // Check if user is already a mentor
        const { data: myMentor } = await supabase
          .from("mentors")
          .select("id")
          .eq("profile_id", profile.id)
          .single();
        if (myMentor) {
          setMyMentorId(myMentor.id);
          // Load incoming requests for this mentor
          const { data: incoming } = await supabase
            .from("mentorship_requests")
            .select("id, mentee_id, message, status, created_at, profiles:mentee_id(display_name)")
            .eq("mentor_id", myMentor.id)
            .order("created_at", { ascending: false });
          if (incoming) setIncomingRequests(incoming as unknown as IncomingRequest[]);
        }

        // Load user's outgoing requests
        const { data: requests } = await supabase
          .from("mentorship_requests")
          .select("id, mentor_id, mentee_id, message, status, created_at, mentors(profiles(display_name))")
          .eq("mentee_id", profile.id)
          .order("created_at", { ascending: false });
        if (requests) {
          setMyRequests(requests as unknown as MentorshipRequest[]);
          setRequestedMentorIds(new Set(requests.map((r) => r.mentor_id)));
        }
      }

      await fetchMentors();
      setLoading(false);
    })();
  }, [supabase, fetchMentors]);

  const filtered = mentors.filter((m) => {
    if (profileId && m.profile_id === profileId) return false; // Hide self
    if (expertiseFilter && !m.expertise_tags.includes(expertiseFilter)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (m.profiles?.display_name ?? "").toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.expertise_tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleBecomeMentor = async () => {
    if (!profileId) return;
    if (mentorBio.length < 10) { setError("Bio must be at least 10 characters."); return; }
    if (mentorTags.length === 0) { setError("Select at least one expertise area."); return; }
    setSubmitting(true);
    setError(null);

    const { data, error: insertErr } = await supabase
      .from("mentors")
      .insert({
        profile_id: profileId,
        bio: mentorBio,
        expertise_tags: mentorTags,
        max_mentees: mentorMaxMentees,
      })
      .select("id")
      .single();

    if (insertErr) {
      setError(insertErr.message);
    } else if (data) {
      setMyMentorId(data.id);
      setShowMentorForm(false);
      await fetchMentors();
    }
    setSubmitting(false);
  };

  const handleRequest = async (mentorId: string) => {
    if (!profileId) return;
    setSubmitting(true);
    const { error: insertErr } = await supabase.from("mentorship_requests").insert({
      mentor_id: mentorId,
      mentee_id: profileId,
      message: requestMessage || null,
    });
    if (insertErr) {
      setError(insertErr.message);
    } else {
      setRequestedMentorIds((prev) => new Set(prev).add(mentorId));
      setRequestingMentorId(null);
      setRequestMessage("");
    }
    setSubmitting(false);
  };

  const handleUpdateRequest = async (requestId: string, status: "pending" | "accepted" | "declined" | "cancelled") => {
    await supabase.from("mentorship_requests").update({ status }).eq("id", requestId);
    setMyRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
    setIncomingRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
  };

  const toggleTag = (tag: string) => {
    setMentorTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="animate-pulse text-slate-500 text-sm">Loading mentors...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Intro banner */}
      <div className="bg-navy-900 border border-teal-500/20 rounded-lg p-5 mb-6">
        <p className="text-slate-300 text-sm leading-relaxed">
          An offshore engineer can teach a cargo cadet things no school will.
          Mentorship at sea isn&apos;t about rank or department &mdash; it&apos;s about
          passing on the knowledge that keeps people safe and careers moving forward.
        </p>
      </div>

      {/* My pending requests (if mentee) */}
      {myRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">My Requests</h2>
          <div className="space-y-2">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <span className="text-slate-200 text-sm font-medium">
                    {(req.mentors as unknown as { profiles: { display_name: string } | null })?.profiles?.display_name ?? "Mentor"}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded border ${
                    req.status === "accepted"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : req.status === "declined"
                        ? "bg-red-500/15 border-red-500/40 text-red-400"
                        : "bg-amber-500/15 border-amber-500/40 text-amber-400"
                  }`}>
                    {req.status}
                  </span>
                </div>
                {req.status === "pending" && (
                  <button
                    onClick={() => handleUpdateRequest(req.id, "cancelled")}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Incoming requests (if mentor) */}
      {incomingRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Mentorship Requests</h2>
          <div className="space-y-2">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-200 text-sm font-medium">
                        {req.profiles?.display_name ?? "Seafarer"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        req.status === "accepted"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : req.status === "declined"
                            ? "bg-red-500/15 border-red-500/40 text-red-400"
                            : req.status === "cancelled"
                              ? "bg-slate-500/15 border-slate-500/40 text-slate-400"
                              : "bg-amber-500/15 border-amber-500/40 text-amber-400"
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {req.message && (
                      <p className="text-slate-400 text-sm mt-1">{req.message}</p>
                    )}
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleUpdateRequest(req.id, "accepted")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleUpdateRequest(req.id, "declined")}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Find a Mentor section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Find a Mentor</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by name, skill, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
          />
          <select
            value={expertiseFilter}
            onChange={(e) => setExpertiseFilter(e.target.value)}
            className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm"
          >
            <option value="">All expertise</option>
            {EXPERTISE_OPTIONS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Mentor grid */}
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">
            No mentors match your filters. Try broadening your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((mentor) => {
              const alreadyRequested = requestedMentorIds.has(mentor.id);
              return (
                <div
                  key={mentor.id}
                  className="bg-navy-900 border border-navy-700 rounded-lg p-5 flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-navy-700 flex items-center justify-center text-teal-400 font-bold text-base flex-shrink-0">
                      {(mentor.profiles?.display_name ?? "?").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-slate-100 font-semibold text-sm">
                        {mentor.profiles?.display_name ?? "Anonymous"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {mentor.expertise_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-4">
                    {mentor.bio}
                  </p>

                  {requestingMentorId === mentor.id ? (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Introduce yourself briefly (optional)..."
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequest(mentor.id)}
                          disabled={submitting}
                          className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          Send Request
                        </button>
                        <button
                          onClick={() => { setRequestingMentorId(null); setRequestMessage(""); }}
                          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => profileId ? setRequestingMentorId(mentor.id) : undefined}
                      disabled={alreadyRequested || !profileId}
                      className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      {alreadyRequested ? "Request Sent" : "Request Mentorship"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Become a Mentor section */}
      {!myMentorId && profileId && (
        <section>
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
            {!showMentorForm ? (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  Become a Mentor
                </h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto mb-4 leading-relaxed">
                  You have sea time, hard-won knowledge, and lessons learned the difficult
                  way. A cadet or junior officer out there needs exactly what you know.
                </p>
                <button
                  onClick={() => setShowMentorForm(true)}
                  className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
                >
                  Offer to Mentor
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-slate-100 mb-4">Create Your Mentor Profile</h2>
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">About you & how you can help</label>
                    <textarea
                      value={mentorBio}
                      onChange={(e) => setMentorBio(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Share your experience and what you can offer mentees..."
                      className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Areas of expertise</label>
                    <div className="flex flex-wrap gap-2">
                      {EXPERTISE_OPTIONS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            mentorTags.includes(tag)
                              ? "bg-teal-500/15 border-teal-500/40 text-teal-400"
                              : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Maximum mentees</label>
                    <select
                      value={mentorMaxMentees}
                      onChange={(e) => setMentorMaxMentees(Number(e.target.value))}
                      className="bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm"
                    >
                      {[1, 2, 3, 5, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBecomeMentor}
                      disabled={submitting}
                      className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
                    >
                      {submitting ? "Creating..." : "Create Mentor Profile"}
                    </button>
                    <button
                      onClick={() => setShowMentorForm(false)}
                      className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {myMentorId && (
        <section>
          <div className="bg-navy-900 border border-teal-500/20 rounded-lg p-5 text-center">
            <p className="text-teal-400 text-sm font-medium">
              You&apos;re registered as a mentor. Thank you for giving back to the maritime community.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
