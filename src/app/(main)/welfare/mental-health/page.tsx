export default function MentalHealthPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Opening message */}
      <div className="bg-navy-900 border border-emerald-500/20 rounded-lg p-6 mb-8">
        <h2 className="text-slate-100 font-semibold text-lg mb-2">
          It&apos;s okay to not be okay.
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          The sea can be beautiful and brutal in the same watch. Isolation,
          fatigue, missing your family, pressure from the company — none of
          this makes you weak. It makes you human. These resources are here
          because your wellbeing matters, on board and ashore.
        </p>
      </div>

      {/* Crisis Support */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Crisis Support — Available 24/7
        </h2>
        <div className="bg-navy-900 border border-navy-700 border-l-4 border-l-red-500 rounded-lg p-5">
          <h3 className="text-slate-100 font-semibold text-sm mb-1.5">
            ISWAN SeafarerHelp
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            Free, confidential helpline for seafarers and their families.
            Available 24 hours a day, 365 days a year. Multilingual support.
            You do not need to be in crisis to call — they are there for
            anything you need to talk about. Loneliness, anxiety, problems at
            home, issues on board. Anything.
          </p>
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 text-xs w-14 flex-shrink-0">Phone</span>
              <span className="text-teal-400 font-semibold">+44 20 7323 2737</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 text-xs w-14 flex-shrink-0">Email</span>
              <a
                href="mailto:help@seafarerhelp.org"
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                help@seafarerhelp.org
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 text-xs w-14 flex-shrink-0">Web</span>
              <a
                href="https://www.seafarerhelp.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 transition-colors"
              >
                www.seafarerhelp.org
              </a>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Also available free via WhatsApp, Facebook Messenger, and web chat.
            No ship Wi-Fi needed for WhatsApp calls in many cases.
          </p>
        </div>
      </section>

      {/* Common Challenges */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Common Challenges at Sea
        </h2>
        <div className="space-y-4">
          <ChallengeCard
            title="Homesickness"
            description="Missing birthdays, anniversaries, your children growing up — these are real losses, not weaknesses. The pain of separation is one of the highest costs of a seafaring career."
            strategies={[
              "Schedule regular calls home at fixed times — routine helps both you and your family",
              "Keep photos and personal items in your cabin where you can see them",
              "Write letters or emails even when you cannot send them — it helps to put feelings into words",
              "Talk to shipmates about it — you will find most of them feel the same",
            ]}
          />
          <ChallengeCard
            title="Fatigue"
            description="The 6-on-6-off watch system, port operations, drills, and paperwork add up. Chronic fatigue affects your judgment, mood, and safety. It is not laziness — it is a medical reality."
            strategies={[
              "Guard your rest periods fiercely — they are your right under MLC Regulation 2.3",
              "Create a dark, quiet sleeping environment even during the day",
              "Avoid heavy meals and caffeine close to rest periods",
              "If rest hour violations are systematic, document them and report to your flag state or ITF",
            ]}
          />
          <ChallengeCard
            title="Isolation"
            description="Even on a vessel with 20 crew, you can feel completely alone. Language barriers, cultural differences, and hierarchy can make genuine connection difficult."
            strategies={[
              "Make the effort to eat meals together rather than alone in your cabin",
              "Learn a few words in your shipmates' languages — it goes a long way",
              "Organize simple social activities: movie nights, fishing off the stern, card games",
              "Remember that the person on the opposite watch may feel just as isolated as you",
            ]}
          />
          <ChallengeCard
            title="Bullying & Harassment"
            description="Bullying at sea is more common than the industry admits. The power dynamics on board — combined with isolation and nowhere to go — can make it feel inescapable. It is never acceptable."
            strategies={[
              "Document everything: dates, times, witnesses, what was said or done",
              "Report to the Master, your DPA, or your flag state — MLC protects you from retaliation",
              "Contact ISWAN SeafarerHelp for confidential advice",
              "If you witness bullying happening to someone else, speak up — your silence enables it",
            ]}
          />
          <ChallengeCard
            title="Anxiety"
            description="Worrying about safety, your contract, money problems at home, or your next assignment is normal. But when anxiety becomes constant and overwhelming, it affects everything."
            strategies={[
              "Practice simple breathing exercises: breathe in for 4, hold for 4, out for 6",
              "Focus on what you can control today, not what might happen next month",
              "Physical exercise is one of the most effective anxiety reducers — even a short walk on deck helps",
              "Talk to someone. Keeping it inside makes anxiety grow",
            ]}
          />
        </div>
      </section>

      {/* Self-Care at Sea */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Self-Care at Sea
        </h2>
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Self-care is not a luxury — it is maintenance. You maintain the
            machinery every day. Your mind needs the same attention.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TipCard
              title="Build a Routine"
              text="Structure gives your brain something to hold onto. Wake up at the same time, exercise at the same time, call home at the same time. Predictability calms the nervous system."
            />
            <TipCard
              title="Move Your Body"
              text="Even 20 minutes of exercise changes your brain chemistry. Walk on deck, use the gym if there is one, do bodyweight exercises in your cabin. Consistency matters more than intensity."
            />
            <TipCard
              title="Stay Connected"
              text="Use your ship's connectivity to maintain relationships. A short call is better than no call. Send voice messages when live calls are not possible. Let people at home know you are thinking of them."
            />
            <TipCard
              title="Write It Down"
              text="Journaling is not just for poets. Writing down your thoughts — even in bullet points — helps process difficult emotions. Keep a small notebook. Nobody needs to see it but you."
            />
            <TipCard
              title="Limit Alcohol"
              text="It is tempting to use alcohol to switch off, but it disrupts sleep, increases anxiety, and worsens low mood over time. Be honest with yourself about your consumption."
            />
            <TipCard
              title="Watch Your Sleep"
              text="Good sleep hygiene is your best defense against fatigue and poor mental health. Dark cabin, consistent schedule, no screens 30 minutes before rest."
            />
          </div>
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Further Resources
        </h2>
        <div className="space-y-3">
          <ResourceLink
            title="ISWAN — International Seafarers' Welfare and Assistance Network"
            url="https://www.seafarerswelfare.org"
            description="Comprehensive welfare resources, port welfare guides, and research on seafarer mental health."
          />
          <ResourceLink
            title="MLC 2006 — Wellness Provisions"
            url="https://www.ilo.org/global/standards/maritime-labour-convention"
            description="Your legal rights to rest hours, shore leave, recreation facilities, and welfare under the Maritime Labour Convention."
          />
          <ResourceLink
            title="WHO — Mental Health and Seafarers"
            url="https://www.who.int"
            description="World Health Organization guidance on mental health in the maritime sector. Free to download."
          />
          <ResourceLink
            title="Sailors' Society — Wellness at Sea Programme"
            url="https://www.sailors-society.org/wellness"
            description="Coaching and resources specifically designed for the unique mental health challenges of life at sea."
          />
        </div>
      </section>
    </div>
  );
}

function ChallengeCard({
  title,
  description,
  strategies,
}: {
  title: string;
  description: string;
  strategies: string[];
}) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
      <h3 className="text-slate-100 font-semibold text-sm mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-3">{description}</p>
      <ul className="space-y-1.5">
        {strategies.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="text-teal-500 mt-1 flex-shrink-0">&#8226;</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TipCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-navy-800/50 border border-navy-600 rounded-lg p-4">
      <h4 className="text-slate-200 font-semibold text-sm mb-1.5">{title}</h4>
      <p className="text-slate-400 text-xs leading-relaxed">{text}</p>
    </div>
  );
}

function ResourceLink({
  title,
  url,
  description,
}: {
  title: string;
  url: string;
  description: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-teal-500/30 transition-colors"
    >
      <h3 className="text-teal-400 font-semibold text-sm mb-1">{title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
    </a>
  );
}
