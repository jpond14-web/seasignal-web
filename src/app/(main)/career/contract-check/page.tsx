"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type VesselType =
  | "tanker"
  | "bulk_carrier"
  | "container"
  | "general_cargo"
  | "offshore"
  | "passenger"
  | "roro"
  | "lng"
  | "lpg"
  | "chemical"
  | "reefer"
  | "tug"
  | "fishing"
  | "other";

type RankCategory = "ab" | "officer" | "master_ce";

type MedicalCoverage = "basic" | "standard" | "comprehensive";

interface StepOneData {
  vesselType: VesselType | "";
  rank: RankCategory | "";
  contractMonths: number | "";
}

interface StepTwoData {
  monthlySalary: number | "";
  overtimeRate: number | "";
  leavePayIncluded: boolean;
  travelAllowance: number | "";
  signOnBonus: number | "";
}

interface StepThreeData {
  hoursPerDay: number | "";
  daysOn: number | "";
  daysOff: number | "";
  internetAccess: "yes" | "no" | "limited";
  foodQuality: number;
}

interface StepFourData {
  noticePeriod: number | "";
  earlyTerminationPenalty: boolean;
  repatriationCovered: boolean;
  medicalCoverage: MedicalCoverage;
  insuranceProvided: boolean;
}

interface AssessmentResult {
  overallGrade: "A" | "B" | "C" | "D" | "F";
  overallScore: number;
  categories: {
    pay: CategoryResult;
    benefits: CategoryResult;
    conditions: CategoryResult;
    fairness: CategoryResult;
  };
  redFlags: string[];
  greenFlags: string[];
}

interface CategoryResult {
  score: number;
  label: string;
  findings: string[];
}

/* ------------------------------------------------------------------ */
/*  Salary market data                                                 */
/* ------------------------------------------------------------------ */

const VESSEL_TYPE_LABELS: Record<VesselType, string> = {
  tanker: "Tanker",
  bulk_carrier: "Bulk Carrier",
  container: "Container",
  general_cargo: "General Cargo",
  offshore: "Offshore",
  passenger: "Passenger",
  roro: "RoRo",
  lng: "LNG",
  lpg: "LPG",
  chemical: "Chemical",
  reefer: "Reefer",
  tug: "Tug",
  fishing: "Fishing",
  other: "Other",
};

const RANK_LABELS: Record<RankCategory, string> = {
  ab: "AB / Rating",
  officer: "Officer",
  master_ce: "Master / Chief Engineer",
};

type SalaryRange = { min: number; max: number };
type SalaryByRank = Record<RankCategory, SalaryRange>;

const SALARY_DATA: Record<string, SalaryByRank> = {
  tanker: {
    ab: { min: 3500, max: 6500 },
    officer: { min: 5000, max: 9000 },
    master_ce: { min: 8000, max: 14000 },
  },
  container: {
    ab: { min: 3000, max: 5500 },
    officer: { min: 4500, max: 8000 },
    master_ce: { min: 7500, max: 13000 },
  },
  bulk_carrier: {
    ab: { min: 2800, max: 5000 },
    officer: { min: 4000, max: 7500 },
    master_ce: { min: 7000, max: 12000 },
  },
  offshore: {
    ab: { min: 4000, max: 7000 },
    officer: { min: 6000, max: 11000 },
    master_ce: { min: 10000, max: 18000 },
  },
  general_cargo: {
    ab: { min: 2500, max: 4500 },
    officer: { min: 3500, max: 6500 },
    master_ce: { min: 6000, max: 10000 },
  },
};

interface RealSalaryData {
  median: number;
  p25: number;
  p75: number;
  reportCount: number;
}

async function fetchRealSalaryData(
  vesselType: string,
  rank: RankCategory
): Promise<RealSalaryData | null> {
  const supabase = createClient();

  // Map contract-check rank categories to pay_reports rank values
  const rankMap: Record<RankCategory, string[]> = {
    ab: ["ab", "rating", "os", "ordinary_seaman", "able_seaman"],
    officer: ["officer", "2nd_officer", "3rd_officer", "2nd_engineer", "3rd_engineer", "chief_officer", "chief_mate"],
    master_ce: ["master", "chief_engineer", "captain"],
  };

  const rankValues = rankMap[rank];

  const { data, error } = await supabase
    .from("pay_reports")
    .select("monthly_base_usd")
    .eq("vessel_type", vesselType as VesselType)
    .in("rank", rankValues);

  if (error || !data || data.length < 3) return null;

  const salaries = data.map((r) => Number(r.monthly_base_usd) || 0).sort((a, b) => a - b);
  const len = salaries.length;

  const median =
    len % 2 === 0
      ? (salaries[len / 2 - 1] + salaries[len / 2]) / 2
      : salaries[Math.floor(len / 2)];

  const p25 = salaries[Math.floor(len * 0.25)];
  const p75 = salaries[Math.floor(len * 0.75)];

  return { median, p25, p75, reportCount: len };
}

function getSalaryRange(vesselType: string, rank: RankCategory, realData?: RealSalaryData | null): SalaryRange {
  if (realData) {
    return { min: realData.p25, max: realData.p75 };
  }
  const key =
    vesselType in SALARY_DATA ? vesselType : "general_cargo";
  return SALARY_DATA[key][rank];
}

/* ------------------------------------------------------------------ */
/*  Assessment logic                                                   */
/* ------------------------------------------------------------------ */

function assess(
  s1: StepOneData,
  s2: StepTwoData,
  s3: StepThreeData,
  s4: StepFourData,
  realSalary?: RealSalaryData | null
): AssessmentResult {
  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  // --- Pay Assessment ---
  const range = getSalaryRange(s1.vesselType || "general_cargo", (s1.rank || "ab") as RankCategory, realSalary);
  const salary = Number(s2.monthlySalary) || 0;
  const median = (range.min + range.max) / 2;
  let payScore: number;
  const payFindings: string[] = [];

  if (salary >= range.max) {
    payScore = 95;
    payFindings.push("Salary is at or above the top of the market range");
    greenFlags.push("Above-market salary");
  } else if (salary >= median) {
    payScore = 70 + ((salary - median) / (range.max - median)) * 25;
    payFindings.push("Salary is above the median for this vessel type and rank");
  } else if (salary >= range.min) {
    payScore = 40 + ((salary - range.min) / (median - range.min)) * 30;
    payFindings.push("Salary is below the median but within market range");
  } else if (salary > 0) {
    payScore = Math.max(5, 40 * (salary / range.min));
    payFindings.push("Salary is below the market range for this vessel type and rank");
    redFlags.push(`Salary ($${salary.toLocaleString()}/mo) is below market minimum ($${range.min.toLocaleString()}/mo)`);
  } else {
    payScore = 0;
    payFindings.push("No salary data entered");
  }

  const overtime = Number(s2.overtimeRate) || 0;
  if (overtime > 0) {
    payScore = Math.min(100, payScore + 5);
    payFindings.push(`Overtime rate: $${overtime}/hr`);
  } else {
    payFindings.push("No overtime rate specified");
  }

  payFindings.push(`Market range: $${range.min.toLocaleString()} - $${range.max.toLocaleString()}/mo`);

  // --- Benefits Assessment ---
  let benefitsScore = 0;
  const benefitsFindings: string[] = [];

  if (s2.leavePayIncluded) {
    benefitsScore += 30;
    greenFlags.push("Leave pay included");
    benefitsFindings.push("Leave pay is included in the contract");
  } else {
    benefitsScore += 5;
    benefitsFindings.push("No leave pay included");
    redFlags.push("No leave pay included in contract");
  }

  const travel = Number(s2.travelAllowance) || 0;
  if (travel > 0) {
    benefitsScore += 25 + Math.min(10, travel / 100);
    greenFlags.push("Travel allowance provided");
    benefitsFindings.push(`Travel allowance: $${travel.toLocaleString()}`);
  } else {
    benefitsScore += 5;
    benefitsFindings.push("No travel allowance");
  }

  const bonus = Number(s2.signOnBonus) || 0;
  if (bonus > 0) {
    benefitsScore += 25 + Math.min(10, bonus / 200);
    greenFlags.push("Sign-on bonus offered");
    benefitsFindings.push(`Sign-on bonus: $${bonus.toLocaleString()}`);
  } else {
    benefitsScore += 5;
    benefitsFindings.push("No sign-on bonus");
  }

  benefitsScore = Math.min(100, benefitsScore);

  // --- Working Conditions Assessment ---
  let conditionsScore = 0;
  const conditionsFindings: string[] = [];
  const hours = Number(s3.hoursPerDay) || 0;

  if (hours > 0 && hours <= 8) {
    conditionsScore += 30;
    conditionsFindings.push(`${hours} hours/day — standard or better`);
  } else if (hours > 8 && hours <= 10) {
    conditionsScore += 20;
    conditionsFindings.push(`${hours} hours/day — within MLC limits`);
  } else if (hours > 10 && hours <= 14) {
    conditionsScore += 10;
    conditionsFindings.push(`${hours} hours/day — near MLC maximum`);
    redFlags.push(`Long working hours: ${hours}h/day`);
  } else if (hours > 14) {
    conditionsScore += 0;
    conditionsFindings.push(`${hours} hours/day — exceeds MLC limits`);
    redFlags.push(`Working hours (${hours}h/day) exceed MLC maximum of 14h/day`);
  }

  const daysOn = Number(s3.daysOn) || 0;
  const daysOff = Number(s3.daysOff) || 0;
  if (daysOn > 0 && daysOff > 0) {
    const ratio = daysOff / daysOn;
    if (ratio >= 0.5) {
      conditionsScore += 25;
      conditionsFindings.push(`Days on/off ratio: ${daysOn}:${daysOff} — good rest balance`);
      if (ratio >= 1) greenFlags.push("Equal or better days on/off ratio");
    } else if (ratio >= 0.25) {
      conditionsScore += 15;
      conditionsFindings.push(`Days on/off ratio: ${daysOn}:${daysOff} — below average`);
    } else {
      conditionsScore += 5;
      conditionsFindings.push(`Days on/off ratio: ${daysOn}:${daysOff} — poor rest balance`);
      redFlags.push(`Poor days on/off ratio: ${daysOn}:${daysOff}`);
    }
  }

  if (s3.internetAccess === "yes") {
    conditionsScore += 20;
    greenFlags.push("Full internet access on board");
    conditionsFindings.push("Internet access: Yes");
  } else if (s3.internetAccess === "limited") {
    conditionsScore += 10;
    conditionsFindings.push("Internet access: Limited");
  } else {
    conditionsScore += 0;
    conditionsFindings.push("Internet access: None");
  }

  const food = s3.foodQuality;
  conditionsScore += food * 5;
  if (food >= 4) {
    conditionsFindings.push(`Food quality: ${food}/5 — good`);
  } else if (food >= 3) {
    conditionsFindings.push(`Food quality: ${food}/5 — adequate`);
  } else {
    conditionsFindings.push(`Food quality: ${food}/5 — poor`);
    if (food <= 2) redFlags.push("Poor food quality reported");
  }

  conditionsScore = Math.min(100, conditionsScore);

  // --- Contract Fairness Assessment ---
  let fairnessScore = 0;
  const fairnessFindings: string[] = [];
  const notice = Number(s4.noticePeriod) || 0;

  if (notice >= 30) {
    fairnessScore += 20;
    fairnessFindings.push(`Notice period: ${notice} days — standard or better`);
  } else if (notice >= 14) {
    fairnessScore += 15;
    fairnessFindings.push(`Notice period: ${notice} days — short but reasonable`);
  } else if (notice > 0) {
    fairnessScore += 5;
    fairnessFindings.push(`Notice period: ${notice} days — very short`);
    redFlags.push(`Very short notice period: ${notice} days`);
  } else {
    fairnessFindings.push("No notice period specified");
  }

  if (s4.earlyTerminationPenalty) {
    fairnessScore += 0;
    fairnessFindings.push("Early termination penalty: Yes");
    redFlags.push("Contract includes early termination penalty");
  } else {
    fairnessScore += 20;
    fairnessFindings.push("No early termination penalty");
    greenFlags.push("No early termination penalty");
  }

  if (s4.repatriationCovered) {
    fairnessScore += 25;
    fairnessFindings.push("Repatriation: Covered by employer");
    greenFlags.push("Repatriation covered");
  } else {
    fairnessScore += 0;
    fairnessFindings.push("Repatriation: Not covered");
    redFlags.push("Repatriation not covered — required by MLC 2006");
  }

  if (s4.medicalCoverage === "comprehensive") {
    fairnessScore += 25;
    fairnessFindings.push("Medical coverage: Comprehensive");
    greenFlags.push("Comprehensive medical coverage");
  } else if (s4.medicalCoverage === "standard") {
    fairnessScore += 15;
    fairnessFindings.push("Medical coverage: Standard");
  } else {
    fairnessScore += 5;
    fairnessFindings.push("Medical coverage: Basic only");
    redFlags.push("Only basic medical coverage provided");
  }

  if (s4.insuranceProvided) {
    fairnessScore += 10;
    fairnessFindings.push("Insurance: Provided");
    greenFlags.push("Insurance provided");
  } else {
    fairnessScore += 0;
    fairnessFindings.push("Insurance: Not provided");
    redFlags.push("No insurance provided");
  }

  fairnessScore = Math.min(100, fairnessScore);

  // --- Overall ---
  const overallScore = Math.round(
    payScore * 0.35 + benefitsScore * 0.2 + conditionsScore * 0.25 + fairnessScore * 0.2
  );

  let overallGrade: AssessmentResult["overallGrade"];
  if (overallScore >= 80) overallGrade = "A";
  else if (overallScore >= 65) overallGrade = "B";
  else if (overallScore >= 50) overallGrade = "C";
  else if (overallScore >= 35) overallGrade = "D";
  else overallGrade = "F";

  return {
    overallGrade,
    overallScore,
    categories: {
      pay: { score: Math.round(payScore), label: "Pay Assessment", findings: payFindings },
      benefits: { score: Math.round(benefitsScore), label: "Benefits Assessment", findings: benefitsFindings },
      conditions: { score: Math.round(conditionsScore), label: "Working Conditions", findings: conditionsFindings },
      fairness: { score: Math.round(fairnessScore), label: "Contract Fairness", findings: fairnessFindings },
    },
    redFlags,
    greenFlags,
  };
}

/* ------------------------------------------------------------------ */
/*  Grade color helper                                                 */
/* ------------------------------------------------------------------ */

function gradeColor(grade: AssessmentResult["overallGrade"]) {
  switch (grade) {
    case "A": return "text-green-400 border-green-400/40 bg-green-400/10";
    case "B": return "text-teal-400 border-teal-400/40 bg-teal-400/10";
    case "C": return "text-amber-400 border-amber-400/40 bg-amber-400/10";
    case "D": return "text-orange-400 border-orange-400/40 bg-orange-400/10";
    case "F": return "text-red-400 border-red-400/40 bg-red-400/10";
  }
}

function scoreBarColor(score: number) {
  if (score >= 75) return "bg-green-400";
  if (score >= 55) return "bg-teal-400";
  if (score >= 40) return "bg-amber-400";
  if (score >= 25) return "bg-orange-400";
  return "bg-red-400";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 4;

export default function ContractCheckPage() {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [realSalary, setRealSalary] = useState<RealSalaryData | null>(null);
  const [salaryDataLoading, setSalaryDataLoading] = useState(false);

  const [s1, setS1] = useState<StepOneData>({ vesselType: "", rank: "", contractMonths: "" });
  const [s2, setS2] = useState<StepTwoData>({ monthlySalary: "", overtimeRate: "", leavePayIncluded: false, travelAllowance: "", signOnBonus: "" });
  const [s3, setS3] = useState<StepThreeData>({ hoursPerDay: "", daysOn: "", daysOff: "", internetAccess: "no", foodQuality: 3 });
  const [s4, setS4] = useState<StepFourData>({ noticePeriod: "", earlyTerminationPenalty: false, repatriationCovered: true, medicalCoverage: "standard", insuranceProvided: false });

  // Fetch real salary data when vessel type and rank are selected
  useEffect(() => {
    if (!s1.vesselType || !s1.rank) {
      setRealSalary(null);
      return;
    }
    let cancelled = false;
    setSalaryDataLoading(true);
    fetchRealSalaryData(s1.vesselType, s1.rank as RankCategory).then((data) => {
      if (!cancelled) {
        setRealSalary(data);
        setSalaryDataLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [s1.vesselType, s1.rank]);

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      setResult(assess(s1, s2, s3, s4, realSalary));
      setStep(TOTAL_STEPS + 1);
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleReset() {
    setStep(1);
    setResult(null);
    setRealSalary(null);
    setS1({ vesselType: "", rank: "", contractMonths: "" });
    setS2({ monthlySalary: "", overtimeRate: "", leavePayIncluded: false, travelAllowance: "", signOnBonus: "" });
    setS3({ hoursPerDay: "", daysOn: "", daysOff: "", internetAccess: "no", foodQuality: 3 });
    setS4({ noticePeriod: "", earlyTerminationPenalty: false, repatriationCovered: true, medicalCoverage: "standard", insuranceProvided: false });
  }

  const canProceed = (() => {
    switch (step) {
      case 1: return s1.vesselType !== "" && s1.rank !== "";
      case 2: return s2.monthlySalary !== "";
      default: return true;
    }
  })();

  /* shared input styles */
  const inputCls = "w-full bg-navy-800 border border-navy-600 rounded px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500";
  const selectCls = inputCls + " appearance-none";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-slate-400 mb-6">
        Evaluate your contract terms against market data. Your contract details are not stored or shared.
      </p>

      {/* Methodology transparency */}
      <div className="bg-navy-800 border border-navy-700 rounded-lg mb-6">
        <button
          type="button"
          onClick={() => setMethodologyOpen(!methodologyOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:text-slate-100 transition-colors"
        >
          <span className="font-medium">How is this calculated?</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${methodologyOpen ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {methodologyOpen && (
          <div className="px-4 pb-4 space-y-4 text-sm">
            <div>
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Assessment Categories</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li><span className="text-teal-400 font-medium">Pay Assessment</span> <span className="text-slate-500">(35% weight)</span> — compares salary to market data for vessel type and rank</li>
                <li><span className="text-teal-400 font-medium">Benefits Assessment</span> <span className="text-slate-500">(20% weight)</span> — evaluates leave pay, travel allowance, sign-on bonus</li>
                <li><span className="text-teal-400 font-medium">Working Conditions</span> <span className="text-slate-500">(25% weight)</span> — hours, rest days, internet, food quality</li>
                <li><span className="text-teal-400 font-medium">Contract Fairness</span> <span className="text-slate-500">(20% weight)</span> — notice period, repatriation, medical, insurance</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Grade Scale</h4>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="px-2 py-0.5 bg-green-400/10 text-green-400 rounded">A: &ge;80</span>
                <span className="px-2 py-0.5 bg-teal-400/10 text-teal-400 rounded">B: &ge;65</span>
                <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded">C: &ge;50</span>
                <span className="px-2 py-0.5 bg-orange-400/10 text-orange-400 rounded">D: &ge;35</span>
                <span className="px-2 py-0.5 bg-red-400/10 text-red-400 rounded">F: &lt;35</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Data Sources</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Salary ranges are based on aggregated industry data and may vary by region, company, and specific rank. We reference MLC 2006 standards for working hours and repatriation requirements.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Privacy</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your contract details are processed entirely in your browser. Nothing is stored or transmitted.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {step <= TOTAL_STEPS && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => n < step && setStep(n)}
                className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                  n === step
                    ? "bg-teal-500 text-navy-950"
                    : n < step
                    ? "bg-teal-500/20 text-teal-400 cursor-pointer hover:bg-teal-500/30"
                    : "bg-navy-700 text-slate-500"
                }`}
                disabled={n > step}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="h-1 bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-slate-500">
            <span>Basic Info</span>
            <span>Compensation</span>
            <span>Conditions</span>
            <span>Terms</span>
          </div>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Basic Information</h2>

          <div>
            <label className={labelCls}>Vessel Type *</label>
            <select
              className={selectCls}
              value={s1.vesselType}
              onChange={(e) => setS1({ ...s1, vesselType: e.target.value as VesselType })}
            >
              <option value="">Select vessel type</option>
              {(Object.keys(VESSEL_TYPE_LABELS) as VesselType[]).map((vt) => (
                <option key={vt} value={vt}>{VESSEL_TYPE_LABELS[vt]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Rank / Position *</label>
            <select
              className={selectCls}
              value={s1.rank}
              onChange={(e) => setS1({ ...s1, rank: e.target.value as RankCategory })}
            >
              <option value="">Select rank category</option>
              {(Object.keys(RANK_LABELS) as RankCategory[]).map((r) => (
                <option key={r} value={r}>{RANK_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Contract Duration (months)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 9"
              min={1}
              max={36}
              value={s1.contractMonths}
              onChange={(e) => setS1({ ...s1, contractMonths: e.target.value ? Number(e.target.value) : "" })}
            />
          </div>
        </div>
      )}

      {/* Step 2: Compensation */}
      {step === 2 && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Compensation</h2>

          <div>
            <label className={labelCls}>Monthly Salary (USD) *</label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 5000"
              min={0}
              value={s2.monthlySalary}
              onChange={(e) => setS2({ ...s2, monthlySalary: e.target.value ? Number(e.target.value) : "" })}
            />
          </div>

          <div>
            <label className={labelCls}>Overtime Rate (USD/hr)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 15"
              min={0}
              value={s2.overtimeRate}
              onChange={(e) => setS2({ ...s2, overtimeRate: e.target.value ? Number(e.target.value) : "" })}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setS2({ ...s2, leavePayIncluded: !s2.leavePayIncluded })}
              className={`w-10 h-6 rounded-full transition-colors relative ${s2.leavePayIncluded ? "bg-teal-500" : "bg-navy-600"}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${s2.leavePayIncluded ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-slate-300">Leave pay included</span>
          </div>

          <div>
            <label className={labelCls}>Travel Allowance (USD)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 500"
              min={0}
              value={s2.travelAllowance}
              onChange={(e) => setS2({ ...s2, travelAllowance: e.target.value ? Number(e.target.value) : "" })}
            />
          </div>

          <div>
            <label className={labelCls}>Sign-on Bonus (USD)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 1000"
              min={0}
              value={s2.signOnBonus}
              onChange={(e) => setS2({ ...s2, signOnBonus: e.target.value ? Number(e.target.value) : "" })}
            />
          </div>
        </div>
      )}

      {/* Step 3: Working Conditions */}
      {step === 3 && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Working Conditions</h2>

          <div>
            <label className={labelCls}>Hours Per Day</label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 8"
              min={1}
              max={24}
              value={s3.hoursPerDay}
              onChange={(e) => setS3({ ...s3, hoursPerDay: e.target.value ? Number(e.target.value) : "" })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Days On</label>
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 120"
                min={1}
                value={s3.daysOn}
                onChange={(e) => setS3({ ...s3, daysOn: e.target.value ? Number(e.target.value) : "" })}
              />
            </div>
            <div>
              <label className={labelCls}>Days Off</label>
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 60"
                min={1}
                value={s3.daysOff}
                onChange={(e) => setS3({ ...s3, daysOff: e.target.value ? Number(e.target.value) : "" })}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Internet Access</label>
            <select
              className={selectCls}
              value={s3.internetAccess}
              onChange={(e) => setS3({ ...s3, internetAccess: e.target.value as "yes" | "no" | "limited" })}
            >
              <option value="yes">Yes</option>
              <option value="limited">Limited</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Food Quality ({s3.foodQuality}/5)</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={s3.foodQuality}
              onChange={(e) => setS3({ ...s3, foodQuality: Number(e.target.value) })}
              className="w-full accent-teal-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Poor</span>
              <span>Average</span>
              <span>Excellent</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Contract Terms */}
      {step === 4 && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Contract Terms</h2>

          <div>
            <label className={labelCls}>Notice Period (days)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 30"
              min={0}
              value={s4.noticePeriod}
              onChange={(e) => setS4({ ...s4, noticePeriod: e.target.value ? Number(e.target.value) : "" })}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setS4({ ...s4, earlyTerminationPenalty: !s4.earlyTerminationPenalty })}
              className={`w-10 h-6 rounded-full transition-colors relative ${s4.earlyTerminationPenalty ? "bg-red-500" : "bg-navy-600"}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${s4.earlyTerminationPenalty ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-slate-300">Early termination penalty</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setS4({ ...s4, repatriationCovered: !s4.repatriationCovered })}
              className={`w-10 h-6 rounded-full transition-colors relative ${s4.repatriationCovered ? "bg-teal-500" : "bg-navy-600"}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${s4.repatriationCovered ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-slate-300">Repatriation covered</span>
          </div>

          <div>
            <label className={labelCls}>Medical Coverage</label>
            <select
              className={selectCls}
              value={s4.medicalCoverage}
              onChange={(e) => setS4({ ...s4, medicalCoverage: e.target.value as MedicalCoverage })}
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setS4({ ...s4, insuranceProvided: !s4.insuranceProvided })}
              className={`w-10 h-6 rounded-full transition-colors relative ${s4.insuranceProvided ? "bg-teal-500" : "bg-navy-600"}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${s4.insuranceProvided ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-slate-300">Insurance provided</span>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {step <= TOTAL_STEPS && (
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-2.5 bg-navy-800 hover:bg-navy-700 text-slate-300 font-medium rounded text-sm transition-colors border border-navy-600"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-1 py-2.5 font-medium rounded text-sm transition-colors ${
              canProceed
                ? "bg-teal-500 hover:bg-teal-400 text-navy-950"
                : "bg-navy-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            {step === TOTAL_STEPS ? "Get Assessment" : "Next"}
          </button>
        </div>
      )}

      {/* Results */}
      {step > TOTAL_STEPS && result && (
        <div className="space-y-6">
          {/* Overall grade */}
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 text-center">
            <p className="text-sm text-slate-400 mb-3">Overall Contract Grade</p>
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl border-2 text-5xl font-bold ${gradeColor(result.overallGrade)}`}>
              {result.overallGrade}
            </div>
            <p className="text-sm text-slate-400 mt-3">Score: {result.overallScore}/100</p>
          </div>

          {/* Category breakdowns */}
          <div className="space-y-3">
            {(Object.keys(result.categories) as Array<keyof typeof result.categories>).map((key) => {
              const cat = result.categories[key];
              return (
                <Fragment key={key}>
                  <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-100">{cat.label}</h3>
                      <span className="text-sm font-mono text-slate-300">{cat.score}/100</span>
                    </div>
                    <div className="h-2 bg-navy-700 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(cat.score)}`}
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                    <ul className="space-y-1">
                      {cat.findings.map((f, i) => (
                        <li key={i} className="text-sm text-slate-400 flex gap-2">
                          <span className="text-slate-500 shrink-0">-</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {key === "pay" && (
                    <>
                    {/* Data source indicator */}
                    <div className={`rounded-lg px-4 py-2.5 flex items-center gap-2 text-xs ${realSalary ? "bg-teal-500/5 border border-teal-500/20" : "bg-navy-800 border border-navy-700"}`}>
                      {realSalary ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-teal-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-teal-300">
                            Based on {realSalary.reportCount} real seafarer report{realSalary.reportCount !== 1 ? "s" : ""}
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="text-slate-400">
                            Using industry benchmarks (not enough real reports for this combination)
                          </span>
                        </>
                      )}
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                      <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Pay ranges shown are aggregate figures and do not account for gender-based pay disparities. Research indicates women seafarers may face systemic pay gaps in certain sectors. If you believe your contract reflects gender-based discrimination, contact the ITF (International Transport Workers&apos; Federation) at{" "}
                        <a
                          href="https://www.itfseafarers.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          itfseafarers.org
                        </a>
                      </p>
                    </div>
                    </>
                  )}
                </Fragment>
              );
            })}
          </div>

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                Red Flags
              </h3>
              <ul className="space-y-1.5">
                {result.redFlags.map((f, i) => (
                  <li key={i} className="text-sm text-red-300 flex gap-2">
                    <span className="shrink-0">-</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Green flags */}
          {result.greenFlags.length > 0 && (
            <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Green Flags
              </h3>
              <ul className="space-y-1.5">
                {result.greenFlags.map((f, i) => (
                  <li key={i} className="text-sm text-green-300 flex gap-2">
                    <span className="shrink-0">-</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Start over */}
          <button
            onClick={handleReset}
            className="w-full py-2.5 bg-navy-800 hover:bg-navy-700 text-slate-300 font-medium rounded text-sm transition-colors border border-navy-600"
          >
            Check Another Contract
          </button>

          {/* Disclaimer */}
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            This assessment is for informational purposes only and does not constitute legal advice.
            Market data is approximate and may vary by region, company, and individual qualifications.
          </p>
        </div>
      )}
    </div>
  );
}
