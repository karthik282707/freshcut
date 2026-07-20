import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Suspense, lazy } from 'react';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Layout
import AppLayout from './components/layout/AppLayout';

// Lazy-loaded pages
const CustomerHomePage = lazy(() => import('./pages/customer/CustomerHomePage'));
const CustomerShopDetailPage = lazy(() => import('./pages/customer/CustomerShopDetailPage'));
const CustomerCartPage = lazy(() => import('./pages/customer/CustomerCartPage'));
const CustomerOrdersPage = lazy(() => import('./pages/customer/CustomerOrdersPage'));
const CustomerOrderTrackingPage = lazy(() => import('./pages/customer/CustomerOrderTrackingPage'));

const ButcherDashboardPage = lazy(() => import('./pages/butcher/ButcherDashboardPage'));
const ButcherInventoryPage = lazy(() => import('./pages/butcher/ButcherInventoryPage'));
const ButcherOrdersPage = lazy(() => import('./pages/butcher/ButcherOrdersPage'));

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminShopsPage = lazy(() => import('./pages/admin/AdminShopsPage'));
const AdminMarketPricePage = lazy(() => import('./pages/admin/AdminMarketPricePage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  const map = { 
    customer: '/customer/home', 
    butcher: '/butcher/dashboard', 
    admin: '/admin/dashboard' 
  };
  return <Navigate to={map[user.role] || '/login'} replace />;
}

const Loader = () => <div className="loading-center"><div className="spinner" /></div>;

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<RoleRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer routes */}
              <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><AppLayout /></ProtectedRoute>}>
                <Route path="home" element={<CustomerHomePage />} />
                <Route path="shops/:shopId" element={<CustomerShopDetailPage />} />
                <Route path="cart" element={<CustomerCartPage />} />
                <Route path="orders" element={<CustomerOrdersPage />} />
                <Route path="orders/:orderId" element={<CustomerOrderTrackingPage />} />
                <Route index element={<Navigate to="home" replace />} />
              </Route>

              {/* Butcher routes */}
              <Route path="/butcher" element={<ProtectedRoute allowedRoles={['butcher']}><AppLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<ButcherDashboardPage />} />
                <Route path="inventory" element={<ButcherInventoryPage />} />
                <Route path="orders" element={<ButcherOrdersPage />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="shops" element={<AdminShopsPage />} />
                <Route path="market-prices" element={<AdminMarketPricePage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
