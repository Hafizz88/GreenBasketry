import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Clock, CheckCircle, X, AlertCircle, Eye } from 'lucide-react';

interface CustomerOrder {
  order_id: number;
  order_date: string;
  order_status: string;
  total_amount: number;
  points_used: number;
  points_earned: number;
  delivery_status: string | null;
  delivery_id: number;
}

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchCustomerOrders = async () => {
    try {
      const customerId = localStorage.getItem('userId');
      console.log('Customer ID from localStorage:', customerId);
      
      if (!customerId) {
        console.log('No customer ID found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Making API call to:', `http://localhost:5001/api/orders?customer_id=${customerId}`);
      const response = await axios.get(
        `http://localhost:5001/api/orders?customer_id=${customerId}`,
        getAuthHeader()
      );
      console.log('API response:', response.data);
      setOrders(response.data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Package className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      case 'restored':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
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

  const getDeliveryStatusBadge = (status: string | null) => {
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

  const canCancelOrder = (order: CustomerOrder) => {
    return order.delivery_status === 'pending' || order.delivery_status === 'assigned';
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5001/api/orders/${orderId}/cancel`,
        {},
        getAuthHeader()
      );

      toast({
        title: "Order Cancelled",
        description: response.data.message,
      });

      // Show additional info if manual restoration is needed
      if (response.data.needs_manual_restoration) {
        toast({
          title: "Stock Restoration Pending",
          description: "Rider has been notified to return products. Stock will be restored by admin after products are returned.",
          variant: "default",
        });
      }

      // Refresh orders list
      await fetchCustomerOrders();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      const errorMessage = error.response?.data?.error || 'Failed to cancel order';
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
        <span className="ml-3 text-muted-foreground">Loading orders...</span>
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
          <h1 className="text-3xl font-bold">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <Card className="shadow-card-hover border-0 bg-gradient-card">
            <CardContent className="text-center p-8">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button onClick={() => navigate('/home')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.order_id} className="shadow-card-hover border-0 bg-gradient-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.order_status)}
                      <div>
                        <CardTitle className="text-lg">Order #{order.order_id}</CardTitle>
                        <CardDescription>
                          Placed on {formatDate(order.order_date)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(order.total_amount)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Order Status</p>
                      {getStatusBadge(order.order_status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Delivery Status</p>
                      {getDeliveryStatusBadge(order.delivery_status)}
                    </div>
                  </div>
                  
                  {(order.points_used > 0 || (order.points_earned > 0 && order.delivery_status !== 'failed')) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {order.points_used > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Points Used</p>
                          <p className="font-medium text-red-600">-{order.points_used} points</p>
                        </div>
                      )}
                      {order.points_earned > 0 && order.delivery_status !== 'failed' && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
                          <p className="font-medium text-green-600">+{order.points_earned} points</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => navigate(`/order-status/${order.order_id}`)}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {canCancelOrder(order) && (
                      <Button
                        onClick={() => handleCancelOrder(order.order_id)}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersPage; 