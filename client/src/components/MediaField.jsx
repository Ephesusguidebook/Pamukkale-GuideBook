import { useState } from 'react';
import MediaPickerModal from './MediaPickerModal';

// Drop-in replacement for the old ImageUploader. Same `images` / `onChange`
// interface, but images are now chosen from the shared Media Library
// instead of being uploaded ad hoc per form. Pass `multiple={false}` for a
// single-photo field such as a blog cover or the consultant photo.
export default function MediaField({ images, onChange, multiple = true }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleSelect(chosen) {
    const newImages = chosen.map((item) => ({ url: item.url }));
    if (multiple) {
      onChange([...images, ...newImages]);
    } else {
      onChange(newImages.slice(0, 1));
    }
    setPickerOpen(false);
  }

  function removeImage(idx) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function moveImage(idx, dir) {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  const showAddButton = multiple || images.length === 0;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div
            key={img.url + idx}
            className="relative h-24 w-32 overflow-hidden rounded-lg border border-gray-200"
          >
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            {multiple ? (
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 px-1 py-0.5 text-[10px] text-white">
                <button type="button" onClick={() => moveImage(idx, -1)}>◀</button>
                <button type="button" onClick={() => removeImage(idx)} className="text-red-300">
                  Remove
                </button>
                <button type="button" onClick={() => moveImage(idx, 1)}>▶</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5 text-[10px] text-white"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {showAddButton && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-teal-500 hover:text-teal-600"
          >
            + {multiple ? 'Add Image' : 'Choose Image'}
          </button>
        )}
      </div>
      {multiple && (
        <p className="mt-1 text-xs text-gray-400">The first image is used as the cover photo.</p>
      )}

      {pickerOpen && (
        <MediaPickerModal
          multiple={multiple}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
