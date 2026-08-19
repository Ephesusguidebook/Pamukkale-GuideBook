import { Link } from 'react-router-dom';
import { CATEGORY_LIST } from '../lib/categories';
import SocialLinks from './SocialLinks';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="mb-2 font-semibold text-gray-800">Tours</p>
            <ul className="space-y-1.5">
              {CATEGORY_LIST.map((category) => (
                <li key={category.key}>
                  <Link to={category.publicPath} className="hover:text-teal-700">
                    {category.pluralLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-gray-800">Company</p>
            <ul className="space-y-1.5">
              <li>
                <Link to="/about-us" className="hover:text-teal-700">About Us</Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-teal-700">Blog</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-teal-700">Contact</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-teal-700">FAQ</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-gray-800">Legal</p>
            <ul className="space-y-1.5">
              <li>
                <Link to="/terms-and-conditions" className="hover:text-teal-700">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-teal-700">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
          <p>© {new Date().getFullYear()} TurRota. All rights reserved.</p>
          <SocialLinks />
          <a href="/admin/login" className="text-gray-400 hover:text-teal-700">
            Admin Login
          </a>
        </div>
      </div>
    </footer>
  );
}
