// Simple repeatable Question/Answer list editor for a page's FAQ section —
// same shape/pattern as ItineraryEditor, reused by Admin > Destinations
// (and any future content type that wants an FAQ block).
export default function FaqEditor({ items, onChange }) {
  function updateItem(idx, field, value) {
    onChange(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    onChange([...items, { question: '', answer: '' }]);
  }

  function removeItem(idx) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <div key={idx} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="label">Question</label>
              <input
                className="input"
                placeholder="e.g. What's the best time to visit?"
                value={it.question}
                onChange={(e) => updateItem(idx, 'question', e.target.value)}
              />
            </div>
            <button type="button" onClick={() => removeItem(idx)} className="btn-danger !px-3 !py-2 text-xs">
              Remove
            </button>
          </div>
          <div>
            <label className="label">Answer</label>
            <textarea
              className="input"
              rows={2}
              value={it.answer}
              onChange={(e) => updateItem(idx, 'answer', e.target.value)}
            />
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className="btn-secondary">
        + Add FAQ Item
      </button>
    </div>
  );
}
