import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './AdminAuthContext';
import { AgencyAuthProvider } from './AgencyAuthContext';
import { PageContentProvider } from './PageContentContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import FaviconSetter from './components/FaviconSetter';
import PageviewTracker from './components/PageviewTracker';
import AdminLayout from './components/AdminLayout';
import AgencyLayout from './components/AgencyLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAgencyRoute from './components/ProtectedAgencyRoute';
import { TOURS_ADMIN_CATEGORY } from './lib/tourRouting';

import Home from './pages/Home';
import Tours from './pages/Tours';
import Transfer from './pages/Transfer';
import TransferDetail from './pages/TransferDetail';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import Destinations from './pages/Destinations';
import DestinationDetail from './pages/DestinationDetail';
import Attractions from './pages/Attractions';
import AttractionDetail from './pages/AttractionDetail';
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
import AdminTransferList from './pages/admin/AdminTransferList';
import AdminTransferForm from './pages/admin/AdminTransferForm';
import AdminBlogList from './pages/admin/AdminBlogList';
import AdminBlogForm from './pages/admin/AdminBlogForm';
import AdminDestinationList from './pages/admin/AdminDestinationList';
import AdminDestinationForm from './pages/admin/AdminDestinationForm';
import AdminAttractionList from './pages/admin/AdminAttractionList';
import AdminAttractionForm from './pages/admin/AdminAttractionForm';
import AdminAgencyList from './pages/admin/AdminAgencyList';
import AdminAgencyForm from './pages/admin/AdminAgencyForm';
import Messages from './pages/admin/Messages';
import Settings from './pages/admin/Settings';
import PageContent from './pages/admin/PageContent';
import AdminMedia from './pages/admin/AdminMedia';
import AdminRedirects from './pages/admin/AdminRedirects';
import AdminLogs from './pages/admin/AdminLogs';
import AdminTraffic from './pages/admin/AdminTraffic';
import AdminSiteFiles from './pages/admin/AdminSiteFiles';

import AgencyLogin from './pages/agency/AgencyLogin';
import AgencyHome from './pages/agency/AgencyHome';
import AgencyTours from './pages/agency/AgencyTours';
import AgencyBookings from './pages/agency/AgencyBookings';
import AgencyLedger from './pages/agency/AgencyLedger';
import AgencySettings from './pages/agency/AgencySettings';

function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageviewTracker />
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
      <AgencyAuthProvider>
      <PageContentProvider>
      <FaviconSetter />
      <Routes>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />

        <Route path="/tours" element={<PublicLayout><Tours /></PublicLayout>} />
        <Route path="/tours/:seg1" element={<PublicLayout><Tours /></PublicLayout>} />
        <Route path="/tours/:seg1/:seg2" element={<PublicLayout><Tours /></PublicLayout>} />

        <Route path="/transfer" element={<PublicLayout><Transfer /></PublicLayout>} />
        <Route path="/transfer/:slug" element={<PublicLayout><TransferDetail /></PublicLayout>} />

        <Route path="/blog" element={<PublicLayout><BlogList /></PublicLayout>} />
        <Route path="/blog/:slug" element={<PublicLayout><BlogDetail /></PublicLayout>} />

        <Route path="/destinations" element={<PublicLayout><Destinations /></PublicLayout>} />
        <Route path="/destinations/:slug" element={<PublicLayout><DestinationDetail /></PublicLayout>} />

        <Route path="/attraction" element={<PublicLayout><Attractions /></PublicLayout>} />
        <Route path="/attraction/:slug" element={<PublicLayout><AttractionDetail /></PublicLayout>} />

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

          <Route path="tours" element={<AdminCategoryList category={TOURS_ADMIN_CATEGORY} />} />
          <Route path="tours/:id" element={<AdminCategoryForm category={TOURS_ADMIN_CATEGORY} />} />

          <Route path="transfers" element={<AdminTransferList />} />
          <Route path="transfers/:id" element={<AdminTransferForm />} />

          <Route path="blog" element={<AdminBlogList />} />
          <Route path="blog/:id" element={<AdminBlogForm />} />

          <Route path="destinations" element={<AdminDestinationList />} />
          <Route path="destinations/:id" element={<AdminDestinationForm />} />

          <Route path="attractions" element={<AdminAttractionList />} />
          <Route path="attractions/:id" element={<AdminAttractionForm />} />

          <Route path="agencies" element={<AdminAgencyList />} />
          <Route path="agencies/:id" element={<AdminAgencyForm />} />

          <Route path="messages" element={<Messages />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="redirects" element={<AdminRedirects />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="traffic" element={<AdminTraffic />} />
          <Route path="site-files" element={<AdminSiteFiles />} />
          <Route path="settings" element={<Settings />} />
          <Route path="page-content" element={<PageContent />} />
        </Route>

        <Route path="/agency/login" element={<AgencyLogin />} />
        <Route
          path="/agency"
          element={
            <ProtectedAgencyRoute>
              <AgencyLayout />
            </ProtectedAgencyRoute>
          }
        >
          <Route index element={<AgencyHome />} />
          <Route path="tours" element={<AgencyTours />} />
          <Route path="bookings" element={<AgencyBookings />} />
          <Route path="ledger" element={<AgencyLedger />} />
          <Route path="settings" element={<AgencySettings />} />
        </Route>

        <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
      </Routes>
      </PageContentProvider>
      </AgencyAuthProvider>
    </AdminAuthProvider>
  );
}
