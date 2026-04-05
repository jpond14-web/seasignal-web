export default function MLCReferencePage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Intro */}
      <div className="bg-navy-900 border border-teal-500/20 rounded-lg p-5 mb-6">
        <p className="text-slate-300 text-sm leading-relaxed">
          The Maritime Labour Convention, 2006 (MLC) is your bill of rights as a
          seafarer. Adopted by the ILO and ratified by over 100 countries, it
          sets minimum standards for nearly every aspect of your working life at
          sea. This is a plain-language reference — not legal advice, but
          knowledge every seafarer should have.
        </p>
      </div>

      {/* Title I */}
      <MLCTitle
        number={1}
        name="Minimum Requirements for Seafarers to Work on a Ship"
        points={[
          "You must be at least 16 years old to work on a ship. Night work and hazardous work requires you to be at least 18.",
          "You have the right to a valid medical certificate confirming fitness for duty. The flag state sets the standard, but it must meet ILO/WHO guidelines.",
          "You must hold the appropriate certificates of competency and training for your position. No company may require you to work outside your qualifications.",
        ]}
        violation={{
          title: "Underage crew or expired medicals",
          text: "If you see anyone under 18 doing hazardous work (working aloft, night watches, handling chemicals), or if you are pressured to sail without a valid medical certificate, this is a serious MLC violation. Report it to port state control or the ITF.",
        }}
      />

      {/* Title II */}
      <MLCTitle
        number={2}
        name="Conditions of Employment"
        points={[
          "You are entitled to a written Seafarer Employment Agreement (SEA) that you have had the chance to read and understand BEFORE you sign it. You must receive a copy.",
          "Your wages must be paid at least monthly, in full, and in a currency you agreed to. Deductions are only permitted where authorized by law or collective agreement.",
          "Maximum work hours are 14 hours in any 24-hour period and 72 hours in any 7-day period. Alternatively, minimum rest is 10 hours in 24 hours and 77 hours in 7 days. Rest may be divided into no more than two periods, one of which must be at least 6 hours.",
        ]}
        violation={{
          title: "Unpaid wages & rest hour violations",
          text: "These are the most commonly violated MLC provisions. If your wages are late, incomplete, or your rest hours are being falsified in the records, keep your own written log of actual hours worked. This is admissible evidence in any MLC complaint.",
        }}
      />

      {/* Title III */}
      <MLCTitle
        number={3}
        name="Accommodation, Recreational Facilities, Food and Catering"
        points={[
          "Your accommodation must be safe, decent, and properly maintained. Minimum cabin sizes are specified. You have a right to adequate heating, ventilation, and sanitary facilities.",
          "Food must be of sufficient quality, quantity, and nutritional value. Drinking water must always be available. The ship must carry a qualified cook on vessels with 10 or more crew.",
          "Recreational facilities appropriate to the crew size must be provided. This includes access to the open deck, and where practical, a common room with entertainment.",
        ]}
        violation={{
          title: "Substandard living conditions",
          text: "Broken air conditioning, insect infestation, inadequate food, contaminated drinking water — these are not 'just how it is at sea.' If conditions are genuinely substandard, you can request a port state control inspection without fear of retaliation under MLC Standard A5.1.4.",
        }}
      />

      {/* Title IV */}
      <MLCTitle
        number={4}
        name="Health Protection, Medical Care, Welfare and Social Security"
        points={[
          "You have the right to medical care on board at no cost to you. The ship must carry adequate medicines, equipment, and a medical guide. On vessels with 100+ crew, a qualified doctor is required.",
          "Occupational health and safety programs must be implemented. Risk assessments, protective equipment, and safety committee participation are your rights.",
          "Shore-based welfare facilities (seafarer centres, communication access) should be available in port. Shore leave is a right, not a privilege — though it may be subject to operational and visa requirements.",
        ]}
        violation={{
          title: "Denied medical care or shore leave",
          text: "If you are ill or injured and the Master refuses to arrange medical treatment (including medical evacuation if necessary), this is a grave MLC violation. Similarly, systematic denial of shore leave without legitimate reason violates Regulation 2.4.",
        }}
      />

      {/* Title V */}
      <MLCTitle
        number={5}
        name="Compliance and Enforcement"
        points={[
          "Flag states must inspect and certify ships flying their flag. A Maritime Labour Certificate and Declaration of Maritime Labour Compliance must be carried on board.",
          "Port state control officers can inspect any foreign ship in their port for MLC compliance. They can detain ships with serious deficiencies.",
          "You have the right to file a complaint on board (to the Master or through the onboard complaints procedure) and ashore (to port state control) without retaliation. MLC Standard A5.1.4 explicitly protects you.",
        ]}
        violation={{
          title: "Retaliation for complaints",
          text: "If you file an MLC complaint and face any form of retaliation — dismissal, blacklisting, transfer to worse duties, intimidation — this is itself a violation. Document everything and contact the ITF or your flag state maritime authority immediately.",
        }}
      />

      {/* Full text link */}
      <div className="mt-8 bg-navy-900 border border-navy-700 rounded-lg p-5 text-center">
        <p className="text-slate-400 text-sm mb-3">
          This is a simplified reference. For the full legal text:
        </p>
        <a
          href="https://www.ilo.org/global/standards/maritime-labour-convention/text/lang--en/index.htm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          Read the Full MLC Text on ILO.org
        </a>
      </div>
    </div>
  );
}

function MLCTitle({
  number,
  name,
  points,
  violation,
}: {
  number: number;
  name: string;
  points: string[];
  violation: { title: string; text: string };
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">
        Title {number}
      </h2>
      <p className="text-teal-400 text-sm font-medium mb-4">{name}</p>

      <div className="space-y-3 mb-4">
        {points.map((point, i) => (
          <div
            key={i}
            className="bg-navy-900 border border-navy-700 rounded-lg p-4"
          >
            <p className="text-slate-300 text-sm leading-relaxed">{point}</p>
          </div>
        ))}
      </div>

      {/* Know Your Rights callout */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">
            &#9888;
          </span>
          <div>
            <h4 className="text-amber-400 font-semibold text-sm mb-1">
              Know Your Rights: {violation.title}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              {violation.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
