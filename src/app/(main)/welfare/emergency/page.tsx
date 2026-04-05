interface EmergencyContact {
  org: string;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
  details?: string;
}

interface EmergencyCategory {
  name: string;
  color: string;
  contacts: EmergencyContact[];
}

const CATEGORIES: EmergencyCategory[] = [
  {
    name: "Immediate Emergency",
    color: "border-l-red-500",
    contacts: [
      {
        org: "GMDSS / Coast Guard",
        description:
          "VHF Channel 16 is monitored by coast guards worldwide. This is your first line of communication in any maritime emergency.",
        phone: "VHF Ch 16 (156.8 MHz)",
        details: "Also available via Inmarsat-C distress priority",
      },
      {
        org: "Inmarsat Maritime Safety",
        description:
          "Satellite-based distress and safety communications available globally. Inmarsat-C terminals can send distress alerts even when voice is not possible.",
        phone: "Inmarsat-C distress priority",
        website: "https://www.inmarsat.com/en/solutions-services/maritime/safety.html",
      },
      {
        org: "MRCC Coordination Centres",
        description:
          "Maritime Rescue Coordination Centres operate regionally. Contact the nearest MRCC via VHF, MF, or satellite.",
        phone: "Varies by region",
        details: "Check ITU list of coast stations for local MRCC frequencies",
      },
    ],
  },
  {
    name: "Seafarer Welfare",
    color: "border-l-teal-500",
    contacts: [
      {
        org: "ITF Inspectors",
        description:
          "The International Transport Workers' Federation has inspectors in ports worldwide who can help with wage disputes, contract violations, and unsafe conditions.",
        phone: "+44 20 7403 2733",
        website: "https://www.itfglobal.org/en/sector/seafarers",
        email: "mail@itf.org.uk",
      },
      {
        org: "Seafarers' Rights International",
        description:
          "Independent charity providing research and advocacy on the legal rights of seafarers worldwide.",
        website: "https://www.seafarersrights.org",
        email: "info@seafarersrights.org",
      },
      {
        org: "The Mission to Seafarers",
        description:
          "Present in over 200 ports across 50 countries. Provides practical, emotional, and spiritual support to seafarers of all faiths and none.",
        phone: "+44 20 7248 5202",
        website: "https://www.missiontoseafarers.org",
      },
      {
        org: "The Sailors' Society",
        description:
          "Welfare visits, crisis response, and chaplaincy services in ports around the world. Also operates a 24/7 Crisis Response Network.",
        phone: "+44 23 8051 5950",
        website: "https://www.sailors-society.org",
      },
    ],
  },
  {
    name: "Abandoned Seafarers",
    color: "border-l-amber-500",
    contacts: [
      {
        org: "ILO Abandonment Database",
        description:
          "The International Labour Organization maintains a public database of reported cases of seafarer abandonment. If you or someone you know is abandoned, report it here.",
        website: "https://www.ilo.org/dyn/seafarers/seafarersbrowse.home",
      },
      {
        org: "ITF Abandoned Seafarer Hotline",
        description:
          "If your wages have stopped, your company is unreachable, or you have been left on a vessel without provisions or repatriation, contact the ITF immediately. They have legal authority and resources to intervene.",
        phone: "+44 20 7403 2733",
        email: "mail@itf.org.uk",
      },
    ],
  },
  {
    name: "Legal Aid",
    color: "border-l-blue-500",
    contacts: [
      {
        org: "International Maritime Law Association (IMLA)",
        description:
          "Network of maritime lawyers who may be able to provide guidance or pro-bono assistance for serious cases involving seafarer rights.",
        website: "https://www.comitemaritime.org",
      },
      {
        org: "Flag State Complaint Procedures",
        description:
          "Under MLC 2006, every flag state must have a complaint procedure for seafarers. You can file complaints about working conditions, wages, rest hours, and safety. Your flag state administration website will have details.",
        details:
          "Check your SEA (Seafarer Employment Agreement) for your flag state and look up their maritime authority website",
      },
    ],
  },
  {
    name: "Mental Health",
    color: "border-l-emerald-500",
    contacts: [
      {
        org: "ISWAN SeafarerHelp",
        description:
          "Free, confidential, multilingual helpline available 24 hours a day, 7 days a week. Available via phone, email, chat, and WhatsApp. You do not need to be in crisis to call — they are there for anything you need to talk about.",
        phone: "+44 20 7323 2737",
        email: "help@seafarerhelp.org",
        website: "https://www.seafarerhelp.org",
        details: "Free call via WhatsApp, Facebook Messenger, or web chat",
      },
      {
        org: "Sailors' Society Wellness at Sea",
        description:
          "Wellness programme providing coaching, resources, and support for mental health and emotional wellbeing at sea.",
        website: "https://www.sailors-society.org/wellness",
      },
      {
        org: "Mental Health First Aid at Sea",
        description:
          "If you or a colleague is struggling, knowing the basics of mental health first aid can make a real difference. Ask your company about MHFA training availability.",
        details:
          "WHO guidance for seafarer mental health is available free online",
      },
    ],
  },
];

export default function EmergencyContactsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-navy-900 border border-teal-500/20 rounded-lg p-5 mb-6">
        <p className="text-slate-300 text-sm leading-relaxed">
          You are not alone. These organizations exist because people care about
          seafarers. Whether it is an emergency at sea, unpaid wages, or just
          needing someone to talk to — reach out. There is no shame in asking for
          help.
        </p>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map((category) => (
          <section key={category.name}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              {category.name}
            </h2>
            <div className="space-y-3">
              {category.contacts.map((contact) => (
                <div
                  key={contact.org}
                  className={`bg-navy-900 border border-navy-700 border-l-4 ${category.color} rounded-lg p-5`}
                >
                  <h3 className="text-slate-100 font-semibold text-sm mb-1.5">
                    {contact.org}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-3">
                    {contact.description}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 text-xs w-14 flex-shrink-0">
                          Phone
                        </span>
                        <span className="text-teal-400 font-medium">
                          {contact.phone}
                        </span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 text-xs w-14 flex-shrink-0">
                          Email
                        </span>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-teal-400 hover:text-teal-300 transition-colors"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 text-xs w-14 flex-shrink-0">
                          Web
                        </span>
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 transition-colors truncate"
                        >
                          {contact.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                    {contact.details && (
                      <p className="text-xs text-slate-500 mt-1">
                        {contact.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
