import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import greenbasketryHero from '../../assets/greenbasketry-hero.png';
import logo from '@/assets/logo.png';

interface Thana {
  id?: string | number;
  _id?: string | number;
  thana_name?: string;
  name?: string;
  title?: string;
}

const Signup = ({ onClose, onSwitchToLogin })=>{
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
    address_line: '',
    thana_name: '',
    postal_code: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [thanasLoading, setThanasLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchThanas = async () => {
      try {
        setThanasLoading(true);
        const res = await fetch('http://localhost:5001/api/thanas');
        const data = await res.json();
        
        if (res.ok) {
          let thanasArray: Thana[] = [];
          if (Array.isArray(data)) {
            thanasArray = data;
          } else if (data.thanas && Array.isArray(data.thanas)) {
            thanasArray = data.thanas;
          } else if (data.data && Array.isArray(data.data)) {
            thanasArray = data.data;
          }
          setThanas(thanasArray);
        } else {
          throw new Error(data.error || 'Failed to fetch thanas');
        }
      } catch (err) {
        console.error('Failed to fetch thanas', err);
        toast({
          title: "Warning",
          description: "Unable to load location data. You can still sign up.",
        });
      } finally {
        setThanasLoading(false);
      }
    };
    
    fetchThanas();
  }, [toast]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{11}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 11 digits';
    } else if (/[a-zA-Z]/.test(formData.phone)) {
      newErrors.phone = 'Phone number cannot contain letters';
    }

    // Address validation
    if (!formData.address_line.trim()) {
      newErrors.address_line = 'Address is required';
    }

    // Thana validation
    if (!formData.thana_name.trim()) {
      newErrors.thana_name = 'Please select your area';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Sending signup data:', formData);
      const response = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (response.ok) {
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
          title: "Success!",
          description: "Account created successfully. Redirecting to your dashboard...",
        });

        // Navigate to customer home page
        setTimeout(() => {
          window.location.href = '/home';
        }, 1000);
      } else {
        console.error('Signup failed:', data);
        toast({
          title: "Error",
          description: data.error || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error during signup:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-green-50 items-center justify-center relative overflow-hidden">
        <div className="relative w-full h-full">
          <img 
            src={greenbasketryHero} 
            alt="GreenBasketry Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h2 className="text-3xl font-bold mb-2">স্বাচ্ছন্দ্যে</h2>
            <p className="text-xl">কিনাকাটায় আজি অ্যাকাউন্ট তৈরি করুন</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="Logo" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-2">Join GreenBasketry today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-red-500' : ''}
                placeholder="Minimum 8 characters"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'border-red-500' : ''}
                placeholder="11 digits (e.g., 01712345678)"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="address_line">Address</Label>
              <Input
                id="address_line"
                type="text"
                value={formData.address_line}
                onChange={(e) => handleInputChange('address_line', e.target.value)}
                className={errors.address_line ? 'border-red-500' : ''}
                placeholder="Enter your full address"
              />
              {errors.address_line && <p className="text-red-500 text-sm mt-1">{errors.address_line}</p>}
            </div>

            <div>
              <Label htmlFor="thana_name">Thana/Area</Label>
              <Select 
                value={formData.thana_name} 
                onValueChange={(value) => handleInputChange('thana_name', value)}
                disabled={thanasLoading}
              >
                <SelectTrigger className={errors.thana_name ? 'border-red-500' : ''}>
                  <SelectValue placeholder={
                    thanasLoading ? "Loading areas..." : 
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
              {errors.thana_name && <p className="text-red-500 text-sm mt-1">{errors.thana_name}</p>}
            </div>

            <div>
              <Label htmlFor="postal_code">Postal Code (Optional)</Label>
              <Input
                id="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="Enter postal code"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;