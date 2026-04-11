import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Glossary | SeaSignal",
  description:
    "Everything you need to know about using SeaSignal — how it works, rating scales, maritime glossary, and emergency contacts.",
};

const features = [
  {
    title: "Reviews",
    description:
      "Rate companies, vessels, and manning agencies from 1\u20135 across 7 dimensions. Your reviews are anonymous by default and batch-released every Sunday.",
  },
  {
    title: "Signal Flares",
    description:
      "Report systemic violations like wage theft, unsafe conditions, or document retention. When patterns emerge, SeaSignal investigates and contacts companies.",
  },
  {
    title: "Welfare",
    description:
      "Track your wellbeing, check your rights under MLC 2006, access emergency contacts and mental health resources \u2014 all private to you.",
  },
];

const ratingScale = [
  {
    score: 1,
    label: "Very Poor",
    color: "text-red-400",
    description: "Serious problems. Multiple violations or unsafe conditions.",
  },
  {
    score: 2,
    label: "Poor",
    color: "text-orange-400",
    description: "Significant issues. Falls short of acceptable standards.",
  },
  {
    score: 3,
    label: "Average",
    color: "text-amber-400",
    description: "Meets minimum requirements but room for improvement.",
  },
  {
    score: 4,
    label: "Good",
    color: "text-teal-400",
    description: "Reliable and professional. Few or minor issues.",
  },
  {
    score: 5,
    label: "Excellent",
    color: "text-green-400",
    description: "Outstanding. Exceeds standards consistently.",
  },
];

const glossary = [
  {
    term: "MLC 2006",
    definition:
      "Maritime Labour Convention \u2014 the international \u2018bill of rights\u2019 for seafarers. Sets minimum standards for working conditions.",
  },
  {
    term: "SEA",
    definition:
      "Seafarer Employment Agreement \u2014 your employment contract. Must comply with MLC standards.",
  },
  {
    term: "PSC",
    definition:
      "Port State Control \u2014 inspectors who can board and inspect vessels in their ports. Can detain ships for violations.",
  },
  {
    term: "ITF",
    definition:
      "International Transport Workers\u2019 Federation \u2014 global union federation that supports seafarers\u2019 rights.",
  },
  {
    term: "Flag State",
    definition:
      "The country where a ship is registered. Responsible for enforcing maritime laws on that vessel.",
  },
  {
    term: "STCW",
    definition:
      "Standards of Training, Certification and Watchkeeping \u2014 the convention governing seafarer qualifications.",
  },
  {
    term: "P&I Club",
    definition:
      "Protection and Indemnity Club \u2014 insurance providers for ships. Can be contacted about safety issues.",
  },
  {
    term: "ISWAN",
    definition:
      "International Seafarers\u2019 Welfare and Assistance Network \u2014 runs SeafarerHelp, a free 24/7 multilingual helpline.",
  },
  {
    term: "ISM Code",
    definition:
      "International Safety Management Code \u2014 requires companies to establish safety management systems.",
  },
  {
    term: "SOLAS",
    definition:
      "Safety of Life at Sea \u2014 the key international treaty governing maritime safety.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">
          Help &amp; Glossary
        </h1>
        <p className="mt-2 text-lg text-slate-400">
          Everything you need to know about using SeaSignal.
        </p>
      </div>

      {/* How SeaSignal Works */}
      <section className="mb-14">
        <h2 className="mb-6 text-xl font-semibold text-slate-100">
          How SeaSignal Works
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-navy-700 bg-navy-800 p-6"
            >
              <h3 className="mb-2 text-lg font-semibold text-teal-400">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Rating Scale */}
      <section className="mb-14">
        <h2 className="mb-6 text-xl font-semibold text-slate-100">
          Rating Scale
        </h2>
        <div className="space-y-3">
          {ratingScale.map((r) => (
            <div
              key={r.score}
              className="flex items-start gap-4 rounded-lg border border-navy-700 bg-navy-900 px-5 py-4"
            >
              <span
                className={`shrink-0 text-2xl font-bold ${r.color}`}
              >
                {r.score}
              </span>
              <div>
                <span className={`font-semibold ${r.color}`}>
                  {r.label}
                </span>
                <span className="mx-2 text-slate-500">&mdash;</span>
                <span className="text-sm text-slate-300">
                  {r.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Maritime Glossary */}
      <section className="mb-14">
        <h2 className="mb-6 text-xl font-semibold text-slate-100">
          Maritime Glossary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {glossary.map((g) => (
            <div
              key={g.term}
              className="rounded-lg border border-navy-700 bg-navy-900 px-5 py-4"
            >
              <dt className="mb-1 font-semibold text-teal-400">{g.term}</dt>
              <dd className="text-sm leading-relaxed text-slate-300">
                {g.definition}
              </dd>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="rounded-xl border border-navy-700 bg-navy-800 p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">
          Emergency Contacts
        </h2>
        <ul className="space-y-3 text-sm text-slate-300">
          <li>
            <span className="font-semibold text-teal-400">
              SeafarerHelp (ISWAN)
            </span>
            <br />
            Phone:{" "}
            <a
              href="tel:+442073232737"
              className="text-slate-100 underline underline-offset-2 hover:text-teal-400"
            >
              +44 20 7323 2737
            </a>
            <span className="mx-2 text-slate-500">|</span>
            WhatsApp:{" "}
            <a
              href="https://wa.me/447909890365"
              className="text-slate-100 underline underline-offset-2 hover:text-teal-400"
            >
              +44 7909 890 365
            </a>
          </li>
          <li>
            <span className="font-semibold text-teal-400">ITF</span>
            <br />
            <a
              href="https://www.itfseafarers.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-100 underline underline-offset-2 hover:text-teal-400"
            >
              itfseafarers.org
            </a>
          </li>
          <li className="pt-1 text-slate-400">
            In port? Ask for the Port State Control authority or the port
            chaplain.
          </li>
        </ul>
      </section>
    </div>
  );
}
