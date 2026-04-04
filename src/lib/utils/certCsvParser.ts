export type ParsedCertRow = {
  cert_type: string;
  title: string;
  cert_number: string;
  issuing_authority: string;
  flag_state: string;
  issue_date: string;
  expiry_date: string;
};

const VALID_CERT_TYPES = new Set([
  "coc",
  "stcw",
  "medical",
  "visa",
  "endorsement",
  "short_course",
  "flag_state",
  "gmdss",
  "other",
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00");
  return !isNaN(d.getTime());
}

export function parseCertCsv(text: string): {
  valid: ParsedCertRow[];
  errors: { row: number; message: string }[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { valid: [], errors: [{ row: 0, message: "File is empty" }] };
  }

  // Check if first line is a header row
  const firstLower = lines[0].toLowerCase();
  const startIdx =
    firstLower.startsWith("cert_type") || firstLower.startsWith('"cert_type"')
      ? 1
      : 0;

  const valid: ParsedCertRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const rowNum = i + 1; // 1-based for user display
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

    if (cols.length < 2) {
      errors.push({ row: rowNum, message: `Expected at least 2 columns (cert_type, title), got ${cols.length}` });
      continue;
    }

    const [cert_type, title, cert_number, issuing_authority, flag_state, issue_date, expiry_date] = cols;

    // Validate cert_type (required)
    if (!cert_type) {
      errors.push({ row: rowNum, message: "cert_type is required" });
      continue;
    }
    if (!VALID_CERT_TYPES.has(cert_type.toLowerCase())) {
      errors.push({
        row: rowNum,
        message: `Invalid cert_type "${cert_type}". Must be one of: ${[...VALID_CERT_TYPES].join(", ")}`,
      });
      continue;
    }

    // Validate title (required)
    if (!title || title.trim().length === 0) {
      errors.push({ row: rowNum, message: "title is required" });
      continue;
    }

    // Validate dates if provided
    if (issue_date && issue_date.length > 0 && !isValidDate(issue_date)) {
      errors.push({ row: rowNum, message: `Invalid issue_date "${issue_date}". Use YYYY-MM-DD format` });
      continue;
    }
    if (expiry_date && expiry_date.length > 0 && !isValidDate(expiry_date)) {
      errors.push({ row: rowNum, message: `Invalid expiry_date "${expiry_date}". Use YYYY-MM-DD format` });
      continue;
    }

    valid.push({
      cert_type: cert_type.toLowerCase(),
      title: title.trim(),
      cert_number: cert_number?.trim() || "",
      issuing_authority: issuing_authority?.trim() || "",
      flag_state: flag_state?.trim() || "",
      issue_date: issue_date?.trim() || "",
      expiry_date: expiry_date?.trim() || "",
    });
  }

  return { valid, errors };
}
