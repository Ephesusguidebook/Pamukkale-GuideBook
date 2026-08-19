import { usePageContent } from '../PageContentContext';

const FAQ_ITEMS = [
  {
    q: 'How do I book a tour or activity?',
    a: 'Browse our Package Tours, Daily Tours or Activities pages, open the listing you like, and send us your details through the contact form on that page. Our travel consultant will get back to you to confirm availability and finalize your booking.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Accepted payment methods and any deposit requirements will be shared with you directly by our travel consultant once your booking is confirmed.',
  },
  {
    q: 'Can I cancel or change my booking?',
    a: "Cancellation terms vary by tour. Please contact us as soon as possible if you need to cancel or change a reservation — see our Terms and Conditions page for more detail.",
  },
  {
    q: "What's the difference between a Package Tour and a Daily Tour?",
    a: 'Package Tours are multi-day, all-inclusive itineraries covering several destinations. Daily Tours are single-day trips with no overnight stay, ideal if you only have a day to explore a destination.',
  },
  {
    q: 'Are your Activities bookable on their own?',
    a: 'Yes — Activities (like a hot air balloon ride or a cooking class) can be booked as standalone experiences, or added on top of any Package or Daily Tour.',
  },
  {
    q: 'How can I contact a travel consultant directly?',
    a: 'You can reach us through the contact form on any page, or via the WhatsApp button — whichever is easiest for you.',
  },
];

export default function Faq() {
  const { h1, p } = usePageContent('faq', {
    h1: 'Frequently Asked Questions',
    p: 'Answers to the questions we hear most often. Can\'t find what you\'re looking for? Reach out through our contact page.',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>
      <p className="mt-2 text-gray-500">{p}</p>

      <div className="mt-8 space-y-4">
        {FAQ_ITEMS.map((item, idx) => (
          <div key={idx} className="card p-5">
            <p className="font-semibold text-gray-900">{item.q}</p>
            <p className="mt-2 text-sm text-gray-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
