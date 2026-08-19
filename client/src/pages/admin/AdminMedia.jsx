import MediaBrowser from '../../components/MediaBrowser';

export default function AdminMedia() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Media Library</h1>
      <p className="mb-6 text-sm text-gray-500">
        Upload photos here first, organize them into folders, and pull them into tour, activity
        and blog galleries. Every photo is automatically converted to WebP for faster page loads.
      </p>
      <div className="card p-6">
        <MediaBrowser />
      </div>
    </div>
  );
}
