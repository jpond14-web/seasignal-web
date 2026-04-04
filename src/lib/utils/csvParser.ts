export type ParsedRow = {
  vessel_type: string;
  rank_held: string;
  days: number;
  start_date: string;
  end_date: string;
  notes: string;
};

const VALID_VESSEL_TYPES = new Set([
  "tanker",
  "bulk_carrier",
  "container",
  "general_cargo",
  "offshore",
  "passenger",
  "roro",
  "lng",
  "lpg",
  "chemical",
  "reefer",
  "tug",
  "fishing",
  "other",
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00");
  return !isNaN(d.getTime());
}

export function parseSeaTimeCsv(text: string): {
  valid: ParsedRow[];
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
    firstLower.startsWith("vessel_type") || firstLower.startsWith("\"vessel_type\"")
      ? 1
      : 0;

  const valid: ParsedRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const rowNum = i + 1; // 1-based for user display
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

    if (cols.length < 5) {
      errors.push({ row: rowNum, message: `Expected at least 5 columns, got ${cols.length}` });
      continue;
    }

    const [vessel_type, rank_held, daysStr, start_date, end_date] = cols;
    const notes = cols.slice(5).join(",").trim();

    // Validate vessel type
    if (!VALID_VESSEL_TYPES.has(vessel_type.toLowerCase())) {
      errors.push({
        row: rowNum,
        message: `Invalid vessel type "${vessel_type}". Must be one of: ${[...VALID_VESSEL_TYPES].join(", ")}`,
      });
      continue;
    }

    // Validate days
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days <= 0 || String(days) !== daysStr.trim()) {
      errors.push({ row: rowNum, message: `Days must be a positive integer, got "${daysStr}"` });
      continue;
    }

    // Validate dates
    if (!isValidDate(start_date)) {
      errors.push({ row: rowNum, message: `Invalid start_date "${start_date}". Use YYYY-MM-DD format` });
      continue;
    }
    if (!isValidDate(end_date)) {
      errors.push({ row: rowNum, message: `Invalid end_date "${end_date}". Use YYYY-MM-DD format` });
      continue;
    }

    valid.push({
      vessel_type: vessel_type.toLowerCase(),
      rank_held: rank_held || "",
      days,
      start_date,
      end_date,
      notes: notes || "",
    });
  }

  return { valid, errors };
}
