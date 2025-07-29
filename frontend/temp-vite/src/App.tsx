import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CartPage from "./pages/CartPage";
import ProfilePage from "./pages/ProfilePage";
import ProductsPage from "./pages/ProductsPage";
import CustomerProfilePage from "./pages/CustomerProfilePage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import VoucherSummaryPage from "./pages/VoucherSummaryPage";
import NotFound from "./pages/NotFound";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AdminDashboard from "./pages/AdminDashboard";
import ManageProducts from "./pages/ManageProducts";
import AddProduct from "./pages/AddProduct";
import ManageCoupons from "./pages/ManageCoupons";
import SetDiscount from "./pages/SetDiscount";
import DashboardHome from "./pages/DashboardHome";
import RiderHome from "./pages/RiderHome";
import ProductDetails from "./pages/ProductDetails";
import ComplaintsPage from "./pages/ComplaintsPage";
import ComplaintsAdminPage from "./pages/ComplaintsAdminPage";
import CancelledOrdersPage from './pages/CancelledOrdersPage';
import OrderStatusPage from './pages/OrderStatusPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import CancellableOrdersPage from './pages/CancellableOrdersPage';
import ProtectedRoute from "./components/ProtectedRoute";
import ManageRiders from './pages/ManageRiders';
import ManageAdmins from './pages/ManageAdmins';
import AdminActivityLogs from "./pages/AdminActivityLogs";
import RiderStats from './pages/RiderStats';
import { isAuthenticated } from './utils/auth';
import EditProduct from "./pages/EditProduct";
import SalesReport from "./pages/SalesReport";

const queryClient = new QueryClient();

const App = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Periodic token check to prevent unexpected logouts
  useEffect(() => {
    const checkToken = async () => {
      if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:5001/api/auth/verify-token', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.status === 401 || response.status === 403) {
            // Only log out if the backend says the token is invalid/expired
            window.location.href = '/login';
          }
          // If response is 500 or network error, do NOT log out
        }
      } catch (error) {
        // Network error: do NOT log out, maybe show a warning or retry later
        console.warn('Network error during token validation. Will retry later.');
      }
    };

    const interval = setInterval(checkToken, 5 * 60 * 1000);
    const handleFocus = () => { checkToken(); };
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleShowAuth = () => {
    setShowAuth(true);
    setAuthMode('login');
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const handleSwitchToSignup = () => {
    setAuthMode('signup');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute requiredRole="customer">
                  <HomePage onShowAuth={handleShowAuth} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <CustomerProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer-profile"
              element={
                <ProtectedRoute>
                  <CustomerProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-success"
              element={
                <ProtectedRoute>
                  <OrderSuccessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voucher-summary"
              element={
                <ProtectedRoute>
                  <VoucherSummaryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/home"
              element={
                <ProtectedRoute requiredRole="rider">
                  <RiderHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product/:id"
              element={
                <ProtectedRoute>
                  <ProductDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints"
              element={
                <ProtectedRoute>
                  <ComplaintsPage customerId={Number(localStorage.getItem('userId'))} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-status/:orderId"
              element={
                <ProtectedRoute>
                  <OrderStatusPage />
                </ProtectedRoute>
              }
            />
                          <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <CustomerOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cancellable-orders"
                element={
                  <ProtectedRoute>
                    <CancellableOrdersPage />
                  </ProtectedRoute>
                }
              />
            {/* Admin Dashboard and subpages */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="products/:id/edit" element={<EditProduct />} />
              <Route path="sales-report" element={<SalesReport />} />
              <Route path="coupons" element={<ManageCoupons />} />
              <Route path="set-discount" element={<SetDiscount />} />
              <Route path="complaints" element={<ComplaintsAdminPage />} />
              <Route path="cancelled-orders" element={<CancelledOrdersPage />} />
              <Route path="manage-riders" element={<ManageRiders />} />
              <Route path="manage-admins" element={<ManageAdmins />} />
              <Route path="activity-logs" element={<AdminActivityLogs />} />
              <Route path="rider-stats" element={<RiderStats />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Dialog open={showAuth} onOpenChange={setShowAuth}>
            <DialogContent className="p-0 max-w-5xl w-full h-[90vh] overflow-auto border-0">
              {/* Accessibility: Add DialogTitle and DialogDescription (visually hidden) */}
              <DialogTitle style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </DialogTitle>
              <DialogDescription style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                {authMode === 'login'
                  ? 'Sign in to your account to continue shopping.'
                  : 'Create an account to start shopping with GreenBasketry.'}
              </DialogDescription>
              <div style={{ display: 'none' }}>
                <span id="auth-dialog-title">{authMode === 'login' ? 'Sign In' : 'Sign Up'}</span>
                <span id="auth-dialog-desc">{authMode === 'login' ? 'Sign in to your account to continue shopping.' : 'Create an account to start shopping with GreenBasketry.'}</span>
              </div>
              {authMode === 'login' ? (
                <Login />
              ) : (
                <Signup />
              )}
            </DialogContent>
          </Dialog>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;