import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
            <Route path="/" element={<Index onShowAuth={handleShowAuth} />} />
            <Route path="/home" element={<HomePage onShowAuth={handleShowAuth} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<CustomerProfilePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/customer-profile" element={<CustomerProfilePage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/voucher-summary" element={<VoucherSummaryPage />} />
            <Route path="/rider/home" element={<RiderHome />} />
            {/* Admin Dashboard and subpages */}
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="coupons" element={<ManageCoupons />} />
              <Route path="set-discount" element={<SetDiscount />} />
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