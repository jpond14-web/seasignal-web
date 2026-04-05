"use client";

import { useState } from "react";

interface Mentor {
  id: string;
  name: string;
  department: string;
  experience: string;
  specialization: string;
  bio: string;
}

const DEPARTMENTS = ["All", "Deck", "Engine", "Electro", "Catering"];

const MENTORS: Mentor[] = [
  {
    id: "1",
    name: "Capt. Anders Holm",
    department: "Deck",
    experience: "25+ years",
    specialization: "Ice Navigation & Arctic Operations",
    bio: "Master mariner with extensive experience in polar waters. I've navigated the Northern Sea Route seven times and want to help the next generation understand what no simulator can teach you about ice.",
  },
  {
    id: "2",
    name: "C/E Priya Nair",
    department: "Engine",
    experience: "18 years",
    specialization: "LNG Propulsion Systems",
    bio: "Chief Engineer on dual-fuel LNG carriers. The transition to gas propulsion is the biggest shift in our industry — I can help you understand what to expect and how to prepare for the new machinery.",
  },
  {
    id: "3",
    name: "ETO Roman Petrescu",
    department: "Electro",
    experience: "12 years",
    specialization: "DP Systems & Automation",
    bio: "Electro-Technical Officer specializing in dynamic positioning. If you're moving into DP vessels or offshore, I can guide you through the electronics side that nobody at college covers properly.",
  },
  {
    id: "4",
    name: "2/O Fatima Al-Rashid",
    department: "Deck",
    experience: "8 years",
    specialization: "ECDIS & Navigation Technology",
    bio: "I remember the fear of my first solo bridge watch vividly. Now I help cadets and junior officers build real confidence — not just tick boxes. Women in maritime especially welcome.",
  },
  {
    id: "5",
    name: "Chief Cook Dario Mendez",
    department: "Catering",
    experience: "15 years",
    specialization: "Crew Welfare & Nutrition at Sea",
    bio: "Feeding a multinational crew in heavy weather is an art. I mentor galley cadets and anyone interested in the catering department — the most underrated department on any vessel.",
  },
];

export default function MentorsPage() {
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = MENTORS.filter((m) => {
    if (departmentFilter !== "All" && m.department !== departmentFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.specialization.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Intro banner */}
      <div className="bg-navy-900 border border-teal-500/20 rounded-lg p-5 mb-6">
        <p className="text-slate-300 text-sm leading-relaxed">
          An offshore engineer can teach a cargo cadet things no school will.
          Mentorship at sea isn&apos;t about rank or department — it&apos;s about
          passing on the knowledge that keeps people safe and careers moving forward.
        </p>
      </div>

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
          <div className="flex gap-2 flex-wrap">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors font-medium ${
                  departmentFilter === dept
                    ? "bg-teal-500/15 border-teal-500/40 text-teal-400"
                    : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Mentor grid */}
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">
            No mentors match your filters. Try broadening your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-5 flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-navy-700 flex items-center justify-center text-teal-400 font-bold text-base flex-shrink-0">
                    {mentor.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-slate-100 font-semibold text-sm">
                      {mentor.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-400">
                        {mentor.department}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400">
                        {mentor.experience}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium mb-1">
                  {mentor.specialization}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-4">
                  {mentor.bio}
                </p>

                <button className="w-full bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
                  Request Mentorship
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Become a Mentor section */}
      <section>
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            Become a Mentor
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto mb-4 leading-relaxed">
            You have sea time, hard-won knowledge, and lessons learned the difficult
            way. A cadet or junior officer out there needs exactly what you know.
            Mentorship doesn&apos;t take much time — sometimes a single honest
            conversation changes everything.
          </p>
          <button className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
            Offer to Mentor
          </button>
        </div>
      </section>
    </div>
  );
}
