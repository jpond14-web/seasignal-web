-- Seed: Signal Articles — Guides, resources, and practical help for seafarers
-- Run this after the migration to populate the Signal Reports section

-- ============================================================
-- GUIDE ARTICLES (evergreen content — practical seafarer help)
-- ============================================================

INSERT INTO public.signal_articles (article_type, title, slug, content, status, published_at, related_regulations) VALUES

-- 1. Food & Nutrition Guide (ILO-referenced)
('guide', 'Your Right to Proper Food and Clean Drinking Water at Sea', 'food-and-water-rights-at-sea',
'## What the Law Says

Under the Maritime Labour Convention (MLC) 2006, Regulation 3.2, every seafarer has the right to:

- **Free food** provided during the entire period of engagement — no exceptions
- **Clean drinking water** of appropriate quality, available at all times
- Food that is **nutritious, varied, and of adequate quantity**
- Meals prepared and served in **hygienic conditions**
- Consideration of your **religious and cultural dietary requirements**

No company can charge you for drinking water. If the ship''s potable water system produces unsafe water, the company is required to provide bottled water or an alternative safe supply. This is not optional.

## The ILO Guidelines on Ships'' Cooks

The ILO''s 2014 Guidelines on the Training of Ships'' Cooks establishes three key standards:

1. Food and drinking water must be of suitable quantity, nutritional value, quality, and variety — accounting for crew size, religious/cultural practices, and voyage duration
2. The catering department must be properly equipped to provide adequate, varied, and nutritious meals in hygienic conditions
3. All catering staff must be properly trained and qualified

Ships'' cooks must hold a valid certificate. On vessels with a prescribed crew of more than 10, a qualified cook must be carried. The cook must be trained in food safety, nutrition, and personal hygiene.

## What "Adequate Food" Actually Means

The MLC doesn''t just say "provide food" — it sets standards:

- **Three meals per day** as a minimum
- **Variety** across the voyage — not the same meal repeated
- **Fresh provisions** should be supplied at reasonable intervals, especially fruits and vegetables
- **Special dietary needs** (medical, religious, vegetarian) must be accommodated
- Food storage and preparation areas must meet **hygiene standards** and be inspected regularly

## Common Violations to Watch For

These are the issues seafarers report most frequently:

- **Charging for bottled water** when ship''s water is unsafe — this is illegal under MLC
- **Inadequate food quality** — expired ingredients, poor variety, insufficient portions
- **No qualified cook** on board — particularly common on smaller vessels
- **Dirty galley conditions** — cockroaches, poor refrigeration, unsanitary preparation areas
- **Ignoring dietary requirements** — no halal/vegetarian options despite crew composition

## What You Can Do

1. **Document everything** — take photos of food quality, galley conditions, and water colour/taste
2. **Check the cook''s certificate** — they must have a valid ship''s cook certificate
3. **Request inspection records** — the master is required to conduct regular food/water inspections
4. **File a complaint with the flag state** — under MLC, you have the right to complain without retaliation
5. **Report on SeaSignal** — your report helps other seafarers and builds evidence of patterns

## Key Regulations

- **MLC 2006, Regulation 3.2** — Food and Catering
- **MLC 2006, Standard A3.2** — detailed requirements
- **ILO Convention No. 68** — Food and Catering (Ships'' Crews)
- **ILO Convention No. 69** — Certification of Ships'' Cooks
- **ISM Code** — requires companies to establish food safety procedures

## Resources

- ILO Guidelines on Training of Ships'' Cooks (2014)
- Seafarers'' Rights International: seafarersrights.org
- ITF Seafarers'' Support: itfseafarers.org
- Your flag state maritime authority',
'published', now() - interval '2 days',
'["MLC 2006 Regulation 3.2", "MLC 2006 Standard A3.2", "ILO Convention No. 68", "ILO Convention No. 69", "ILO Guidelines on Training of Ships Cooks 2014"]'),

-- 2. Wage Theft & Pay Rights
('guide', 'Wage Theft at Sea: Know Your Pay Rights Under MLC 2006', 'wage-theft-pay-rights-mlc',
'## Your Right to Be Paid

Under the Maritime Labour Convention (MLC) 2006, Regulation 2.2:

- You must be **paid in full** for your work, **at least monthly**
- Payment must be made in a currency you agreed to in your contract
- You must receive a **monthly pay statement** showing: gross pay, deductions, exchange rates used, and net amount
- You have the right to **transmit all or part of your earnings** to your family at no unreasonable cost

## What Counts as Wage Theft

Wage theft isn''t always obvious. It includes:

- **Late payment** — even one week late violates MLC
- **Underpayment** — paying less than the contracted amount
- **Unauthorized deductions** — taking money for "administration fees," equipment, or training you didn''t agree to
- **Currency manipulation** — using unfavourable exchange rates to reduce your pay
- **Unpaid overtime** — overtime worked but not recorded or compensated
- **Withholding final wages** — not paying what''s owed when you sign off
- **"Savings" schemes** — forcing you to leave money with the company until contract end

## The ILO Minimum Wage

The ILO Joint Maritime Commission sets the minimum monthly basic pay for able seafarers. As of 2024, this is **$658 USD per month** (basic pay only — overtime, leave pay, and other allowances are additional). Your actual pay should be agreed in your Seafarer Employment Agreement (SEA) and may be higher.

## Red Flags in Your Contract

Before signing, check for:

- **Unclear overtime rates** — how is overtime calculated and at what rate?
- **Vague deduction clauses** — does the contract allow the company to deduct unspecified amounts?
- **Allotment restrictions** — can you freely send money home?
- **"All-inclusive" salary** — does it genuinely include overtime, or is it used to underpay?
- **Manning agency fees** — in many jurisdictions, charging seafarers recruitment fees is prohibited

## What You Can Do

1. **Keep copies of everything** — your SEA, pay slips, overtime records, any correspondence about pay
2. **Track your own hours** — maintain a personal overtime log separate from the official one
3. **Compare with your SEA** — verify each pay statement against your contract terms
4. **Contact ITF** — the International Transport Workers'' Federation can intervene on your behalf
5. **File a flag state complaint** — under MLC, you have protection against retaliation
6. **Report on SeaSignal** — help build the picture of which companies consistently fail to pay

## Emergency: Wages Owed After Abandonment

If your ship is abandoned or the company goes bankrupt:

- **MLC Standard A2.5.2** requires financial security (insurance) for abandoned seafarers
- You are entitled to **outstanding wages, repatriation costs, and essential needs** (food, accommodation, medical care)
- Contact the **ITF Inspectorate** immediately — they have a 24/7 emergency number
- Contact your **flag state** and **port state** authorities

## Key Regulations

- **MLC 2006, Regulation 2.2** — Wages
- **MLC 2006, Standard A2.2** — detailed wage requirements
- **MLC 2006, Regulation 2.5** — Repatriation
- **MLC 2006, Standard A2.5.2** — Financial security for abandonment
- **ILO Minimum Wage** — Joint Maritime Commission recommendations',
'published', now() - interval '3 days',
'["MLC 2006 Regulation 2.2", "MLC 2006 Standard A2.2", "MLC 2006 Regulation 2.5", "MLC 2006 Standard A2.5.2", "ILO Joint Maritime Commission Minimum Wage"]'),

-- 3. Mental Health at Sea
('guide', 'Mental Health at Sea: Resources, Warning Signs, and Where to Get Help', 'mental-health-at-sea',
'## The Reality

Seafaring is one of the most isolating professions on earth. Months away from family, limited communication, confined living spaces, long hours, and the pressure of safety-critical work — it takes a toll that the industry has only recently started acknowledging.

Studies show that seafarers experience significantly higher rates of depression, anxiety, and suicidal ideation compared to land-based workers. The Yale-Singapore study found that **25% of seafarers reported symptoms of depression**, and suicide remains one of the leading causes of death at sea.

You are not weak for struggling. You are human.

## Warning Signs — In Yourself

- Persistent feelings of hopelessness or emptiness
- Withdrawing from crewmates and social activities
- Difficulty sleeping, or sleeping too much
- Losing interest in things you normally enjoy
- Increased alcohol use
- Irritability or anger that feels disproportionate
- Difficulty concentrating on safety-critical tasks
- Thinking about self-harm or suicide

## Warning Signs — In Your Crewmates

- Sudden withdrawal from the group
- Giving away personal belongings
- Talking about being "a burden" or "better off gone"
- Dramatic mood changes — especially sudden calm after a period of distress
- Reckless behaviour or ignoring safety procedures
- Increased alcohol or substance use

**If you notice these signs, don''t wait. Ask directly: "Are you thinking about hurting yourself?" Asking does not plant the idea — it opens the door.**

## 24/7 Help Available Right Now

### SeafarerHelp (ISWAN)
- **Free, confidential, multilingual** helpline for any seafarer
- Available 24/7, 365 days a year
- Phone, Email, WhatsApp, Live Chat, Viber, SMS
- Website: seafarerhelp.org
- WhatsApp: +44 7909 890 365

### SAILOR (Seafarer Assistance and International Liaison Organisation)
- Crisis support and repatriation assistance

### The Mission to Seafarers
- Welfare centres in ports worldwide
- Chaplains available for confidential conversation
- MtS Wellness at Sea app — free download

### VIKAND Maritime Health
- 24/7 telemedicine including mental health support
- Maritime psychologists available by video call

## What Companies Are Required to Provide

Under MLC 2006:
- **Regulation 4.3** requires health and safety protection, which includes mental health
- **Regulation 4.4** requires access to shore-based welfare facilities
- Companies must provide **reasonable communication access** (internet/phone) for contact with family

## What You Can Do For Yourself

- **Maintain a routine** — exercise, sleep schedule, meal times
- **Stay connected** — call home regularly, even when you don''t feel like it
- **Talk to someone** — a trusted crewmate, the master, a chaplain at port
- **Limit alcohol** — it worsens depression and anxiety
- **Use the resources** — SeafarerHelp is free, confidential, and available in your language
- **Report unsafe conditions** — sometimes the best thing for your mental health is taking action on the thing causing distress

## For Officers and Masters

You have a duty of care. Practically, that means:
- **Check in regularly** with crew individually, not just in group settings
- **Create space for conversation** — meals together, open-door policy
- **Recognise risk factors** — first voyage, family problems, long contracts, isolation
- **Know the referral pathway** — how to contact shoreside medical support
- **Don''t minimize** — "toughen up" costs lives

## Key Regulations

- **MLC 2006, Regulation 4.3** — Health and Safety Protection
- **MLC 2006, Regulation 4.4** — Access to Shore-based Welfare
- **IMO Guidelines on Mental Health** (2021) — Handling a Mental Health Crisis at Sea',
'published', now() - interval '1 day',
'["MLC 2006 Regulation 4.3", "MLC 2006 Regulation 4.4", "IMO Guidelines on Mental Health 2021"]'),

-- 4. Document Retention
('guide', 'Your Passport Is Being Held: What to Do About Document Retention', 'document-retention-passport-held',
'## The Law Is Clear

Holding a seafarer''s passport or personal documents against their will is **illegal** under international law.

- **MLC 2006, Standard A2.1, paragraph 1(b)**: Seafarers must retain possession of their identity documents. No document may be held by the shipowner except with the seafarer''s written consent, and even then, a certified copy must be provided.
- **ILO Convention No. 185** — Seafarers'' Identity Documents: these belong to the seafarer, not the employer
- In many jurisdictions, holding someone''s passport constitutes an element of **forced labour** or **trafficking**

## Why Companies Do It

Companies and manning agencies that retain documents usually claim it''s for "safekeeping" or "administrative purposes." The real reasons are often:

- **Preventing you from leaving** — if you can''t prove your identity, you can''t sign off
- **Control** — documents give the company leverage over you
- **Avoiding repatriation costs** — if you can''t leave, they don''t have to fly you home

This is a serious violation regardless of the stated reason.

## What You Should Do

### Before You Board
1. **Never hand over original documents** without getting a signed receipt
2. **Keep certified copies** of all documents stored separately — digitally if possible
3. **Know your rights** before departure — save this guide offline

### If Your Documents Are Being Held
1. **Request return in writing** — email or written note to the master or company
2. **Document the refusal** — note dates, who refused, their stated reason
3. **Contact ITF** — they have inspectors in most major ports who can intervene immediately
4. **Contact your flag state** — file a formal complaint under MLC
5. **Contact port state control** — in the next port, port state inspectors can order documents returned
6. **Report on SeaSignal** — this is one of the most critical issues to expose

### Emergency Contacts
- **ITF Inspectorate**: itfseafarers.org/en/your-rights/itf-inspectors
- **ILO Helpdesk**: multilingual support for seafarer rights issues
- **Local port welfare committees** — available in most major ports
- **Your embassy/consulate** — they can issue emergency travel documents

## Key Regulations

- **MLC 2006, Standard A2.1, paragraph 1(b)** — Seafarers retain possession of documents
- **ILO Convention No. 185** — Seafarers'' Identity Documents
- **ILO Forced Labour Convention** — document retention may constitute forced labour indicators
- **UN Protocol to Prevent Trafficking** — document confiscation is a trafficking indicator',
'published', now() - interval '4 days',
'["MLC 2006 Standard A2.1", "ILO Convention No. 185", "ILO Forced Labour Convention", "UN Protocol to Prevent Trafficking"]'),

-- 5. Overtime and Rest Hours
('guide', 'Forced Overtime: Your Rights to Rest Hours and Fair Compensation', 'forced-overtime-rest-hours-rights',
'## Maximum Hours, Minimum Rest

The Maritime Labour Convention sets hard limits on working hours at sea:

### Option A — Maximum Hours
- **14 hours** in any 24-hour period
- **72 hours** in any 7-day period

### Option B — Minimum Rest
- **10 hours** of rest in any 24-hour period
- **77 hours** of rest in any 7-day period
- Rest hours can be split into **no more than two periods**, one of which must be at least **6 hours** continuous
- The interval between rest periods must **not exceed 14 hours**

Most flag states use Option B (minimum rest). Your Seafarer Employment Agreement should specify which standard applies.

## What "Forced Overtime" Looks Like

- Being pressured to work through your rest period
- Rest hours being falsified on the official record
- Being told overtime is "included in your salary" when your contract doesn''t state this
- Retaliation (poor evaluation, no re-employment) for declining excessive overtime
- Emergency drills or "inspections" consistently scheduled during rest hours
- Working hours that regularly exceed the legal maximum

## The Rest Hours Record

Every ship must maintain a **rest hours record** for each seafarer. You must:
- Receive a copy of your records
- Be able to review and endorse them
- Report any inaccuracies

**Critical: If you are being asked to sign rest hours that don''t reflect reality, you are being asked to participate in falsification.** This is a violation that port state control specifically looks for.

## What You Can Do

1. **Keep your own log** — a personal notebook or phone record of actual hours worked and rest taken
2. **Compare with official records** — flag discrepancies in writing
3. **Know the exceptions** — genuine emergencies (safety of ship, rescue at sea) allow temporary deviation, but the master must record these and you must receive compensatory rest
4. **Report to port state control** — PSC officers in many countries specifically audit rest hour compliance
5. **Contact ITF** — they can file complaints on your behalf
6. **Report on SeaSignal** — pattern data showing consistent rest hour violations across a fleet is powerful evidence

## Key Regulations

- **MLC 2006, Regulation 2.3** — Hours of Work and Hours of Rest
- **MLC 2006, Standard A2.3** — detailed rest hour requirements
- **STCW Convention** — watchkeeping rest requirements
- **ISM Code** — requires companies to establish rest hour procedures',
'published', now() - interval '5 days',
'["MLC 2006 Regulation 2.3", "MLC 2006 Standard A2.3", "STCW Convention", "ISM Code"]'),

-- 6. How to File a Complaint Without Retaliation
('guide', 'Filing a Complaint as a Seafarer: Your Rights and Protections Against Retaliation', 'filing-complaints-retaliation-protection',
'## You Have the Right to Complain

The MLC 2006 establishes a **three-tier complaint system** designed to protect you:

### Tier 1: On-board Complaint
- Every ship must have an **on-board complaint procedure**
- You can raise issues with your head of department, the master, or a designated complaints officer
- The procedure must be posted in an accessible location on board
- Complaints must be handled promptly and fairly
- **You must not be penalized** for filing a complaint

### Tier 2: Shore-based (Flag State)
- If the on-board procedure fails, you can complain to your **flag state** maritime authority
- Contact details must be available on board
- The flag state is obligated to investigate

### Tier 3: Port State Control
- In any port, you can file a complaint with the **port state control** authority
- PSC inspectors can board the vessel and investigate
- They can **detain the ship** if serious violations are found
- This is often the most effective route for immediate action

## Protection Against Retaliation

Under MLC 2006, Standard A5.2.2:
- **No seafarer shall be victimized** for filing a complaint
- This protection covers: termination, blacklisting, poor evaluations, transfer to worse duties, or any other disadvantage
- Retaliation itself is a separate violation

## Practical Tips

- **Document before you complain** — gather evidence first (photos, records, witnesses)
- **Put complaints in writing** — verbal complaints are harder to prove
- **Keep copies** — of everything you submit and any responses
- **Know your contacts** — save ITF, flag state, and PSC contact details before you need them
- **Talk to your union representative** if you have one
- **Use SeaSignal** — even if you don''t file an official complaint, reporting on SeaSignal builds evidence that helps the entire community

## When to Skip to Port State Control

Go directly to PSC (Tier 3) when:
- The issue involves **immediate safety risk** (unseaworthy vessel, fire safety deficiencies)
- Your **documents are being held**
- You have **not been paid** for extended periods
- The on-board complaint procedure **doesn''t exist** or is a sham
- You fear **retaliation** from the master or company

PSC inspectors have the authority to act immediately. They don''t need the company''s permission.

## Key Regulations

- **MLC 2006, Regulation 5.1.5** — On-board complaint procedures
- **MLC 2006, Standard A5.2.2** — Shore-based seafarer complaint-handling
- **MLC 2006, Regulation 5.2.1** — Port State inspections
- **Paris MoU / Tokyo MoU** — regional port state control agreements',
'published', now() - interval '6 days',
'["MLC 2006 Regulation 5.1.5", "MLC 2006 Standard A5.2.2", "MLC 2006 Regulation 5.2.1"]'),

-- 7. Unsafe Working Conditions
('guide', 'Unsafe Conditions On Board: What Counts, What to Document, and Who to Contact', 'unsafe-conditions-documentation-guide',
'## What the MLC Requires

Under MLC 2006, Regulation 4.3:
- Shipowners must provide a **safe and hygienic working environment**
- A **risk assessment** must be conducted for all work activities
- Seafarers must be provided with appropriate **personal protective equipment (PPE)** at no cost
- There must be an **occupational health and safety committee** on ships with 5+ seafarers
- Seafarers must receive **safety training** appropriate to their duties
- **Accident and injury reporting** systems must be in place

## Common Unsafe Conditions

Based on port state control detention data and seafarer reports:

- **Deficient fire safety** — expired extinguishers, blocked escape routes, non-functional fire detection
- **Inadequate lifesaving equipment** — lifeboats not maintained, EPIRB expired, liferafts not serviced
- **Structural defects** — corroded decks, loose handrails, water ingress
- **Electrical hazards** — exposed wiring, overloaded circuits, no lockout/tagout procedures
- **Enclosed space risks** — no gas testing before entry, no rescue equipment, inadequate procedures
- **Lack of PPE** — no safety helmets, gloves, harnesses, or hearing protection provided
- **Chemical hazards** — no safety data sheets, improper storage, no ventilation

## How to Document Safely

1. **Photographs** — with metadata (date/time/location automatically embedded)
2. **Written log** — date, time, location on ship, description, who was present
3. **Official records** — request copies of safety inspection reports, drill records, maintenance logs
4. **Witness statements** — if crewmates are willing, have them write brief statements
5. **Your own injuries** — photograph injuries immediately and request medical log entries

**Store documentation off the ship** — email photos to yourself, upload to cloud storage, or use SeaSignal''s evidence upload.

## Who to Contact

### Immediate Danger
- **Refuse unsafe work** — you have the right to stop work if there is immediate danger to life
- Inform the **master** and **safety officer** immediately
- Document the refusal and the reason in writing

### Report Externally
- **Port State Control** — in any port (most effective for immediate action)
- **Flag State** maritime authority
- **ITF Inspectors** — itfseafarers.org
- **Class Society** — the classification society that surveys the vessel
- **P&I Club** — the ship''s insurance provider

## Key Regulations

- **MLC 2006, Regulation 4.3** — Health and Safety Protection and Accident Prevention
- **SOLAS Convention** — Safety of Life at Sea
- **ISM Code** — International Safety Management
- **MARPOL** — environmental protection requirements',
'published', now() - interval '7 days',
'["MLC 2006 Regulation 4.3", "SOLAS Convention", "ISM Code", "MARPOL"]'),

-- 8. Manning Agency Red Flags
('guide', 'Manning Agency Red Flags: How to Spot a Bad Agency Before You Sign', 'manning-agency-red-flags',
'## Legitimate vs. Predatory Agencies

A good manning agency connects you with reputable companies, handles your paperwork professionally, and doesn''t exploit you. A bad one sees you as a revenue source.

## Red Flags to Watch For

### Financial Red Flags
- **Charging recruitment fees** — in many countries (Philippines, India, and others), charging seafarers for placement is illegal. The MLC states recruitment costs should be borne by the shipowner, not the seafarer
- **"Processing fees"** that keep increasing — legitimate administrative costs are minimal and transparent
- **Requiring a deposit** — no legitimate agency requires you to pay a deposit
- **Salary deductions for agency "services"** during your contract
- **Cash-only transactions** — no receipts, no paper trail

### Contract Red Flags
- **Refusing to show you the contract** before departure
- **Contracts in a language you don''t understand** (you have the right to a contract in a language you can read)
- **Blank spaces** in the contract — never sign a contract with blanks
- **Different terms** discussed verbally versus what''s written
- **No mention of MLC compliance** — the contract should reference MLC standards

### Communication Red Flags
- **Hard to reach** after you''ve signed — they disappear once you''re on board
- **Pressuring you to decide immediately** — "this position won''t be available tomorrow"
- **No physical office** — or an office that looks temporary
- **No licence or registration number** — legitimate agencies are registered with maritime authorities
- **Bad or no online presence** — no website, no reviews, no verifiable history

## Before You Sign

1. **Verify the agency''s licence** with your national maritime authority
2. **Check reviews on SeaSignal** — other seafarers'' experiences are the best indicator
3. **Read the entire contract** — every page, every clause. Ask questions about anything unclear
4. **Get everything in writing** — verbal promises mean nothing
5. **Keep copies** of all documents you sign
6. **Ask about the company** you''ll be deployed to — research them independently
7. **Talk to other seafarers** who have used this agency

## Your Rights Under MLC

- **Regulation 1.4** — Recruitment and placement services must not charge seafarers
- **Standard A1.4** — detailed requirements for manning agencies
- **Regulation 2.1** — you must have a written Seafarer Employment Agreement

## Key Regulations

- **MLC 2006, Regulation 1.4** — Recruitment and Placement
- **MLC 2006, Standard A1.4** — Recruitment and Placement requirements
- **MLC 2006, Regulation 2.1** — Seafarer Employment Agreements',
'published', now() - interval '8 days',
'["MLC 2006 Regulation 1.4", "MLC 2006 Standard A1.4", "MLC 2006 Regulation 2.1"]');

-- ============================================================
-- Quick reference: Emergency contacts article
-- ============================================================

INSERT INTO public.signal_articles (article_type, title, slug, content, status, published_at, related_regulations) VALUES
('guide', 'Emergency Contacts Every Seafarer Should Save', 'emergency-contacts-seafarers',
'## Save These Numbers Before You Need Them

### 24/7 Helplines

**SeafarerHelp (ISWAN)**
- Phone: +44 20 7323 2737
- WhatsApp: +44 7909 890 365
- Email: help@seafarerhelp.org
- Live Chat: seafarerhelp.org
- **Free, confidential, multilingual** — available in English, Filipino, Hindi, Mandarin, Russian, Spanish, and more

**ITF Seafarers**
- Website: itfseafarers.org
- Find your nearest ITF inspector: itfseafarers.org/en/your-rights/itf-inspectors
- For wage theft, document retention, or abandonment

**The Mission to Seafarers**
- Welfare centres in 200+ ports worldwide
- Website: missiontoseafarers.org

**Sailors'' Society**
- 24/7 Crisis Response: wellness@sailors-society.org
- Wellness at Sea programme

### Mental Health Crisis

**ISWAN SeafarerHelp** — same number as above, trained in mental health crisis support
**Crisis Text Line** — text HOME to 741741 (US) or 85258 (UK)
**Befrienders Worldwide** — befrienders.org/find-support (directory of helplines in 30+ countries)

### Legal Support

**Seafarers'' Rights International** — seafarersrights.org
**ITF Legal Department** — for contract disputes, wage claims, and rights violations
**Your national seafarers'' union** — contact details should be in your SEA

### Port State Control

If you''re in port and need to report unsafe conditions, unpaid wages, or document retention:
- Ask the port agent for the **PSC authority** contact
- Or search "[country name] port state control maritime authority" online
- You can also ask the **port chaplain** or **seafarers'' centre** to help you contact PSC

### Digital Resources to Download (For Offline Access)

- MLC 2006 full text (ILO website)
- ITF Model SEA (Seafarer Employment Agreement)
- SeaSignal emergency contacts (this page — save it offline)
- Your contract and all personal documents (keep digital copies)',
'published', now() - interval '9 days',
'[]');
