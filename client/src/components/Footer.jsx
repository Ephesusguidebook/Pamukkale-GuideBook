export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} TurRota. Tüm hakları saklıdır.</p>
          <a href="/admin/giris" className="text-gray-400 hover:text-teal-700">
            Yönetici Girişi
          </a>
        </div>
      </div>
    </footer>
  );
}
