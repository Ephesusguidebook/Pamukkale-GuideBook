import { useState } from 'react';
import api from '../api';

// Inline "Become a Partner" lead form on the Agency Login page. Reuses the
// existing /api/contact endpoint and contact_messages table (Company Name
// -> company_name, Company Website -> company_website — two nullable
// columns added just for this — Contact Person Name -> name, unchanged
// phone/message columns) instead of a new table, so submissions already
// show up under Admin > Messages alongside regular contact enquiries.
export default function PartnerInquiryForm() {
  const [form, setForm] = useState({
    companyName: '',
    companyWebsite: '',
    contactName: '',
    phone: '',
    message: '',
  });
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
        name: form.contactName,
        company_name: form.companyName,
        company_website: form.companyWebsite,
        phone: form.phone,
        message: form.message,
        item_type: 'partner_inquiry',
      });
      setStatus('sent');
      setForm({ companyName: '', companyWebsite: '', contactName: '', phone: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Could not send your inquiry, please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-teal-700">Thanks for reaching out!</p>
        <p className="mt-1 text-sm text-gray-500">
          We've received your inquiry and will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            className="input"
            required
            placeholder="Your Agency Ltd."
            value={form.companyName}
            onChange={(e) => update('companyName', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Company Website</label>
          <input
            className="input"
            placeholder="www.youragency.com"
            value={form.companyWebsite}
            onChange={(e) => update('companyWebsite', e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            Contact Person Name <span className="text-red-500">*</span>
          </label>
          <input
            className="input"
            required
            placeholder="Full Name"
            value={form.contactName}
            onChange={(e) => update('contactName', e.target.value)}
          />
        </div>
        <div>
          <label className="label">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            className="input"
            required
            placeholder="+ 90 XXX XXX XX XX"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          className="input"
          rows={4}
          required
          placeholder="Tell us about your agency and the volume of guests you send to the Ephesus region."
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
        />
      </div>
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send Inquiry'}
      </button>
    </form>
  );
}
