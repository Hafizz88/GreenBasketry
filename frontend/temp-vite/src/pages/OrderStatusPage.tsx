import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  X,
  AlertCircle, 
  MapPin, 
  Phone,
  User,
  Calendar,
  DollarSign,
  Star
} from 'lucide-react';

interface OrderItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface OrderDetails {
  order_id: number;
  order_date: string;
  order_status: string | null;
  subtotal: number;
  vat_amount: number;
  delivery_fee: number;
  discount_amount: number;
  points_used: number;
  points_value: number;
  points_earned: number;
  total_amount: number;
  payment_status: boolean;
  payment_date?: string;
  address_line: string;
  customer_name: string;
  delivery_status: string | null;
  estimated_time?: string;
  rider_name?: string;
  rider_phone?: string;
  items: OrderItem[];
}

const OrderStatusPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      const response = await axios.get(
        `http://localhost:5001/api/orders/${orderId}`,
        getAuthHeader()
      );
      setOrder(response.data);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.status === 404) {
        toast({
          title: "Order Not Found",
          description: "The order you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/home');
      } else {
        toast({
          title: "Error",
          description: "Failed to load order details.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);



  const getStatusIcon = (status: string | null) => {
    if (!status) {
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }

    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      case 'restored':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Not Available
        </Badge>
      );
    }

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      restored: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDeliveryStatusBadge = (status: string | null | undefined) => {
    if (!status) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Not Available
        </Badge>
      );
    }

    const deliveryColors = {
      pending: 'bg-orange-100 text-orange-800',
      assigned: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={deliveryColors[status as keyof typeof deliveryColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '৳0.00';
    }
    return `৳${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Date not available';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/home')}>
              Back to Home
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
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Order #{order.order_id}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Status Card */}
          <Card className="lg:col-span-2 shadow-card-hover border-0 bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.order_status)}
                  <div>
                    <CardTitle>Order Status</CardTitle>
                    <CardDescription>Order placed on {formatDate(order.order_date)}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(order.order_status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delivery Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Delivery Status</p>
                    <p className="text-sm text-muted-foreground">
                      {order.delivery_status === 'out_for_delivery' && order.rider_name 
                        ? `Out for delivery with ${order.rider_name}`
                        : order.delivery_status === 'delivered'
                        ? 'Delivered successfully'
                        : 'Processing your order'
                      }
                    </p>
                  </div>
                </div>
                {getDeliveryStatusBadge(order.delivery_status)}
              </div>

              {/* Rider Information */}
              {order.rider_name && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-blue-900">Your Rider</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{order.rider_name}</span>
                    </div>
                    {order.rider_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{order.rider_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Estimated Delivery Time */}
              {order.estimated_time && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Estimated Delivery</p>
                    <p className="text-sm text-green-700">
                      {formatDate(order.estimated_time)}
                    </p>
                  </div>
                </div>
              )}


            </CardContent>
          </Card>

          {/* Order Summary Card */}
          <Card className="shadow-card-hover border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">Customer</span>
                </div>
                <p className="text-sm">{order.customer_name}</p>
              </div>

              {/* Delivery Address */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">Delivery Address</span>
                </div>
                <p className="text-sm">{order.address_line}</p>
              </div>

              {/* Payment Status */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium">Payment</span>
                </div>
                <Badge variant={order.payment_status ? "default" : "secondary"}>
                  {order.payment_status ? "Paid" : "Pending"}
                </Badge>
              </div>

              <Separator />

              {/* Cost Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span>{formatCurrency(order.vat_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.points_used > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Points Used</span>
                    <span>-{formatCurrency(order.points_value)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              {/* Points Information */}
              {(order.points_used > 0 || order.points_earned > 0) && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Loyalty Points</span>
                  </div>
                  {order.points_used > 0 && (
                    <p className="text-sm text-yellow-700">Used: {order.points_used} points</p>
                  )}
                  {order.points_earned > 0 && (
                    <p className="text-sm text-yellow-700">Earned: {order.points_earned} points</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6 shadow-card-hover border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderStatusPage; 