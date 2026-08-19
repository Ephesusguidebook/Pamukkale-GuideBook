import { useState } from 'react';
import api from '../api';

export default function ContactForm({ tourId, tourTitle }) {
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
      await api.post('/contact', { ...form, tour_id: tourId || null });
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Mesaj gönderilemedi, tekrar deneyin.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-teal-700">Mesajınız alındı!</p>
        <p className="mt-1 text-sm text-gray-500">
          En kısa sürede size dönüş yapacağız.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      {tourTitle && (
        <p className="text-sm text-gray-500">
          İlgilendiğiniz tur: <span className="font-medium text-gray-800">{tourTitle}</span>
        </p>
      )}
      <div>
        <label className="label">Ad Soyad</label>
        <input
          className="input"
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">E-posta</label>
          <input
            type="email"
            className="input"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">Mesajınız</label>
        <textarea
          className="input"
          rows={4}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
        />
      </div>
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Gönderiliyor...' : 'Gönder'}
      </button>
    </form>
  );
}
