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
      .catch(() => setError('Could not load messages.'))
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
      // fail silently
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Messages</h1>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && messages.length === 0 && (
        <p className="text-gray-500">No messages yet.</p>
      )}
      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => markRead(msg)}
            className={`card cursor-pointer p-4 ${msg.status === 'new' ? 'border-l-4 border-l-amber-500' : ''}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-gray-900">
                {msg.name}
                {msg.company_name && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Partner Inquiry
                  </span>
                )}
              </p>
              <span className="text-xs text-gray-400">
                {new Date(msg.created_at).toLocaleString('en-US')}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {[msg.email, msg.phone].filter(Boolean).join(' · ')}
            </p>
            {msg.company_name && (
              <p className="mt-1 text-xs font-medium text-gray-700">
                {msg.company_name}
                {msg.company_website && (
                  <>
                    {' · '}
                    <a
                      href={/^https?:\/\//i.test(msg.company_website) ? msg.company_website : `https://${msg.company_website}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-teal-700 hover:underline"
                    >
                      {msg.company_website}
                    </a>
                  </>
                )}
              </p>
            )}
            {msg.item_title && (
              <p className="mt-1 text-xs font-medium text-teal-700">
                Regarding: {msg.item_title}
              </p>
            )}
            {msg.message && <p className="mt-2 text-sm text-gray-700">{msg.message}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
