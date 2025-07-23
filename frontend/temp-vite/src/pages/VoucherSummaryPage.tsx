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
  active_coupon_code?: string;
  active_coupon_discount?: number;
  points_used?: number;
}

const VoucherSummaryPage = () => {
  const [summary, setSummary] = useState<VoucherSummary | null>(null);
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
    const fetchSummary = async () => {
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

        const response = await axios.get(
          `http://localhost:5001/api/vouchers/${customerId}`,
          authHeader
        );
        
        setSummary(response.data);
        
      } catch (error: any) {
        console.error('Failed to fetch voucher summary:', error);
        
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

    fetchSummary();
  }, [customerId, navigate]);

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

      if (summary.active_coupon_code) {
        orderData.coupon_code = summary.active_coupon_code;
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
              <span className="text-primary">{formatCurrency(summary.grand_total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Coupon Information */}
        {summary.active_coupon_code ? (
          <Card className="mb-6 shadow-card-hover border-0 bg-gradient-secondary/20">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle>Applied Coupon</CardTitle>
                  <CardDescription>You're saving money!</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{summary.active_coupon_code}</p>
                  <p className="text-sm text-muted-foreground">Coupon discount applied</p>
                </div>
                <Badge className="bg-success text-success-foreground">
                  -{summary.active_coupon_discount}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 shadow-card-hover border-0 bg-muted/20">
            <CardContent className="text-center p-6">
              <Ticket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No coupons applied</p>
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