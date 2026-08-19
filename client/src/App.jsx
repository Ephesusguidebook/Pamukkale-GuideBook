import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './AdminAuthContext';
import { PageContentProvider } from './PageContentContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { CATEGORIES } from './lib/categories';

import Home from './pages/Home';
import CategoryList from './pages/CategoryList';
import CategoryDetail from './pages/CategoryDetail';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Faq from './pages/Faq';
import NotFound from './pages/NotFound';

import Login from './pages/admin/Login';
import AdminHome from './pages/admin/AdminHome';
import AdminCategoryList from './pages/admin/AdminCategoryList';
import AdminCategoryForm from './pages/admin/AdminCategoryForm';
import AdminBlogList from './pages/admin/AdminBlogList';
import AdminBlogForm from './pages/admin/AdminBlogForm';
import Messages from './pages/admin/Messages';
import Settings from './pages/admin/Settings';
import PageContent from './pages/admin/PageContent';
import AdminMedia from './pages/admin/AdminMedia';

function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <PageContentProvider>
      <Routes>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />

        <Route
          path={CATEGORIES.packageTours.publicPath}
          element={<PublicLayout><CategoryList category={CATEGORIES.packageTours} /></PublicLayout>}
        />
        <Route
          path={`${CATEGORIES.packageTours.publicPath}/:slug`}
          element={<PublicLayout><CategoryDetail category={CATEGORIES.packageTours} /></PublicLayout>}
        />

        <Route
          path={CATEGORIES.dailyTours.publicPath}
          element={<PublicLayout><CategoryList category={CATEGORIES.dailyTours} /></PublicLayout>}
        />
        <Route
          path={`${CATEGORIES.dailyTours.publicPath}/:slug`}
          element={<PublicLayout><CategoryDetail category={CATEGORIES.dailyTours} /></PublicLayout>}
        />

        <Route
          path={CATEGORIES.activities.publicPath}
          element={<PublicLayout><CategoryList category={CATEGORIES.activities} /></PublicLayout>}
        />
        <Route
          path={`${CATEGORIES.activities.publicPath}/:slug`}
          element={<PublicLayout><CategoryDetail category={CATEGORIES.activities} /></PublicLayout>}
        />

        <Route path="/blog" element={<PublicLayout><BlogList /></PublicLayout>} />
        <Route path="/blog/:slug" element={<PublicLayout><BlogDetail /></PublicLayout>} />

        <Route path="/about-us" element={<PublicLayout><AboutUs /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/terms-and-conditions" element={<PublicLayout><Terms /></PublicLayout>} />
        <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
        <Route path="/faq" element={<PublicLayout><Faq /></PublicLayout>} />

        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />

          <Route
            path={CATEGORIES.packageTours.adminPath.replace('/admin/', '')}
            element={<AdminCategoryList category={CATEGORIES.packageTours} />}
          />
          <Route
            path={`${CATEGORIES.packageTours.adminPath.replace('/admin/', '')}/:id`}
            element={<AdminCategoryForm category={CATEGORIES.packageTours} />}
          />

          <Route
            path={CATEGORIES.dailyTours.adminPath.replace('/admin/', '')}
            element={<AdminCategoryList category={CATEGORIES.dailyTours} />}
          />
          <Route
            path={`${CATEGORIES.dailyTours.adminPath.replace('/admin/', '')}/:id`}
            element={<AdminCategoryForm category={CATEGORIES.dailyTours} />}
          />

          <Route
            path={CATEGORIES.activities.adminPath.replace('/admin/', '')}
            element={<AdminCategoryList category={CATEGORIES.activities} />}
          />
          <Route
            path={`${CATEGORIES.activities.adminPath.replace('/admin/', '')}/:id`}
            element={<AdminCategoryForm category={CATEGORIES.activities} />}
          />

          <Route path="blog" element={<AdminBlogList />} />
          <Route path="blog/:id" element={<AdminBlogForm />} />

          <Route path="messages" element={<Messages />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="settings" element={<Settings />} />
          <Route path="page-content" element={<PageContent />} />
        </Route>

        <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
      </Routes>
      </PageContentProvider>
    </AdminAuthProvider>
  );
}
