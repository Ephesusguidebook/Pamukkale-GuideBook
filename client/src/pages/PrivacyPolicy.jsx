import { usePageContent } from '../PageContentContext';
import useSeo from '../lib/useSeo';

export default function PrivacyPolicy() {
  const { h1, p, seo_title, seo_description } = usePageContent('privacy', {
    h1: 'Privacy Policy',
    p: 'How we collect, use and protect the information you share with us.',
  });
  useSeo(seo_title || h1, seo_description || p);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>
      <p className="mt-2 text-gray-500">{p}</p>
      <p className="mt-2 text-sm text-gray-400">
        The sections below are placeholder text — replace them with your own reviewed privacy
        policy before launch.
      </p>

      <div className="prose mt-6 max-w-none space-y-5 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Information We Collect</h2>
          <p>
            When you submit a contact form or booking enquiry on this site, we collect the
            information you provide, such as your name, email address, phone number and any
            message you send us.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. How We Use Your Information</h2>
          <p>
            We use this information to respond to your enquiry, process bookings, and
            communicate with you about the tours and activities you're interested in. We do
            not sell your personal information to third parties.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. Data Storage</h2>
          <p>
            Enquiries and booking details are stored securely and are only accessible to our
            team for the purpose of managing your request.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Cookies</h2>
          <p>
            This site may use basic cookies or local storage to keep the website functioning
            correctly. We do not use tracking cookies for advertising purposes unless stated
            otherwise.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Your Rights</h2>
          <p>
            You may ask us at any time what information we hold about you, and request that it
            be corrected or deleted, by contacting us through our{' '}
            <a href="/contact" className="text-teal-700 hover:underline">contact page</a>.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this
            page.
          </p>
        </section>
      </div>
    </div>
  );
}
