// v4
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Layout } from './components/layout/Layout';
import {
  Wishlist, TrackOrder,
  About, Blog, BlogPost, Register, ForgotPassword,
  ContactUs, ExchangePolicy, SizeGuide, PaymentMethods,
  PrivacyPolicy, TermsOfService, NotFound,
} from './pages/stubs';

// Defense-in-depth: email check (from trusted Google OAuth) + Supabase DB role check.
// Both must pass. Neither alone is sufficient.
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string) || 'starkbuypk@gmail.com';

const Home = lazy(() => import('./pages/Home'));
const Collections = lazy(() => import('./pages/Collections'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, isAdminLoading } = useAuth();
  if (loading || isAdminLoading) return null;
  if (!user || user.email !== ADMIN_EMAIL || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 32,
        height: 32,
        border: '2px solid rgba(26,22,20,0.12)',
        borderTop: '2px solid var(--luna-1)',
        borderRadius: '50%',
        animation: 'spin 600ms linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
                <Route path="collections" element={<Suspense fallback={<PageLoader />}><Collections /></Suspense>} />
                <Route path="collections/:category" element={<Suspense fallback={<PageLoader />}><Collections /></Suspense>} />
                <Route path="product/:slug" element={<Suspense fallback={<PageLoader />}><ProductDetail /></Suspense>} />
                <Route path="checkout" element={<Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense>} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="track-order" element={<TrackOrder />} />
                <Route path="account" element={<Suspense fallback={<PageLoader />}><AccountPage /></Suspense>} />
                <Route path="about" element={<About />} />
                <Route path="blog" element={<Blog />} />
                <Route path="blog/:slug" element={<BlogPost />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="support/contact-us" element={<ContactUs />} />
                <Route path="support/exchange-policy" element={<ExchangePolicy />} />
                <Route path="support/size-guide" element={<SizeGuide />} />
                <Route path="support/payment-methods" element={<PaymentMethods />} />
                <Route path="legal/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="legal/terms-of-service" element={<TermsOfService />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              {/* Admin & Login — outside main layout, full-screen */}
              <Route path="admin/*" element={<AdminRoute><Suspense fallback={<PageLoader />}><Admin /></Suspense></AdminRoute>} />
              <Route path="login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
