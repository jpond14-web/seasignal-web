const en = {
  // Navigation
  nav: {
    home: "Home",
    messages: "Messages",
    community: "Community",
    intel: "Intel",
    career: "My Career",
    welfare: "Welfare",
  },

  // Signal Flare categories
  flare_category: {
    unsafe_water: "Unsafe Drinking Water",
    wage_theft: "Wage Theft / Unpaid Wages",
    forced_overtime: "Forced Overtime",
    document_retention: "Document Retention (Passports Held)",
    unsafe_conditions: "Unsafe Working Conditions",
    harassment_abuse: "Harassment / Abuse",
    environmental_violation: "Environmental Violation",
    food_safety: "Food Safety Issues",
    medical_neglect: "Medical Neglect",
    other: "Other",
  },

  // Signal Flare severity
  flare_severity: {
    concern: "Concern",
    concern_desc: "Something isn't right and should be on the radar",
    violation: "Violation",
    violation_desc: "A clear breach of regulations or seafarer rights",
    critical: "Critical",
    critical_desc: "Immediate danger to health, safety, or wellbeing",
  },

  // Signal Flare form
  flare_form: {
    title: "Report an Issue",
    subtitle:
      "Help the maritime community by reporting systemic issues you've witnessed. Your report is anonymous by default and batch-released weekly.",
    company: "Company",
    company_placeholder: "Select company",
    vessel: "Vessel",
    vessel_optional: "optional",
    vessel_placeholder: "Select vessel",
    category_label: "What's the issue?",
    category_placeholder: "Select issue type",
    severity_label: "How serious?",
    short_title: "Short title",
    title_placeholder: "e.g. Tap water unsafe to drink on board",
    details: "Details",
    details_guidance:
      "Describe what you personally witnessed. Use specific dates, locations, and details. Stick to facts — \"I saw...\" or \"The crew experienced...\" rather than accusations.",
    details_placeholder: "Describe what you witnessed...",
    from: "From",
    to: "To",
    evidence: "Evidence",
    evidence_help: "Photos, documents — max 10MB each",
    upload_files: "Upload files",
    uploading: "Uploading...",
    remove: "Remove",
    anonymous: "Submit anonymously",
    batch_note: "Reports are batch-released every Sunday to protect your identity.",
    how_it_works:
      "Your report joins others to build a picture of systemic issues. When enough seafarers report the same problem, SeaSignal investigates, publishes findings, and contacts the company to seek resolution. Your identity is never shared with anyone outside SeaSignal.",
    how_it_works_label: "How this works:",
    submit: "Submit Report",
    submitting: "Submitting...",
    required: "required",
    error_company: "Please select a company",
    error_category: "Please select an issue category",
    error_title: "Please provide a short title",
    error_auth: "Not authenticated",
    error_profile: "Profile not found",
  },

  // Signal Flare listing
  flare_list: {
    title: "Signal Flares",
    subtitle:
      "Seafarer-reported issues across the industry. Patterns emerge when multiple crew report the same problem.",
    report_issue: "Report an Issue",
    disclaimer:
      "These reports reflect individual seafarer observations and have not been independently verified. When enough reports point to a pattern, SeaSignal investigates and contacts the company.",
    no_flares: "No signal flares published yet.",
    be_first: "Be the first to report an issue you've witnessed.",
    corroborated: "corroborated",
    seafarer: "seafarer",
    seafarers: "seafarers",
    no_corroborations: "No corroborations yet",
    witnessed_too: "I witnessed this too",
  },

  // Issue stages
  issue_stage: {
    monitoring: "Monitoring",
    emerging: "Emerging Pattern",
    investigating: "Under Investigation",
    company_contacted: "Company Contacted",
    published: "Published",
    resolved: "Resolved",
    unresolved: "Unresolved",
  },

  // Common
  common: {
    reports: "reports",
    report: "report",
    corroborations: "corroborations",
    corroboration: "corroboration",
    vessels: "vessels",
    vessel: "vessel",
    since: "Since",
    recurring: "Recurring",
    resolved_on: "Resolved",
    contacted_on: "Contacted",
    no_response: "no resolution",
    awaiting_response: "awaiting response",
    company_contacted_on: "Company contacted",
    required_field: "*",
  },

  // Language selector
  language: {
    label: "Language",
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

// Widen literal string types so translated files can use different strings
type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]>;
};

export type TranslationKeys = DeepStringRecord<typeof en>;
export default en as TranslationKeys;
