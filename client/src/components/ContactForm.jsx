import { useState } from 'react';
import api from '../api';

// Shared contact form — used on the Contact page (inside its two-column
// layout) and as the fallback on the 404 page. firstName/lastName are
// combined into a single `name` and, when filled in, `subject` is folded
// into the top of `message` before submitting — the backend's
// contact_messages schema only ever had a single name/message pair (same
// composition trick TourBookingWidget already uses for its multi-line
// enquiries), so no API or database change was needed to add these fields.
export default function ContactForm({ itemType, itemId, itemTitle }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      await api.post('/contact', {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        message: form.subject ? `Subject: ${form.subject}\n\n${form.message}` : form.message,
        item_type: itemType || null,
        item_id: itemId || null,
      });
      setStatus('sent');
      setForm({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Could not send your message, please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-teal-700">Message received!</p>
        <p className="mt-1 text-sm text-gray-500">We'll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {itemTitle && (
        <p className="text-sm text-gray-500">
          Interested in: <span className="font-medium text-gray-800">{itemTitle}</span>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">First Name</label>
          <input
            className="input"
            required
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Last Name</label>
          <input
            className="input"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          className="input"
          required
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
      </div>
      <div>
        <label className="label">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          className="input"
          required
          placeholder="+ 90 XXX XXX XX XX"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>
      <div>
        <label className="label">Subject</label>
        <input
          className="input"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
        />
      </div>
      <div>
        <label className="label">
          Your Message <span className="text-red-500">*</span>
        </label>
        <textarea
          className="input"
          rows={5}
          required
          placeholder="Your Message"
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
        />
      </div>
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
