"use client";

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  reason: string;
  onReasonChange: (reason: string) => void;
};

const REPORT_REASONS = ["Spam", "Harassment", "Misinformation", "Inappropriate", "Other"];

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  reason,
  onReasonChange,
}: ReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-lg p-4 mb-3">
      <h4 className="text-sm font-semibold text-slate-200 mb-2">Report Message</h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {REPORT_REASONS.map(r => (
          <button key={r} onClick={() => onReasonChange(r)}
            className={`px-3 py-1 text-xs rounded border ${reason === r ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-navy-900 text-slate-400 border-navy-600"}`}>
            {r}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onSubmit} disabled={!reason}
          className="px-4 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-40 text-xs font-medium rounded transition-colors">
          Submit Report
        </button>
        <button onClick={onClose}
          className="px-4 py-1.5 bg-navy-900 text-slate-400 hover:text-slate-200 text-xs rounded transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
