import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, X, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface CancellableOrder {
  order_id: number;
  order_date: string;
  order_status: string;
  total_amount: number;
  points_used: number;
  points_earned: number;
  delivery_status: string | null;
  delivery_id: number;
}

const CancellableOrdersPage = () => {
  const [orders, setOrders] = useState<CancellableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);
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

  const fetchCancellableOrders = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5001/api/orders/customer/cancellable',
        getAuthHeader()
      );
      setOrders(response.data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancellableOrders();
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancellingOrder(orderId);
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

      // Refresh orders list
      await fetchCancellableOrders();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      const errorMessage = error.response?.data?.error || 'Failed to cancel order';
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCancellingOrder(null);
    }
  };

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
          <h1 className="text-3xl font-bold">Cancellable Orders</h1>
        </div>

        {orders.length === 0 ? (
          <Card className="shadow-card-hover border-0 bg-gradient-card">
            <CardContent className="text-center p-8">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Active Orders</h2>
              <p className="text-muted-foreground mb-4">
                You don't have any orders that can be cancelled at the moment.
              </p>
              <Button onClick={() => navigate('/products')}>
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
                  
                  {(order.points_used > 0 || order.points_earned > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {order.points_used > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Points Used</p>
                          <p className="font-medium text-red-600">-{order.points_used} points</p>
                        </div>
                      )}
                      {order.points_earned > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
                          <p className="font-medium text-green-600">+{order.points_earned} points</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelOrder(order.order_id)}
                      disabled={cancellingOrder === order.order_id}
                    >
                      {cancellingOrder === order.order_id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Cancel Order
                        </>
                      )}
                    </Button>
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

export default CancellableOrdersPage; 