import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "SeaSignal terms of service for maritime professionals.",
};

export default function TermsPage() {
  return (
    <article className="prose prose-invert prose-slate max-w-none">
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: April 2026</p>

      <p className="text-slate-300 leading-relaxed">
        These Terms of Service (&quot;Terms&quot;) govern your use of the SeaSignal platform. By creating an account or using our services, you agree to be bound by these Terms.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">1. Eligibility</h2>
      <p className="text-slate-300 leading-relaxed">
        SeaSignal is designed for maritime professionals, including active seafarers, former seafarers, cadets, and maritime industry workers. You must be at least 18 years old to create an account. By registering, you represent that the information you provide is accurate and that you are a legitimate maritime professional or stakeholder.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">2. Account Responsibilities</h2>
      <ul className="text-slate-300 space-y-1 list-disc list-inside">
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>You must not share your account with others or create multiple accounts.</li>
        <li>You are responsible for all activity under your account.</li>
        <li>Notify us immediately if you suspect unauthorised access.</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">3. Acceptable Use</h2>
      <p className="text-slate-300 leading-relaxed">You agree not to:</p>
      <ul className="text-slate-300 space-y-1 list-disc list-inside mt-2">
        <li>Submit false, misleading, or defamatory company reviews or pay data</li>
        <li>Harass, threaten, or abuse other users</li>
        <li>Impersonate another person or entity</li>
        <li>Use the platform to recruit or solicit seafarers without authorisation</li>
        <li>Scrape, harvest, or extract data from the platform</li>
        <li>Attempt to circumvent security measures or access other users&apos; data</li>
        <li>Upload malicious code or content</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">4. Content and Reviews</h2>
      <p className="text-slate-300 leading-relaxed">
        Reviews, pay submissions, and other user-generated content should be honest, based on personal experience, and factual. SeaSignal reserves the right to remove content that violates these Terms or is reported as abusive. We do not edit or alter reviews, but we may flag content for verification.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">5. Intellectual Property</h2>
      <p className="text-slate-300 leading-relaxed">
        The SeaSignal platform, including its design, features, and content (excluding user-generated content), is owned by SeaSignal. You retain ownership of content you submit, but grant SeaSignal a licence to display and use it within the platform. Aggregated, anonymised data derived from submissions may be used publicly.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">6. Privacy</h2>
      <p className="text-slate-300 leading-relaxed">
        Your privacy is fundamental to SeaSignal. Our use of your data is governed by our{" "}
        <a href="/privacy" className="text-teal-400 hover:text-teal-300">Privacy Policy</a>.
        We do not provide employers or third parties with access to your personal data.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">7. Disclaimers</h2>
      <p className="text-slate-300 leading-relaxed">
        SeaSignal is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the accuracy of user-submitted reviews, pay data, or contract assessments. The Contract Check feature provides general guidance based on MLC 2006 standards and does not constitute legal advice. Always consult qualified maritime legal counsel for contract disputes.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">8. Limitation of Liability</h2>
      <p className="text-slate-300 leading-relaxed">
        To the maximum extent permitted by law, SeaSignal shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you have paid us in the 12 months preceding the claim, if any.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">9. Termination</h2>
      <p className="text-slate-300 leading-relaxed">
        You may delete your account at any time. SeaSignal reserves the right to suspend or terminate accounts that violate these Terms. Upon termination, your personal data will be deleted in accordance with our Privacy Policy.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">10. Changes to Terms</h2>
      <p className="text-slate-300 leading-relaxed">
        We may update these Terms from time to time. We will notify you of material changes via email or in-app notification. Continued use of SeaSignal after changes constitutes acceptance.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">11. Governing Law</h2>
      <p className="text-slate-300 leading-relaxed">
        These Terms are governed by the laws of England and Wales. Disputes shall be resolved in the courts of England and Wales, unless otherwise required by applicable consumer protection law.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">Contact</h2>
      <p className="text-slate-300 leading-relaxed">
        For questions about these Terms, contact us at{" "}
        <a href="mailto:legal@seasignal.app" className="text-teal-400 hover:text-teal-300">legal@seasignal.app</a>.
      </p>
    </article>
  );
}
