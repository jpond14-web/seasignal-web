import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About SeaSignal",
  description:
    "SeaSignal is a privacy-first professional network built for seafarers. Learn about our mission.",
};

export default function AboutPage() {
  return (
    <article className="prose prose-invert prose-slate max-w-none">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">About SeaSignal</h1>

      <p className="text-lg text-slate-300 leading-relaxed">
        SeaSignal is a privacy-first professional network built exclusively for maritime professionals. Our mission is simple: give seafarers the tools and community they deserve, without compromise.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">Our Mission</h2>
      <p className="text-slate-300 leading-relaxed">
        The maritime industry connects the world, yet the people who make it possible are often the least connected and least protected. SeaSignal exists to change that. We provide a secure space where seafarers can share knowledge, track their careers, and look out for each other -- on board and ashore.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">Privacy First, Always</h2>
      <p className="text-slate-300 leading-relaxed">
        Unlike other platforms, SeaSignal was designed from the ground up with seafarer privacy as a core principle. Employers and manning agencies cannot access your data, your reviews, or your identity. Your company reviews are anonymous. Your incident logs are encrypted. Your data is yours.
      </p>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">What We Offer</h2>
      <ul className="text-slate-300 space-y-2 list-disc list-inside">
        <li><strong className="text-slate-100">Company Intel</strong> -- Honest, structured reviews of maritime employers covering pay reliability, safety culture, and contract accuracy.</li>
        <li><strong className="text-slate-100">Pay Transparency</strong> -- Real compensation data by rank, vessel type, and flag state so you know what you are worth.</li>
        <li><strong className="text-slate-100">Certificate Wallet</strong> -- Track your STCW and other certificates, get expiry alerts, and never miss a renewal.</li>
        <li><strong className="text-slate-100">Secure Messaging</strong> -- Private conversations with shipmates, with context channels for vessels and companies.</li>
        <li><strong className="text-slate-100">Incident Log</strong> -- A private, encrypted evidence vault with timestamped records.</li>
        <li><strong className="text-slate-100">Contract Check</strong> -- Verify contract terms against MLC 2006 standards before you sign.</li>
        <li><strong className="text-slate-100">Crew Finder</strong> -- Reconnect with former crewmates and find trusted colleagues.</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-100 mt-8 mb-3">Built for Seafarers</h2>
      <p className="text-slate-300 leading-relaxed">
        SeaSignal is built with the understanding that life at sea is different. We design for low-bandwidth environments, offline access, and the realities of watch-keeping schedules. Every feature is informed by the experiences of real seafarers.
      </p>

      <div className="mt-10 pt-6 border-t border-navy-800">
        <p className="text-slate-400">
          Ready to join?{" "}
          <Link href="/signup" className="text-teal-400 hover:text-teal-300 font-medium">
            Create your free account
          </Link>{" "}
          and become part of the maritime community that looks out for each other.
        </p>
      </div>
    </article>
  );
}
