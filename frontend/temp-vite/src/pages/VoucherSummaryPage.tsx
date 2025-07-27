import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowLeft, ArrowRight, Ticket, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface VoucherSummary {
  cart_id: number;
  subtotal: number;
  total_vat: number;
  total_discount: number;
  delivery_fee: number;
  grand_total: number;
  points_used?: number;
}

interface Coupon {
  coupon_id: number;
  code: string;
  description: string;
  discount_percent: number;
  required_point: number;
  valid_from: string;
  valid_to: string;
}

const VoucherSummaryPage = () => {
  const [summary, setSummary] = useState<VoucherSummary | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const customerId = localStorage.getItem('userId');

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          toast({
            title: "Authentication Required",
            description: "Please log in to continue.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        if (!customerId) {
          toast({
            title: "Authentication Required",
            description: "Please log in to continue.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }

        // Fetch voucher summary
        const summaryResponse = await axios.get(
          `http://localhost:5001/api/vouchers/${customerId}`,
          authHeader
        );
        setSummary(summaryResponse.data);

        // Fetch available coupons for this customer
        const couponsResponse = await axios.get(
          `http://localhost:5001/api/customers/coupons?customer_id=${customerId}`,
          authHeader
        );
        setCoupons(couponsResponse.data);
        
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        
        if (error.response?.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate('/login');
        } else if (error.response?.status === 404) {
          toast({
            title: "Cart Not Found",
            description: "Please add items to your cart first.",
            variant: "destructive",
          });
          navigate('/products');
        } else {
          const errorMessage = error.response?.data?.error || 'Could not load order summary.';
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, navigate]);

  const handleApplyCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    toast({
      title: "Coupon Applied",
      description: `${coupon.code} applied successfully!`,
    });
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed.",
    });
  };

  const getDiscountedGrandTotal = () => {
    if (!summary) return 0;
    
    const subtotal = Number(summary.subtotal) || 0;
    const vat = Number(summary.total_vat) || 0;
    const deliveryFee = Number(summary.delivery_fee) || 0;
    const pointsUsed = Number(summary.points_used) || 0;
    
    let total = subtotal + vat + deliveryFee - pointsUsed;
    
    if (selectedCoupon) {
      const discountAmount = (total * selectedCoupon.discount_percent) / 100;
      total -= discountAmount;
    }
    
    return total;
  };

  const handleProceed = async () => {
    if (!summary || !summary.cart_id) {
      toast({
        title: "Error",
        description: "Invalid cart data. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setPlacing(true);
    
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const orderData: any = {
        customer_id: parseInt(customerId!),
        cart_id: summary.cart_id,
        points_used: summary.points_used || 0
      };

      if (selectedCoupon) {
        orderData.coupon_code = selectedCoupon.code;
      }

      const response = await axios.post(
        'http://localhost:5001/api/orders/place',
        orderData,
        authHeader
      );
      
      if (response.data.success) {
        toast({
          title: "Order Placed Successfully!",
          description: "Your order has been placed and will be processed soon.",
        });
        navigate('/order-success', { 
          state: { 
            orderId: response.data.order_id,
            deliveryId: response.data.delivery_id,
            totalAmount: response.data.total_amount
          }
        });
      } else {
        throw new Error(response.data.error || 'Failed to place order');
      }
      
    } catch (err: any) {
      console.error('Order placement failed:', err);
      
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        
        if (status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate('/login');
        } else if (status === 400) {
          const errorMessage = errorData?.error || 'Invalid order data';
          toast({
            title: "Order Failed",
            description: errorMessage,
            variant: "destructive",
          });
        } else if (status === 404) {
          toast({
            title: "Cart Not Found",
            description: "Please add items to your cart first.",
            variant: "destructive",
          });
          navigate('/products');
        } else {
          const errorMessage = errorData?.error || errorData?.message || 'Failed to place order';
          toast({
            title: "Order Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Network Error",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setPlacing(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    const numValue = parseFloat(value?.toString() || '0');
    return `৳${numValue.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading summary...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-semibold mb-2">No Summary Available</h2>
            <p className="text-muted-foreground mb-4">Unable to load cart summary. Please try refreshing the page.</p>
            <Button onClick={() => navigate('/cart')}>
              Back to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Order Summary</h1>
        </div>

        <Card className="mb-6 shadow-card-hover border-0 bg-gradient-card">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Cart ID: {summary.cart_id}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(summary.subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">VAT</span>
              <span className="font-medium">{formatCurrency(summary.total_vat)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-success">-{formatCurrency(summary.total_discount)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium">{formatCurrency(summary.delivery_fee)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(getDiscountedGrandTotal())}</span>
            </div>
          </CardContent>
        </Card>

        {/* Available Coupons */}
        <Card className="mb-6 shadow-card-hover border-0 bg-gradient-card">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                <Ticket className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle>Available Coupons</CardTitle>
                <CardDescription>Select a coupon to apply discount</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No coupons available for your points</p>
            ) : (
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div key={coupon.coupon_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{coupon.code}</p>
                        <Badge variant="outline" className="text-xs">
                          {coupon.required_point} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{coupon.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-success text-success-foreground">
                        -{coupon.discount_percent}%
                      </Badge>
                      <Button
                        size="sm"
                        variant={selectedCoupon?.coupon_id === coupon.coupon_id ? "default" : "outline"}
                        onClick={() => selectedCoupon?.coupon_id === coupon.coupon_id 
                          ? handleRemoveCoupon() 
                          : handleApplyCoupon(coupon)
                        }
                      >
                        {selectedCoupon?.coupon_id === coupon.coupon_id ? "Applied" : "Apply"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Coupon Display */}
        {selectedCoupon && (
          <Card className="mb-6 shadow-card-hover border-0 bg-gradient-secondary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <Ticket className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Applied Coupon</CardTitle>
                    <CardDescription>You're saving money!</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveCoupon}
                >
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedCoupon.code}</p>
                  <p className="text-sm text-muted-foreground">{selectedCoupon.description}</p>
                </div>
                <Badge className="bg-success text-success-foreground">
                  -{selectedCoupon.discount_percent}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points Information */}
        {summary.points_used && summary.points_used > 0 && (
          <Card className="mb-6 shadow-card-hover border-0 bg-gradient-primary/10">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Loyalty Points</CardTitle>
                  <CardDescription>Points redeemed for this order</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-primary">
                {summary.points_used} points used
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline"
            onClick={() => navigate(-1)} 
            disabled={placing}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleProceed} 
            disabled={placing || !summary.cart_id}
            className="flex-1"
          >
            {placing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Placing Order...
              </>
            ) : (
              <>
                Place Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoucherSummaryPage;