import { useState } from 'react';

// Simple expand/collapse FAQ list — used on the Destination detail page.
// Not tied to any content type: just { id, question, answer } items.
export default function FaqAccordion({ items }) {
  const [openId, setOpenId] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
      {items.map((it) => {
        const isOpen = openId === it.id;
        return (
          <div key={it.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : it.id)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              {it.question}
              <span className="flex-shrink-0 text-gray-400">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="whitespace-pre-line px-4 pb-4 text-sm text-gray-600">{it.answer}</div>}
          </div>
        );
      })}
    </div>
  );
}
