import ContactForm from '../components/ContactForm';

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">İletişim</h1>
      <p className="mt-2 text-gray-500">
        Sorularınız veya özel talepleriniz için bize yazın, size en kısa sürede dönüş yapalım.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
