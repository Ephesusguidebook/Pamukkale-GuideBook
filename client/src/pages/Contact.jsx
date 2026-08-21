import { useEffect, useState } from 'react';
import ContactForm from '../components/ContactForm';
import api from '../api';
import { usePageContent } from '../PageContentContext';
import useSeo from '../lib/useSeo';

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current">
      <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.34.674 4.523 1.84 6.364L4 29l7.82-1.805A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.98 16.86c-.29.816-1.44 1.5-2.36 1.7-.63.13-1.45.24-4.22-.9-3.54-1.47-5.82-5.05-6-5.29-.17-.24-1.43-1.9-1.43-3.63 0-1.72.9-2.57 1.22-2.92.29-.32.63-.4.84-.4.21 0 .42.003.6.012.19.01.45-.07.7.54.29.7.98 2.42 1.06 2.6.08.18.14.39.03.63-.11.24-.16.39-.32.6-.16.2-.34.46-.48.62-.16.18-.33.37-.14.7.19.32.85 1.4 1.83 2.27 1.26 1.12 2.31 1.47 2.65 1.63.34.16.53.14.73-.08.2-.22.85-.99 1.08-1.33.23-.34.45-.28.76-.17.31.12 1.98.93 2.32 1.1.34.17.56.25.64.4.08.15.08.85-.21 1.67Z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="truncate font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function Contact() {
  const { h1, p, seo_title, seo_description } = usePageContent('contact', {
    h1: "Let's Plan Your Perfect Tour",
    p: "Whether you have a question about our tours, need help planning your itinerary, or just want to say hello — we're here for you.",
  });
  useSeo(seo_title || h1, seo_description || p);

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/settings')
      .then((res) => {
        if (active) setSettings(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const whatsappPhone = settings?.whatsapp_button_phone || '';
  const waLink = whatsappPhone ? `https://wa.me/${whatsappPhone.replace(/\D/g, '')}` : '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
        {/* --- Left: intro + info cards --- */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            We'd Love To Hear From You
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            {h1}
          </h1>
          <p className="mt-4 max-w-lg text-gray-500">{p}</p>

          {settings && (
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {settings.contact_email && (
                <InfoCard icon={<EnvelopeIcon />} label="Email" value={settings.contact_email} />
              )}
              {(settings.contact_phone || whatsappPhone) && (
                <InfoCard
                  icon={<WhatsAppIcon />}
                  label="WhatsApp / Phone"
                  value={settings.contact_phone || whatsappPhone}
                />
              )}
              {settings.contact_address && (
                <InfoCard icon={<MapPinIcon />} label="Location" value={settings.contact_address} />
              )}
              {settings.contact_response_time && (
                <InfoCard icon={<ClockIcon />} label="Response Time" value={settings.contact_response_time} />
              )}
            </div>
          )}

          {(waLink || settings?.contact_email) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5a]"
                >
                  <WhatsAppIcon /> WhatsApp
                </a>
              )}
              {settings?.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="btn-secondary">
                  <EnvelopeIcon /> Send Email
                </a>
              )}
            </div>
          )}
        </div>

        {/* --- Right: message form --- */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900">Send Us a Message</h2>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the form below and we'll get back to you as soon as possible.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
