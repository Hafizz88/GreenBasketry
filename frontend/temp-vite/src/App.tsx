import React, { useState } from 'react';
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

const queryClient = new QueryClient();

const App = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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
                <ProtectedRoute>
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
                <ProtectedRoute>
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
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="coupons" element={<ManageCoupons />} />
              <Route path="set-discount" element={<SetDiscount />} />
              <Route path="complaints" element={<ComplaintsAdminPage />} />
              <Route path="cancelled-orders" element={<CancelledOrdersPage />} />
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
                <Login 
                  onClose={handleCloseAuth}
                  onSwitchToSignup={handleSwitchToSignup}
                />
              ) : (
                <Signup 
                  onClose={handleCloseAuth}
                  onSwitchToLogin={handleSwitchToLogin}
                />
              )}
            </DialogContent>
          </Dialog>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;