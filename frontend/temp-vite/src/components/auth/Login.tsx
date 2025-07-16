import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import heroImage from '@/assets/hero-grocery.jpg';
import logo from '@/assets/logo.png';

interface LoginProps {
  onClose?: () => void;
  onSwitchToSignup?: () => void;
}

interface UserObject {
  email: string;
  role: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user?: {
    admin_id?: string;
    rider_id?: string;
    customer_id?: string;
  };
  userId: string;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onClose, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);

    try {
      let url = '';
      let body;

      // Decide the URL based on the selected role
      if (role === 'admin') {
        url = 'http://localhost:5000/api/auth/admin/login';
        body = { email, password };
      } else {
        url = 'http://localhost:5000/api/auth/login';
        body = { email, password, role };
      }

      console.log('Request URL:', url); // Debugging Step
      console.log('Request Body:', body); // Debugging Step

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: LoginResponse = await res.json();

      if (res.ok) {
        if (!data.token) {
          toast({
            title: "Login Failed",
            description: "No token received from server.",
            variant: "destructive",
          });
          return;
        }
        let userId;
        if (role === 'admin') {
          userId = data.user?.admin_id;
        } else if (role === 'rider') {
          userId = data.user?.rider_id;
        } else {
          userId = data.user?.customer_id;
        }

        // Create user object with available data
        let userObject: UserObject;
        if (role === 'rider') {
          userObject = {
            email: email,
            role: role,
            rider_id: userId
          } as any;
        } else {
          userObject = {
            email: email,
            role: role,
          };
        }

        // Save values to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userObject));
        localStorage.setItem('role', role);
        if (userId) {
          localStorage.setItem('userId', String(userId));
        } else if (data.userId) {
          localStorage.setItem('userId', String(data.userId));
        }

        console.log('LocalStorage after login:', localStorage); // Debugging Step

        // Show success toast
        toast({
          title: "Login Successful!",
          description: `Welcome back! Redirecting to your dashboard...`,
        });

        // Redirect after a short delay to allow user experience
        setTimeout(() => {
          if (role === 'admin') {
            navigate('/admin/dashboard');
          } else if (role === 'rider') {
            navigate('/rider/home');
          } else {
            navigate('/home');
          }
          onClose?.();
        }, 1000);
      } else {
        // Show error toast if login fails
        toast({
          title: "Login Failed",
          description: data.error || 'Login failed',
          variant: "destructive",
        });
      }
    } catch (err) {
      // Handle connection error
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-4xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:block relative">
          <div className="relative overflow-hidden rounded-2xl shadow-card-hover">
            <img 
              src={heroImage} 
              alt="Fresh groceries" 
              className="w-full h-[600px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
            <div className="absolute bottom-8 left-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Fresh & Organic</h2>
              <p className="text-lg opacity-90">Quality groceries delivered to your door</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="shadow-card-hover border-0 bg-gradient-card">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <img src={logo} alt="GreenBasketry" className="w-12 h-12 mr-3" />
                <div className="text-2xl font-bold text-primary">GreenBasketry</div>
              </div>
              <CardTitle className="text-2xl">Welcome Back!</CardTitle>
              <CardDescription>
                Sign in to your account to continue shopping
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="rider">Delivery Rider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11" 
                  disabled={loading}
                  variant="default"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  {onSwitchToSignup ? (
                    <button
                      type="button"
                      onClick={onSwitchToSignup}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up here
                    </button>
                  ) : (
                    <Link to="/signup" className="text-primary hover:underline font-medium">
                      Sign up here
                    </Link>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
