export default function AboutUs() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">About Us</h1>

      <div className="prose mt-6 max-w-none space-y-4 text-gray-700">
        <p>
          Welcome! We are a Turkey-based travel company dedicated to helping you discover the
          country's most remarkable destinations — from the cotton-white travertines of
          Pamukkale to the hot air balloons of Cappadocia and the ancient ruins of Ephesus.
          Whatever brings you to Turkey, our goal is to make your trip effortless,
          well-organized and genuinely memorable.
        </p>
        <p>
          Our team is made up of local travel consultants and guides who know these regions
          first-hand. We design multi-day package tours, single-day guided tours and
          standalone activities that suit every kind of traveler, whether you're visiting for
          a few days or exploring the country from coast to coast.
        </p>
        <h2 className="text-lg font-semibold text-gray-900">What We Offer</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Carefully planned package tours with transparent pricing and no hidden costs.</li>
          <li>Daily tours for travelers who want to explore a destination without an overnight stay.</li>
          <li>Standalone activities and experiences you can add to any itinerary.</li>
          <li>A dedicated travel consultant available to answer your questions before and during your trip.</li>
        </ul>
        <h2 className="text-lg font-semibold text-gray-900">Why Travel With Us</h2>
        <p>
          We believe great travel comes from local knowledge, honest communication and
          attention to detail. Every tour on this site is reviewed and kept up to date by our
          team, and our travel consultant is always available if you need help choosing the
          right tour or customizing your itinerary.
        </p>
        <p>
          Have a question before you book? Get in touch through our{' '}
          <a href="/contact" className="text-teal-700 hover:underline">
            contact page
          </a>{' '}
          — we're happy to help you plan your trip.
        </p>
      </div>
    </div>
  );
}
