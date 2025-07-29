import { useNavigate } from 'react-router-dom';
import Signup from '@/components/auth/Signup';

const SignupPage = () => {
  const navigate = useNavigate();

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return <Signup onSwitchToLogin={handleSwitchToLogin} />;
};

export default SignupPage;