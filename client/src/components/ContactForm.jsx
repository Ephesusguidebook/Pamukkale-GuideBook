import { useState } from 'react';
import api from '../api';

export default function ContactForm({ itemType, itemId, itemTitle }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
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
        ...form,
        item_type: itemType || null,
        item_id: itemId || null,
      });
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', message: '' });
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
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      {itemTitle && (
        <p className="text-sm text-gray-500">
          Interested in: <span className="font-medium text-gray-800">{itemTitle}</span>
        </p>
      )}
      <div>
        <label className="label">Full Name</label>
        <input
          className="input"
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">Message</label>
        <textarea
          className="input"
          rows={4}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
        />
      </div>
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
