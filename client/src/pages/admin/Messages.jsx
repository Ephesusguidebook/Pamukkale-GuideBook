import { useEffect, useState } from 'react';
import api from '../../api';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/contact/admin/list')
      .then((res) => setMessages(res.data))
      .catch(() => setError('Mesajlar yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(msg) {
    if (msg.status === 'read') return;
    try {
      await api.put(`/contact/admin/${msg.id}/read`);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'read' } : m))
      );
    } catch {
      // sessizce geç
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Gelen Mesajlar</h1>
      {loading && <p className="text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && messages.length === 0 && (
        <p className="text-gray-500">Henüz mesaj yok.</p>
      )}
      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => markRead(msg)}
            className={`card cursor-pointer p-4 ${msg.status === 'new' ? 'border-l-4 border-l-amber-500' : ''}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-gray-900">{msg.name}</p>
              <span className="text-xs text-gray-400">
                {new Date(msg.created_at).toLocaleString('tr-TR')}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {msg.email} {msg.phone && `· ${msg.phone}`}
            </p>
            {msg.tour_title && (
              <p className="mt-1 text-xs font-medium text-teal-700">
                Tur: {msg.tour_title}
              </p>
            )}
            {msg.message && <p className="mt-2 text-sm text-gray-700">{msg.message}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
