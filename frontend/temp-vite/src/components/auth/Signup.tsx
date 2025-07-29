import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Car, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import greenbasketryHero from '../../assets/greenbasketry-hero.png';
import logo from '@/assets/logo.png';

interface SignupProps {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  vehicle_info: string;
  address_line: string;
  thana_name: string;
  postal_code: string;
}

interface Thana {
  id?: string | number;
  _id?: string | number;
  thana_name?: string;
  name?: string;
  title?: string;
}

const Signup: React.FC<SignupProps> = ({ onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    vehicle_info: '',
    address_line: '',
    thana_name: '',
    postal_code: ''
  });
  
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thanasLoading, setThanasLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchThanas = async () => {
      try {
        setThanasLoading(true);
        setError(null);
        console.log("🔄 Fetching thanas...");
        
        const res = await fetch('http://localhost:5001/api/thanas');
        console.log("📡 Response status:", res.status);
        console.log("📡 Response ok:", res.ok);
        
        const data = await res.json();
        console.log("📦 Raw response data:", data);
        
        if (res.ok) {
          // Handle different possible response structures
          let thanasArray: Thana[] = [];
          if (Array.isArray(data)) {
            thanasArray = data;
          } else if (data.thanas && Array.isArray(data.thanas)) {
            thanasArray = data.thanas;
          } else if (data.data && Array.isArray(data.data)) {
            thanasArray = data.data;
          }
          
          console.log("📦 Processed thanas array:", thanasArray);
          setThanas(thanasArray);
        } else {
          throw new Error(data.error || 'Failed to fetch thanas');
        }
      } catch (err) {
        console.error('❌ Failed to fetch thanas', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        toast({
          title: "Warning",
          description: "Unable to load location data. You can still sign up as a rider or admin.",
        });
      } finally {
        setThanasLoading(false);
      }
    };
    
    fetchThanas();
  }, [toast]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);

    const {
      name, email, password, phone, role,
      vehicle_info, address_line, thana_name, postal_code
    } = formData;

    // Build request body depending on role
    let body: any = { name, email, password, phone, role };

    if (role === 'rider') {
      body.vehicle_info = vehicle_info;
    } else if (role === 'customer') {
      // Add address info
      body.address_line = address_line;
      body.thana_name = thana_name;
      if (postal_code) body.postal_code = postal_code;
    }

    try {
      const res = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        // Clear all existing auth data first to prevent conflicts
        const roles = ['admin', 'customer', 'rider'];
        roles.forEach(r => {
          localStorage.removeItem(`${r}_token`);
          localStorage.removeItem(`${r}_user`);
          localStorage.removeItem(`${r}_userId`);
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');

        // Store user data in localStorage with consistent structure
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.userId) {
          localStorage.setItem('userId', String(data.userId));
        }
        if (data.role) {
          localStorage.setItem('role', data.role);
        }
        
        console.log('User data saved to localStorage:', {
          userId: data.userId,
          role: data.role,
          user: data.user
        });

        toast({
          title: "Account Created Successfully!",
          description: "Welcome to GreenBasketry! Redirecting to your dashboard...",
        });

        setTimeout(() => {
          if (data.role === 'admin') {
            navigate('/admin');
          } else if (data.role === 'rider') {
            navigate('/rider/home');
          } else {
            navigate('/home');
          }
          onClose?.();
        }, 1000);
      } else {
        toast({
          title: "Signup Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
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
      <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:block relative">
          <div className="relative overflow-hidden rounded-2xl shadow-card-hover">
            <img 
              src={greenbasketryHero} 
              alt="GreenBasketry" 
              className="w-full h-[700px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
            <div className="absolute bottom-8 left-8 text-white">
              <h2 className="text-3xl font-bold mb-2">স্বাচ্ছন্দ্যে কিনাকাটায়, আজই অ্যাকাউন্ট তৈরি করুন</h2>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="shadow-card-hover border-0 bg-gradient-card">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <img src={logo} alt="GreenBasketry" className="w-12 h-12 mr-3" />
                <div className="text-2xl font-bold text-primary">GreenBasketry</div>
              </div>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>
                Join our community for fresh, organic groceries
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
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
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
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

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Role-specific fields */}
                {formData.role === 'rider' && (
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_info">Vehicle Information</Label>
                    <div className="relative">
                      <Car className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="vehicle_info"
                        name="vehicle_info"
                        placeholder="e.g., Motorcycle, Bicycle, Van"
                        value={formData.vehicle_info}
                        onChange={handleInputChange}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                )}

                {formData.role === 'customer' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_line">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address_line"
                          name="address_line"
                          placeholder="Enter your address"
                          value={formData.address_line}
                          onChange={handleInputChange}
                          className="pl-10 h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="thana_name">Thana/Area</Label>
                      <Select 
                        value={formData.thana_name} 
                        onValueChange={(value) => handleChange('thana_name', value)}
                        disabled={thanasLoading}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue placeholder={
                            thanasLoading ? "Loading areas..." : 
                            error ? "Error loading areas" : 
                            thanas.length === 0 ? "No areas available" : 
                            "Select your area"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {thanas.map((thana, index) => {
                            const thanaName = thana.thana_name || thana.name || thana.title || String(thana);
                            const thanaId = thana.id || thana._id || index;
                            return (
                              <SelectItem key={thanaId} value={thanaName}>
                                {thanaName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code (Optional)</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="postal_code"
                          name="postal_code"
                          placeholder="Enter postal code"
                          value={formData.postal_code}
                          onChange={handleInputChange}
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11" 
                  disabled={loading}
                  variant="default"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  {onSwitchToLogin ? (
                    <button
                      type="button"
                      onClick={onSwitchToLogin}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in here
                    </button>
                  ) : (
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Sign in here
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

export default Signup;