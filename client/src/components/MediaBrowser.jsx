import { useEffect, useRef, useState } from 'react';
import api from '../api';

// Shared Media Library browser: folder navigation + upload + delete.
// Used both as the full management screen (Admin > Media) and, in
// `selectable` mode, inside MediaPickerModal for choosing gallery images.
export default function MediaBrowser({ selectable = false, multiple = true, onConfirm }) {
  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    loadItems(currentFolderId);
    setSelectedIds([]);
  }, [currentFolderId]);

  function loadFolders() {
    return api
      .get('/admin/media/folders')
      .then((res) => setFolders(res.data))
      .catch(() => setError('Could not load folders.'));
  }

  function loadItems(folderId) {
    setLoading(true);
    return api
      .get('/admin/media/items', { params: { folder_id: folderId || 'root' } })
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load photos.'))
      .finally(() => setLoading(false));
  }

  async function handleUpload(files) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      formData.append('folder_id', currentFolderId || 'root');
      const res = await api.post('/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.errors && res.data.errors.length) {
        setError(`Some files failed: ${res.data.errors.join(', ')}`);
      }
      await loadItems(currentFolderId);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function createFolder(e) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await api.post('/admin/media/folders', { name, parent_id: currentFolderId || 'root' });
      setNewFolderName('');
      setNewFolderOpen(false);
      await loadFolders();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create folder.');
    }
  }

  async function deleteFolder(id) {
    if (!confirm('Delete this folder? It must be empty (no photos or subfolders).')) return;
    try {
      await api.delete(`/admin/media/folders/${id}`);
      await loadFolders();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete folder.');
    }
  }

  async function deleteItem(id) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/media/items/${id}`);
      await loadItems(currentFolderId);
    } catch {
      setError('Could not delete photo.');
    }
  }

  function toggleSelect(item) {
    if (!selectable) return;
    if (!multiple) {
      onConfirm && onConfirm([item]);
      return;
    }
    setSelectedIds((ids) =>
      ids.includes(item.id) ? ids.filter((i) => i !== item.id) : [...ids, item.id]
    );
  }

  function confirmSelection() {
    const chosen = items.filter((i) => selectedIds.includes(i.id));
    onConfirm && onConfirm(chosen);
  }

  const subfolders = folders.filter((f) => (f.parent_id || null) === (currentFolderId || null));

  // Breadcrumb: walk up parent_id chain from the current folder.
  const crumbs = [];
  let cursor = currentFolderId ? folders.find((f) => f.id === currentFolderId) : null;
  while (cursor) {
    crumbs.unshift(cursor);
    cursor = cursor.parent_id ? folders.find((f) => f.id === cursor.parent_id) : null;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <button
          type="button"
          className="hover:text-teal-700"
          onClick={() => setCurrentFolderId(null)}
        >
          Media Library
        </button>
        {crumbs.map((c) => (
          <span key={c.id} className="flex items-center gap-1">
            <span>/</span>
            <button
              type="button"
              className="hover:text-teal-700"
              onClick={() => setCurrentFolderId(c.id)}
            >
              {c.name}
            </button>
          </span>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="btn-secondary cursor-pointer !py-1.5 text-xs">
          {uploading ? 'Uploading...' : '+ Upload Photos'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary !py-1.5 text-xs"
          onClick={() => setNewFolderOpen((v) => !v)}
        >
          + New Folder
        </button>
        {newFolderOpen && (
          <form onSubmit={createFolder} className="flex items-center gap-2">
            <input
              autoFocus
              className="input !w-auto !py-1.5 text-xs"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button type="submit" className="btn-primary !py-1.5 text-xs">
              Create
            </button>
          </form>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {subfolders.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {subfolders.map((f) => (
            <div
              key={f.id}
              className="group flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <button
                type="button"
                className="flex items-center gap-1.5 text-gray-700 hover:text-teal-700"
                onClick={() => setCurrentFolderId(f.id)}
              >
                📁 {f.name}
              </button>
              <button
                type="button"
                onClick={() => deleteFolder(f.id)}
                className="ml-1 text-gray-300 hover:text-red-500"
                title="Delete folder"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : items.length === 0 && subfolders.length === 0 ? (
        <p className="text-sm text-gray-400">No photos here yet. Upload some to get started.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">No photos in this folder yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item)}
                className={`group relative h-28 overflow-hidden rounded-lg border bg-gray-50 ${
                  selectable ? 'cursor-pointer' : ''
                } ${isSelected ? 'border-teal-600 ring-2 ring-teal-500' : 'border-gray-200'}`}
              >
                <img src={item.url} alt="" className="h-full w-full object-cover" />
                {selectable && multiple && (
                  <div
                    className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white ${
                      isSelected ? 'border-teal-600 bg-teal-600' : 'border-white bg-black/30'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                )}
                {!selectable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectable && multiple && (
        <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-500">{selectedIds.length} selected</span>
          <button
            type="button"
            className="btn-primary !py-1.5 text-xs"
            disabled={selectedIds.length === 0}
            onClick={confirmSelection}
          >
            Add Selected
          </button>
        </div>
      )}
    </div>
  );
}
