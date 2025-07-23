import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, Heart, User, Menu, X, 
  TrendingUp, Grid3X3, Star, Plus, Filter,
  LogOut, MapPin, Bell, Settings, X as CloseIcon, RefreshCw as RefreshIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import heroImage from '@/assets/hero-grocery.jpg';
import { io as socketIOClient, Socket } from 'socket.io-client';

interface Product {
  product_id?: number;
  id?: number;
  name?: string;
  title?: string;
  price: number;
  image?: { url: string };
  image_url?: string;
  thumbnail?: string;
  total_times_purchased?: number;
}

interface CustomerHomeProps {
  onShowAuth?: () => void;
}

const CustomerHome: React.FC<CustomerHomeProps> = ({ onShowAuth }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('categories');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const brandRef = useRef<HTMLSpanElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const isLoggedIn = () => {
    return localStorage.getItem('userId') && localStorage.getItem('token');
  };

  // Animated brand name effect
  useEffect(() => {
    const text = "GreenBasketry";
    let i = 0;
    let timeout: NodeJS.Timeout;
    
    function type() {
      if (brandRef.current) {
        brandRef.current.textContent = text.slice(0, i);
      }
      if (i < text.length) {
        i++;
        timeout = setTimeout(type, 120);
      } else {
        setTimeout(() => {
          i = 0;
          type();
        }, 3000);
      }
    }
    type();
    
    return () => clearTimeout(timeout);
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/products/categories', getAuthHeader());
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch top selling products
  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/products/top-selling?limit=8', getAuthHeader());
        setTopSellingProducts(response.data);
      } catch (error) {
        console.error('Error fetching top selling products:', error);
      }
    };

    fetchTopSellingProducts();
  }, []);

  // Fetch products by category
  useEffect(() => {
    if (selectedCategory) {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:5001/api/products/category/${selectedCategory}`, getAuthHeader());
          setProducts(response.data);
        } catch (error) {
          console.error('Error fetching products:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProducts();
    }
  }, [selectedCategory]);

  // Fetch products by search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const fetchSearchResults = async () => {
        if (searchTerm.trim() === '') {
          setSearchResults([]);
          return;
        }

        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:5001/api/products/search?name=${searchTerm}`, getAuthHeader());
          setSearchResults(response.data);
        } catch (error) {
          console.error('Error fetching search results:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Real-time notifications via socket.io
  useEffect(() => {
    const socket: Socket = socketIOClient('http://localhost:5001');
    const customerId = localStorage.getItem('userId');
    if (customerId) {
      socket.emit('joinCustomerRoom', customerId);
    }
    socket.on('orderAccepted', (data) => {
      toast({
        title: 'Order Accepted',
        description: data.message,
        variant: 'default',
      });
    });
    socket.on('riderArrived', (data) => {
      toast({
        title: 'Rider Arrived',
        description: data.message,
        variant: 'default',
      });
    });
    socket.on('paymentConfirmed', (data) => {
      toast({
        title: 'Delivery Complete! 🎉',
        description: data.message,
        variant: 'default',
      });
    });
    return () => {
      socket.disconnect();
    };
  }, [toast]);

  // Fetch notifications for the customer
  const fetchNotifications = async () => {
    const customerId = localStorage.getItem('userId');
    if (!customerId) return;
    try {
      const response = await axios.get(`http://localhost:5001/api/notifications/customer/${customerId}`);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notification_id: number) => {
    try {
      await axios.patch(`http://localhost:5001/api/notifications/${notification_id}/read`);
      setNotifications((prev) => prev.map(n => n.notification_id === notification_id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const customerId = localStorage.getItem('userId');
      if (!customerId) return;
      await axios.patch(`http://localhost:5001/api/notifications/customer/${customerId}/mark-all-read`);
      setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
      toast({
        title: 'All Notifications Marked as Read',
        description: 'All your notifications have been marked as read.',
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Auto-refresh notifications every 30 seconds when dropdown is open
  useEffect(() => {
    if (!showNotifications) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [showNotifications]);

  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      });
      onShowAuth?.();
      return;
    }

    try {
      const storedCustomerId = localStorage.getItem('userId');
      const customerId = parseInt(storedCustomerId || '0', 10);

      const payload = {
        customer_id: customerId,
        product_id: productId,
        quantity: 1,
      };

      await axios.post('http://localhost:5001/api/cart', payload, getAuthHeader());
      toast({
        title: "Added to Cart!",
        description: "Item has been added to your cart successfully.",
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToWishlist = async (productId: number) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your wishlist.",
        variant: "destructive",
      });
      onShowAuth?.();
      return;
    }

    try {
      const storedCustomerId = localStorage.getItem('userId');
      const customerId = parseInt(storedCustomerId || '0', 10);

      await axios.post('http://localhost:5001/api/wishlist', {
        customer_id: customerId,
        product_id: productId
      }, getAuthHeader());

      toast({
        title: "Added to Wishlist!",
        description: "Item has been added to your wishlist successfully.",
      });
    } catch (err) {
      console.error('Add to wishlist failed', err);
      toast({
        title: "Error",
        description: "Failed to add item to wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm('');
    setSearchResults([]);
    setActiveTab('categories');
    setSidebarOpen(false);
  };

  const handleTopSellingClick = () => {
    setActiveTab('top-selling');
    setSelectedCategory('');
    setSearchTerm('');
    setSearchResults([]);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const getDisplayedProducts = () => {
    if (searchTerm) {
      return searchResults;
    }
    if (activeTab === 'top-selling') {
      return topSellingProducts;
    }
    return products;
  };

  const getMainTitle = () => {
    if (searchTerm) {
      return `Search Results for "${searchTerm}"`;
    }
    if (activeTab === 'top-selling') {
      return 'Top Selling Products 🔥';
    }
    return selectedCategory || 'Welcome to GreenBasketry';
  };

  const displayedProducts = getDisplayedProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <img src={logo} alt="GreenBasketry" className="w-8 h-8" />
                <span className="text-xl font-bold text-primary" ref={brandRef}>
                  GreenBasketry
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for fresh groceries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 h-10 bg-background/60 backdrop-blur-sm border-primary/20 focus:border-primary/40"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 relative">
              {isLoggedIn() ? (
                <>
                  {/* Notification Bell */}
                  <button
                    className="relative p-2 rounded-lg hover:bg-accent transition-colors"
                    onClick={() => setShowNotifications((prev) => !prev)}
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                        {notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </button>
                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-background border rounded-lg shadow-lg z-50 flex flex-col" style={{ marginTop: '350px' }}>
                      <div className="flex items-center justify-between p-4 border-b font-semibold text-lg bg-white rounded-t-lg shadow-sm">
                        <span>Notifications</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={fetchNotifications}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors duration-150"
                            aria-label="Refresh notifications"
                            style={{ border: '1px solid #e5e7eb', outline: 'none', cursor: 'pointer' }}
                          >
                            <RefreshIcon className="h-5 w-5 text-gray-700" />
                          </button>
                          {notifications.filter(n => !n.is_read).length > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors duration-150"
                              style={{ fontWeight: 500 }}
                            >
                              Mark all as read
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="ml-2 flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-100 transition-colors duration-200"
                            aria-label="Close notifications"
                            style={{ border: '1px solid #e5e7eb', outline: 'none', cursor: 'pointer' }}
                          >
                            <CloseIcon className="h-6 w-6 text-gray-700" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 p-4" style={{ maxHeight: '20rem', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div className="p-4 text-muted-foreground">No notifications yet.</div>
                        ) : (
                          notifications.map((notif) => (
                            <Card
                              key={notif.notification_id}
                              className={`border-2 border-blue-500 cursor-pointer ${notif.is_read ? 'opacity-60' : ''}`}
                              onClick={() => !notif.is_read && markAsRead(notif.notification_id)}
                            >
                              <CardContent className="py-2 px-4 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={notif.is_read ? 'outline' : 'secondary'}>
                                    {notif.is_read ? 'Read' : 'Mark as read'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-auto">{new Date(notif.created_at).toLocaleString()}</span>
                                </div>
                                <div className="font-medium">{notif.message}</div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate('/cart')}
                    className="relative"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                    className="hidden sm:flex"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onShowAuth}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search for fresh groceries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 h-10 bg-background/60 backdrop-blur-sm border-primary/20 focus:border-primary/40"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-background/80 backdrop-blur-lg border-r transition-transform duration-300 ease-in-out`}>
          
          <div className="p-6 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="top-selling" onClick={handleTopSellingClick}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Top Selling
                </TabsTrigger>
                <TabsTrigger value="categories" onClick={() => setActiveTab('categories')}>
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Categories
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="p-6">
            {activeTab === 'categories' && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground mb-4">Browse Categories</h3>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-gradient-primary text-primary-foreground shadow-card'
                        : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'top-selling' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">🔥 Trending Now</h3>
                <p className="text-sm text-muted-foreground">
                  Discover our most popular items based on customer purchases!
                </p>
                <div className="bg-gradient-secondary/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-accent-foreground" />
                    <span className="text-sm font-medium">Customer Favorites</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-30" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {getMainTitle()}
              </h1>
              {searchTerm && (
                <p className="text-muted-foreground">
                  {displayedProducts.length} products found
                </p>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading products...</span>
              </div>
            )}

            {/* Products Grid */}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedProducts.map((product) => (
                  <Card 
                    key={product.product_id || product.id} 
                    className="group hover:shadow-card-hover transition-all duration-300 hover:scale-105 border-0 bg-gradient-card overflow-hidden"
                  >
                    <CardContent className="p-0">
                      {/* Product Image (clickable) */}
                      <div className="relative overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${product.product_id || product.id}`)}>
                        <img
                          src={product.image?.url || product.image_url || product.thumbnail || '/placeholder.svg'}
                          alt={product.name || product.title || 'Product'}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {/* Top Selling Badge */}
                        {activeTab === 'top-selling' && product.total_times_purchased && (
                          <Badge className="absolute top-2 left-2 bg-gradient-primary text-primary-foreground">
                            🔥 {product.total_times_purchased} sold
                          </Badge>
                        )}
                        {/* Wishlist Button */}
                        <Button
                          variant="wishlist"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleAddToWishlist(product.product_id || product.id || 0); }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Product Info (name clickable) */}
                      <h3 className="font-semibold text-foreground line-clamp-2 cursor-pointer" onClick={() => navigate(`/product/${product.product_id || product.id}`)}>
                        {product.name || product.title || 'No Title'}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          ৳{product.price || 'N/A'}
                        </span>
                        {/* Add to Cart Button */}
                        <Button
                          variant="cart"
                          size="sm"
                          onClick={() => handleAddToCart(product.product_id || product.id || 0)}
                          className="text-xs px-3"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      {/* Details Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => navigate(`/product/${product.product_id || product.id}`)}
                      >
                        Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && displayedProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm 
                    ? 'No products found'
                    : activeTab === 'top-selling'
                    ? 'No top selling products yet'
                    : 'No products in this category'
                  }
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms or browse our categories.'
                    : 'Check back later for new additions!'
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerHome;