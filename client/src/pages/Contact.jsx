import { useEffect, useState } from 'react';
import ContactForm from '../components/ContactForm';
import SocialLinks from '../components/SocialLinks';
import api from '../api';
import { usePageContent } from '../PageContentContext';
import useSeo from '../lib/useSeo';

export default function Contact() {
  const { h1, p, seo_title, seo_description } = usePageContent('contact', {
    h1: 'Contact',
    p: "Questions or special requests? Send us a message and we'll get back to you as soon as possible.",
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

  const hasContactInfo =
    settings && (settings.contact_email || settings.contact_phone || settings.contact_address);
  const hasSocial =
    settings && (settings.whatsapp_button_phone || settings.facebook_url || settings.instagram_url);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{h1}</h1>
      <p className="mt-2 text-gray-500">{p}</p>

      {(hasContactInfo || hasSocial) && (
        <div className="card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          {hasContactInfo && (
            <div className="space-y-1.5 text-sm text-gray-700">
              {settings.contact_email && (
                <p>
                  ✉️{' '}
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-teal-700">
                    {settings.contact_email}
                  </a>
                </p>
              )}
              {settings.contact_phone && (
                <p>
                  📞{' '}
                  <a href={`tel:${settings.contact_phone}`} className="hover:text-teal-700">
                    {settings.contact_phone}
                  </a>
                </p>
              )}
              {settings.contact_address && <p>📍 {settings.contact_address}</p>}
            </div>
          )}
          <SocialLinks />
        </div>
      )}

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
