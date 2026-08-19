import MediaBrowser from './MediaBrowser';

// Full-screen modal wrapper around MediaBrowser in selection mode. Used by
// MediaField whenever the admin clicks "+ Add Image" on a tour/activity
// gallery, blog cover, or the consultant photo field.
export default function MediaPickerModal({ multiple = true, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {multiple ? 'Select Photos' : 'Select a Photo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <MediaBrowser selectable multiple={multiple} onConfirm={onSelect} />
      </div>
    </div>
  );
}
