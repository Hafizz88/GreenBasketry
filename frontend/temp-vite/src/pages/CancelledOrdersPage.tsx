import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface CancelledOrder {
  order_id: number;
  order_date: string;
  total_amount: number;
  points_used: number;
  points_earned: number;
  delivery_status: string;
  customer_name: string;
  customer_phone: string;
}

const CancelledOrdersPage = () => {
  const [orders, setOrders] = useState<CancelledOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringStock, setRestoringStock] = useState<number | null>(null);
  const { toast } = useToast();

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchCancelledOrders = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5001/api/orders/admin/cancelled-needing-restoration',
        getAuthHeader()
      );
      setOrders(response.data);
    } catch (error: any) {
      console.error('Error fetching cancelled orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cancelled orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelledOrders();
  }, []);

  const handleRestoreStock = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to restore stock for this cancelled order?')) {
      return;
    }

    setRestoringStock(orderId);
    try {
      const response = await axios.post(
        `http://localhost:5001/api/orders/${orderId}/restore-stock`,
        {},
        getAuthHeader()
      );

      toast({
        title: "Stock Restored",
        description: response.data.message,
      });

      // Refresh orders list
      await fetchCancelledOrders();
    } catch (error: any) {
      console.error('Error restoring stock:', error);
      const errorMessage = error.response?.data?.error || 'Failed to restore stock';
      toast({
        title: "Restoration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRestoringStock(null);
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading cancelled orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Cancelled Orders</h2>
          <p className="text-muted-foreground">
            Manage cancelled orders that need manual stock restoration (orders that were assigned to riders)
          </p>
        </div>
        <Button onClick={fetchCancelledOrders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="shadow-card-hover border-0 bg-gradient-card">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Orders Need Manual Stock Restoration</h3>
            <p className="text-muted-foreground">
              All cancelled orders have been processed. Orders with pending delivery status had automatic stock restoration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.order_id} className="shadow-card-hover border-0 bg-gradient-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-warning rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-warning-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_id}</CardTitle>
                      <CardDescription>
                        Cancelled on {formatDate(order.order_date)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(order.total_amount)}
                    </div>
                    <Badge variant="destructive" className="mt-1">
                      Manual Stock Restoration Required
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Customer</p>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Points Used</p>
                    <p className="font-medium text-red-600">-{order.points_used} points</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
                    <p className="font-medium text-green-600">+{order.points_earned} points</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleRestoreStock(order.order_id)}
                    disabled={restoringStock === order.order_id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {restoringStock === order.order_id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Restore Stock (After Rider Returns)
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
  );
};

export default CancelledOrdersPage; 