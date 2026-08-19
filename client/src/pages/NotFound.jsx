import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-500">The page you're looking for could not be found.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to homepage
      </Link>
    </div>
  );
}
