import ContactForm from '../components/ContactForm';
import { usePageContent } from '../PageContentContext';

export default function Contact() {
  const { h1, p } = usePageContent('contact', {
    h1: 'Contact',
    p: "Questions or special requests? Send us a message and we'll get back to you as soon as possible.",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>
      <p className="mt-2 text-gray-500">{p}</p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
