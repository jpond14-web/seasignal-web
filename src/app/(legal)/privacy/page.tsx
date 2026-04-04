import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "SeaSignal privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-slate max-w-none">
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: April 2026</p>

      <p className="text-slate-300 leading-relaxed">
        SeaSignal (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting the privacy of maritime professionals who use our platform. This policy explains how we collect, use, store, and share your personal information.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">1. Information We Collect</h2>
      <p className="text-slate-300 leading-relaxed">We collect information you provide directly, including:</p>
      <ul className="text-slate-300 space-y-1 list-disc list-inside mt-2">
        <li>Account details (name, email address, phone number)</li>
        <li>Professional profile information (rank, certifications, sea service history)</li>
        <li>Certificate data (type, issuing authority, expiry dates)</li>
        <li>Company reviews and pay data you choose to submit</li>
        <li>Messages you send through our platform</li>
        <li>Incident logs and evidence you store in your private vault</li>
      </ul>
      <p className="text-slate-300 leading-relaxed mt-3">
        We also collect limited technical data automatically, including device type, browser information, IP address, and usage analytics to improve the platform.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">2. How We Use Your Information</h2>
      <ul className="text-slate-300 space-y-1 list-disc list-inside">
        <li>To provide and maintain the SeaSignal platform</li>
        <li>To send certificate expiry reminders and account notifications</li>
        <li>To generate anonymised, aggregated pay transparency data</li>
        <li>To enable secure messaging between verified users</li>
        <li>To improve our services through anonymised usage analytics</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">3. Data Storage and Security</h2>
      <p className="text-slate-300 leading-relaxed">
        Your data is stored securely using industry-standard encryption. Incident logs and private messages are encrypted end-to-end. We use Supabase for authentication and data storage, with row-level security policies ensuring you can only access your own data.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">4. Employer Access</h2>
      <p className="text-slate-300 leading-relaxed">
        <strong className="text-slate-100">SeaSignal does not provide employers, manning agencies, or any third party with access to your personal data, reviews, or activity.</strong> Your identity is never exposed in company reviews or pay submissions. We are built for seafarers, not recruiters.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">5. Data Sharing</h2>
      <p className="text-slate-300 leading-relaxed">
        We do not sell your personal data. We may share anonymised, aggregated data (such as average pay by rank and vessel type) publicly. We will only disclose personal information if required by law or to protect the safety of our users.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">6. Cookies</h2>
      <p className="text-slate-300 leading-relaxed">
        We use essential cookies for authentication and session management. We do not use third-party advertising cookies. Analytics cookies, if used, are anonymised and can be opted out of in your account settings.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">7. Your Rights</h2>
      <p className="text-slate-300 leading-relaxed">You have the right to:</p>
      <ul className="text-slate-300 space-y-1 list-disc list-inside mt-2">
        <li>Access your personal data at any time</li>
        <li>Export your data in a portable format (GDPR export)</li>
        <li>Correct inaccurate information</li>
        <li>Request deletion of your account and all associated data</li>
        <li>Withdraw consent for optional data processing</li>
      </ul>
      <p className="text-slate-300 leading-relaxed mt-3">
        To exercise these rights, contact us at <a href="mailto:privacy@seasignal.app" className="text-teal-400 hover:text-teal-300">privacy@seasignal.app</a>.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">8. Data Retention</h2>
      <p className="text-slate-300 leading-relaxed">
        We retain your data for as long as your account is active. If you delete your account, all personal data is permanently removed within 30 days. Anonymised aggregated data (e.g., pay averages) may be retained indefinitely.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">9. International Data Transfers</h2>
      <p className="text-slate-300 leading-relaxed">
        As a platform serving a global maritime community, your data may be processed in different jurisdictions. We ensure all transfers comply with applicable data protection laws, including GDPR where applicable.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">10. Changes to This Policy</h2>
      <p className="text-slate-300 leading-relaxed">
        We may update this policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of SeaSignal after changes constitutes acceptance of the updated policy.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">Contact</h2>
      <p className="text-slate-300 leading-relaxed">
        For privacy-related enquiries, contact us at{" "}
        <a href="mailto:privacy@seasignal.app" className="text-teal-400 hover:text-teal-300">privacy@seasignal.app</a>.
      </p>
    </article>
  );
}
