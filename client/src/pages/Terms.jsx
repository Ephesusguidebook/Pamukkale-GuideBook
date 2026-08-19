import { usePageContent } from '../PageContentContext';

export default function Terms() {
  const { h1, p } = usePageContent('terms', {
    h1: 'Terms and Conditions',
    p: 'Please read these terms carefully before booking a tour or activity with us.',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>
      <p className="mt-2 text-gray-500">{p}</p>
      <p className="mt-2 text-sm text-gray-400">
        The sections below are placeholder text — replace them with your own reviewed terms
        before launch.
      </p>

      <div className="prose mt-6 max-w-none space-y-5 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Introduction</h2>
          <p>
            These Terms and Conditions govern your use of this website and any tour, activity
            or service booked through it. By browsing this site or making a booking, you agree
            to be bound by these terms.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. Bookings and Payment</h2>
          <p>
            A booking is confirmed once we have received the required information and any
            applicable payment. Prices shown for package tours, daily tours and activities are
            subject to change until a booking is confirmed. Accepted payment methods and
            deposit requirements will be communicated at the time of booking.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. Cancellations and Refunds</h2>
          <p>
            Cancellation terms vary by tour and will be provided at the time of booking. Please
            contact us as soon as possible if you need to cancel or change a reservation, and we
            will let you know what options are available.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Changes to Tours</h2>
          <p>
            We make every effort to deliver tours and activities as described, but itineraries
            may occasionally change due to weather, safety, availability or circumstances
            beyond our control. Where possible we will offer a reasonable alternative.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Liability</h2>
          <p>
            While we take reasonable care in selecting our partners and planning our tours, we
            are not liable for loss, injury or damage arising from circumstances outside our
            reasonable control, including third-party services.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. Contact</h2>
          <p>
            If you have any questions about these Terms and Conditions, please reach out via
            our <a href="/contact" className="text-teal-700 hover:underline">contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
