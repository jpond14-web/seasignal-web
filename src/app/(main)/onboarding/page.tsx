'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ONBOARDED_KEY = 'seasignal-onboarded';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  function handleDone() {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    router.push('/home');
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step ? 'bg-teal-400' : 'bg-navy-700'
              }`}
            />
          ))}
        </div>

        {/* Step card */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-8">
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepRatings />}
          {step === 2 && <StepSignalFlares />}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-slate-100 border border-navy-700 hover:border-navy-600 transition-colors"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-navy-900 font-medium transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleDone}
                className="px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-navy-900 font-medium transition-colors"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1 ─── */
function StepWelcome() {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">
        Welcome to SeaSignal
      </h1>
      <p className="text-slate-400 mb-6">
        A privacy-first professional network built by and for seafarers.
      </p>

      <ul className="space-y-3 text-slate-300">
        {[
          'Rate companies, vessels, and agencies',
          'Report systemic issues anonymously',
          'Track certificates and sea time',
          'Connect with crew worldwide',
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-slate-500 italic">
        Your real identity is never shown publicly — everything is privacy-first.
      </p>
    </>
  );
}

/* ─── Step 2 ─── */
function StepRatings() {
  const scale: { score: number; label: string; color: string }[] = [
    { score: 1, label: 'Very Poor', color: 'bg-red-500' },
    { score: 2, label: 'Poor', color: 'bg-orange-500' },
    { score: 3, label: 'Average', color: 'bg-amber-500' },
    { score: 4, label: 'Good', color: 'bg-teal-500' },
    { score: 5, label: 'Excellent', color: 'bg-green-500' },
  ];

  const categories = [
    'Pay Reliability',
    'Contract Accuracy',
    'Safety Culture',
    'Food Quality',
    'Shore Leave',
    'Management',
    'Equipment Condition',
  ];

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">
        How Ratings Work
      </h1>
      <p className="text-slate-400 mb-6">
        When you review a company, vessel, or agency, you rate each area from 1
        to 5:
      </p>

      {/* Scale */}
      <div className="flex gap-2 mb-6">
        {scale.map(({ score, label, color }) => (
          <div key={score} className="flex-1 text-center">
            <div
              className={`${color} text-navy-900 font-bold rounded-lg py-2 text-lg`}
            >
              {score}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">{label}</span>
          </div>
        ))}
      </div>

      {/* Categories */}
      <p className="text-sm text-slate-400 mb-2 font-medium">Categories:</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <span
            key={cat}
            className="text-xs bg-navy-700 text-slate-300 px-2.5 py-1 rounded-full"
          >
            {cat}
          </span>
        ))}
      </div>

      <p className="text-sm text-slate-500 italic">
        Your reviews are batch-released every Sunday so no one can identify you
        by timing.
      </p>
    </>
  );
}

/* ─── Step 3 ─── */
function StepSignalFlares() {
  const severities: { level: string; color: string }[] = [
    { level: 'Concern', color: 'bg-amber-500' },
    { level: 'Violation', color: 'bg-orange-500' },
    { level: 'Critical', color: 'bg-red-500' },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">
        Signal Flares &amp; Your Rights
      </h1>
      <p className="text-slate-400 mb-6">
        See something wrong? Signal Flares let you report systemic company
        violations anonymously.
      </p>

      {/* Severity levels */}
      <div className="flex gap-3 mb-6">
        {severities.map(({ level, color }) => (
          <div
            key={level}
            className="flex-1 text-center bg-navy-900 border border-navy-700 rounded-lg py-3"
          >
            <div
              className={`${color} h-3 w-3 rounded-full mx-auto mb-2`}
            />
            <span className="text-sm text-slate-300 font-medium">{level}</span>
          </div>
        ))}
      </div>

      <p className="text-slate-400 text-sm mb-4">
        When enough crew report the same issue, SeaSignal investigates and
        contacts the company.
      </p>

      <p className="text-slate-400 text-sm">
        The Welfare section has your MLC rights, emergency contacts, and mental
        health resources — available even offline.
      </p>
    </>
  );
}
