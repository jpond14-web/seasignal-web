import type { TranslationKeys } from "./en";

const fil: TranslationKeys = {
  nav: {
    home: "Home",
    messages: "Mga Mensahe",
    community: "Komunidad",
    intel: "Impormasyon",
    career: "Karera Ko",
    welfare: "Kapakanan",
  },

  flare_category: {
    unsafe_water: "Hindi Ligtas na Inuming Tubig",
    wage_theft: "Pagnanakaw ng Sahod / Hindi Binayaran",
    forced_overtime: "Sapilitang Overtime",
    document_retention: "Paghawak ng Dokumento (Pasaporte)",
    unsafe_conditions: "Hindi Ligtas na Kondisyon sa Trabaho",
    harassment_abuse: "Panliligalig / Pang-aabuso",
    environmental_violation: "Paglabag sa Kapaligiran",
    food_safety: "Problema sa Kaligtasan ng Pagkain",
    medical_neglect: "Pagpapabaya sa Medikal",
    other: "Iba Pa",
  },

  flare_severity: {
    concern: "Alalahanin",
    concern_desc: "May hindi tama at dapat bantayan",
    violation: "Paglabag",
    violation_desc: "Malinaw na paglabag sa regulasyon o karapatan ng seafarer",
    critical: "Kritikal",
    critical_desc: "Agarang panganib sa kalusugan, kaligtasan, o kapakanan",
  },

  flare_form: {
    title: "Mag-ulat ng Isyu",
    subtitle:
      "Tulungan ang maritime community sa pag-uulat ng mga sistematikong isyu na iyong nasaksihan. Anonymous ang iyong ulat bilang default at inilalabas tuwing Linggo.",
    company: "Kompanya",
    company_placeholder: "Pumili ng kompanya",
    vessel: "Barko",
    vessel_optional: "opsyonal",
    vessel_placeholder: "Pumili ng barko",
    category_label: "Ano ang isyu?",
    category_placeholder: "Pumili ng uri ng isyu",
    severity_label: "Gaano kalala?",
    short_title: "Maikling pamagat",
    title_placeholder: "hal. Hindi ligtas inumin ang tubig sa barko",
    details: "Detalye",
    details_guidance:
      'Ilarawan ang iyong personal na nasaksihan. Gumamit ng tiyak na mga petsa, lokasyon, at detalye. Manatili sa mga katotohanan — "Nakita ko..." o "Naranasan ng crew...".',
    details_placeholder: "Ilarawan ang iyong nasaksihan...",
    from: "Mula",
    to: "Hanggang",
    evidence: "Ebidensya",
    evidence_help: "Mga larawan, dokumento — max 10MB bawat isa",
    upload_files: "Mag-upload ng files",
    uploading: "Nag-a-upload...",
    remove: "Alisin",
    anonymous: "Mag-submit nang anonymous",
    batch_note:
      "Ang mga ulat ay inilalabas tuwing Linggo para protektahan ang iyong pagkakakilanlan.",
    how_it_works:
      "Ang iyong ulat ay kasama ng iba pa para makabuo ng larawan ng mga sistematikong isyu. Kapag sapat na ang nag-ulat ng parehong problema, mag-iimbestiga ang SeaSignal, maglalathala ng mga natuklasan, at kokontakin ang kompanya para humingi ng resolusyon. Hindi ibabahagi ang iyong pagkakakilanlan sa sinuman sa labas ng SeaSignal.",
    how_it_works_label: "Paano ito gumagana:",
    submit: "Isumite ang Ulat",
    submitting: "Nagsusumite...",
    required: "kinakailangan",
    error_company: "Pumili ng kompanya",
    error_category: "Pumili ng kategorya ng isyu",
    error_title: "Magbigay ng maikling pamagat",
    error_auth: "Hindi naka-authenticate",
    error_profile: "Hindi nahanap ang profile",
  },

  flare_list: {
    title: "Mga Signal Flare",
    subtitle:
      "Mga isyu na iniulat ng mga seafarer sa buong industriya. Lumalabas ang mga pattern kapag maraming crew ang nag-uulat ng parehong problema.",
    report_issue: "Mag-ulat ng Isyu",
    disclaimer:
      "Ang mga ulat na ito ay sumasalamin sa mga obserbasyon ng indibidwal na seafarer at hindi pa independyenteng na-verify. Kapag sapat na ang mga ulat na nagtuturo sa isang pattern, mag-iimbestiga ang SeaSignal at kokontakin ang kompanya.",
    no_flares: "Wala pang nailathala na signal flare.",
    be_first: "Maging una sa pag-uulat ng isyu na iyong nasaksihan.",
    corroborated: "kinumpirma",
    seafarer: "seafarer",
    seafarers: "mga seafarer",
    no_corroborations: "Wala pang kumpirmasyon",
    witnessed_too: "Nasaksihan ko rin ito",
  },

  issue_stage: {
    monitoring: "Binabantayan",
    emerging: "Lumalabas na Pattern",
    investigating: "Iniimbestigahan",
    company_contacted: "Na-kontak ang Kompanya",
    published: "Nailathala",
    resolved: "Nalutas",
    unresolved: "Hindi Nalutas",
  },

  common: {
    reports: "mga ulat",
    report: "ulat",
    corroborations: "mga kumpirmasyon",
    corroboration: "kumpirmasyon",
    vessels: "mga barko",
    vessel: "barko",
    since: "Mula noong",
    recurring: "Paulit-ulit",
    resolved_on: "Nalutas",
    contacted_on: "Na-kontak",
    no_response: "walang resolusyon",
    awaiting_response: "naghihintay ng sagot",
    company_contacted_on: "Na-kontak ang kompanya",
    required_field: "*",
  },

  language: {
    label: "Wika",
    en: "English",
    fil: "Filipino",
    hi: "Hindi",
    zh: "Chinese (Simplified)",
    id: "Bahasa Indonesia",
    ru: "Russian",
    uk: "Ukrainian",
    es: "Spanish",
    my: "Burmese",
  },
} as const;

export default fil;
