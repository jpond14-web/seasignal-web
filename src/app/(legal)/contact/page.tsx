import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the SeaSignal team.",
};

export default function ContactPage() {
  return (
    <article className="prose prose-invert prose-slate max-w-none">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">Contact Us</h1>

      <p className="text-lg text-slate-300 leading-relaxed">
        We would love to hear from you. Whether you have a question, feedback, or need support, reach out using any of the channels below.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">General Enquiries</h3>
          <a
            href="mailto:hello@seasignal.app"
            className="text-teal-400 hover:text-teal-300 text-sm"
          >
            hello@seasignal.app
          </a>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">Privacy and Data</h3>
          <a
            href="mailto:privacy@seasignal.app"
            className="text-teal-400 hover:text-teal-300 text-sm"
          >
            privacy@seasignal.app
          </a>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">Technical Support</h3>
          <a
            href="mailto:support@seasignal.app"
            className="text-teal-400 hover:text-teal-300 text-sm"
          >
            support@seasignal.app
          </a>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-2">Legal</h3>
          <a
            href="mailto:legal@seasignal.app"
            className="text-teal-400 hover:text-teal-300 text-sm"
          >
            legal@seasignal.app
          </a>
        </div>
      </div>

      {/* Contact form placeholder */}
      <div className="mt-10 bg-navy-900 border border-navy-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Send a Message</h2>
        <p className="text-sm text-slate-400 mb-6">
          Fill in the form below and we will get back to you as soon as possible.
        </p>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Your name"
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="How can we help?"
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-y"
            />
          </div>
          <button
            type="submit"
            disabled
            className="px-6 py-2 bg-teal-500/50 text-navy-950 font-medium rounded text-sm cursor-not-allowed"
            title="Contact form coming soon"
          >
            Send Message (Coming Soon)
          </button>
        </form>
      </div>

      <div className="mt-8">
        <p className="text-slate-400 text-sm">
          We aim to respond to all enquiries within 48 hours.
        </p>
      </div>
    </article>
  );
}
