import React, { useState } from 'react';
import CustomerHome from '@/components/home/CustomerHome';
import Login from '@/components/auth/Login';
import Signup from '@/components/auth/Signup';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface IndexProps {
  onShowAuth?: () => void;
}

const Index: React.FC<IndexProps> = ({ onShowAuth }) => {
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
    <CustomerHome onShowAuth={onShowAuth} />
  );
};

export default Index;
