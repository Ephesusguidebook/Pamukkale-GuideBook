import { useRef, useState } from 'react';
import api from '../api';

export default function ImageUploader({ images, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push({ url: res.data.url });
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload image.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
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

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div
            key={img.url + idx}
            className="relative h-24 w-32 overflow-hidden rounded-lg border border-gray-200"
          >
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 px-1 py-0.5 text-[10px] text-white">
              <button type="button" onClick={() => moveImage(idx, -1)}>◀</button>
              <button type="button" onClick={() => removeImage(idx)} className="text-red-300">
                Remove
              </button>
              <button type="button" onClick={() => moveImage(idx, 1)}>▶</button>
            </div>
          </div>
        ))}
        <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-teal-500 hover:text-teal-600">
          {uploading ? 'Uploading...' : '+ Add Image'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-400">The first image is used as the cover photo.</p>
    </div>
  );
}
