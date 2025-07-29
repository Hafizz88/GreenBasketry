import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Heart, Plus, X, ArrowLeft, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  name: string;
  email: string;
  phone: string;
  points_earned: number;
  points_used: number;
}

interface Address {
  address_id: number;
  address_line: string;
  thana_name: string;
  postal_code?: string;
  is_default?: boolean;
}

interface WishlistItem {
  wishlist_id: number;
  product_id: number;
  name: string;
  price: number;
}

interface Thana {
  id: number;
  thana_name: string;
}

const CustomerProfilePage = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_line: '',
    thana_name: '',
    postal_code: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [changingPassword, setChangingPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const customerId = localStorage.getItem('userId');

  // Password validation
  const validatePasswordChange = () => {
    const errors: {[key: string]: string} = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters long';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordChange()) {
      return;
    }

    setChangingPassword(true);
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast({
          title: "Authentication Failed",
          description: "Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await axios.put(
        `http://localhost:5001/api/customers/${customerId}/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        authHeader
      );

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePasswordForm(false);
      setPasswordErrors({});

    } catch (err: any) {
      console.error('Failed to change password', err);
      const errorMessage = err.response?.data?.error || "Failed to change password. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  useEffect(() => {
    if (!customerId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your profile.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          toast({
            title: "Authentication Failed",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Fetch customer data
        const customerRes = await axios.get(`http://localhost:5001/api/customers/${customerId}`, authHeader);
        setCustomer(customerRes.data);

        // Fetch addresses
        const addressRes = await axios.get(`http://localhost:5001/api/customers/${customerId}/addresses`, authHeader);
        setAddresses(addressRes.data);

        // Fetch wishlist
        const wishlistRes = await axios.get(`http://localhost:5001/api/wishlist?customer_id=${customerId}`, authHeader);
        setWishlist(wishlistRes.data);

        // Fetch thanas
        const thanasRes = await axios.get('http://localhost:5001/api/thanas', authHeader);
        if (thanasRes.data && thanasRes.data.thanas) {
          setThanas(thanasRes.data.thanas);
        } else if (Array.isArray(thanasRes.data)) {
          setThanas(thanasRes.data);
        } else {
          setThanas([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        if (err.response?.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate('/login');
        } else {
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [customerId, navigate]);

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast({
          title: "Authentication Required",
          description: "Please log in again.",
          variant: "destructive",
        });
        return;
      }

      await axios.delete(`http://localhost:5001/api/wishlist`, {
        ...authHeader,
        data: {
          customer_id: customerId,
          product_id: productId
        }
      });

      setWishlist(prev => prev.filter(item => item.product_id !== productId));
      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist.",
      });
    } catch (err: any) {
      console.error("Failed to remove item from wishlist", err);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist.",
        variant: "destructive",
      });
    }
  };

  const handleAddressChange = (name: string, value: string) => {
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAddress.address_line.trim() || !newAddress.thana_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast({
          title: "Authentication Required",
          description: "Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const response = await axios.post(`http://localhost:5001/api/customers/${customerId}/addresses`, {
        customer_id: customerId,
        address_line: newAddress.address_line.trim(),
        thana_name: newAddress.thana_name.trim(),
        postal_code: newAddress.postal_code.trim(),
        is_default: true
      }, authHeader);

      setAddresses(prev => [...prev, response.data]);
      setNewAddress({ address_line: '', thana_name: '', postal_code: '' });
      setShowAddAddressForm(false);

      toast({
        title: "Address Added",
        description: "Your address has been added successfully.",
      });
    } catch (err: any) {
      console.error('Failed to add address', err);
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground">Profile not found.</p>
            <Button onClick={() => navigate('/home')} className="mt-4">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/home')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card className="shadow-card-hover border-0 bg-gradient-card">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-foreground">{customer.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-foreground">{customer.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <p className="text-foreground">{customer.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Points Earned</Label>
                  <Badge variant="secondary" className="mt-1">
                    {customer.points_earned} pts
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Points Used</Label>
                  <Badge variant="outline" className="mt-1">
                    {customer.points_used} pts
                  </Badge>
                </div>
              </div>
              <div className="pt-4">
                <Dialog open={showChangePasswordForm} onOpenChange={setShowChangePasswordForm}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                          className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                          placeholder="Enter your current password"
                        />
                        {passwordErrors.currentPassword && (
                          <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                          className={passwordErrors.newPassword ? 'border-red-500' : ''}
                          placeholder="Minimum 8 characters"
                        />
                        {passwordErrors.newPassword && (
                          <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                          className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                          placeholder="Confirm your new password"
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowChangePasswordForm(false);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            });
                            setPasswordErrors({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={changingPassword}>
                          {changingPassword ? 'Changing Password...' : 'Change Password'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card className="shadow-card-hover border-0 bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Addresses</CardTitle>
                    <CardDescription>Manage your delivery addresses</CardDescription>
                  </div>
                </div>
                <Dialog open={showAddAddressForm} onOpenChange={setShowAddAddressForm}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Address</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAddress} className="space-y-4">
                      <div>
                        <Label htmlFor="address_line">Address Line *</Label>
                        <Input
                          id="address_line"
                          value={newAddress.address_line}
                          onChange={(e) => handleAddressChange('address_line', e.target.value)}
                          placeholder="Enter your address"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="thana_name">Thana *</Label>
                        <Select 
                          value={newAddress.thana_name} 
                          onValueChange={(value) => handleAddressChange('thana_name', value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a Thana" />
                          </SelectTrigger>
                          <SelectContent>
                            {thanas.map((thana) => (
                              <SelectItem key={thana.id} value={thana.thana_name}>
                                {thana.thana_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={newAddress.postal_code}
                          onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                          placeholder="Enter postal code (optional)"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddAddressForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Save Address</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No addresses found.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr.address_id} className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium">
                        {addr.address_line}, {addr.thana_name}
                        {addr.postal_code && ` (${addr.postal_code})`}
                      </p>
                      {addr.is_default && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wishlist */}
        <Card className="mt-6 shadow-card-hover border-0 bg-gradient-card">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Wishlist</CardTitle>
                <CardDescription>Your favorite items</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {wishlist.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No items in wishlist.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlist.map((item) => (
                  <div key={item.wishlist_id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-primary font-semibold">৳{Number(item.price || 0).toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromWishlist(item.product_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerProfilePage;