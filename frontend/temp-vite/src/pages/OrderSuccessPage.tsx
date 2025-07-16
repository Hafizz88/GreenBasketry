import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Clock, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OrderSuccessState {
  orderId?: number;
  deliveryId?: number;
  totalAmount?: number;
}

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { orderId, deliveryId, totalAmount } = (location.state as OrderSuccessState) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8 pt-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-primary rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your order has been placed and will be processed soon.
          </p>
        </div>

        {orderId && (
          <Card className="mb-6 shadow-card-hover border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Order Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-semibold">#{orderId}</p>
                </div>
                {deliveryId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery ID</p>
                    <p className="font-semibold">#{deliveryId}</p>
                  </div>
                )}
              </div>
              
              {totalAmount && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-primary text-lg">৳{parseFloat(totalAmount.toString()).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="bg-warning text-warning-foreground">
                      Processing
                    </Badge>
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="font-semibold">45 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 shadow-card-hover border-0 bg-gradient-secondary/20">
          <CardHeader>
            <CardTitle className="text-primary">What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-sm">You will receive a confirmation SMS/email shortly</p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-sm">A rider will be assigned to your order</p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-sm">You can track your delivery in real-time</p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-sm">Payment will be collected upon delivery</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-card-hover border-0 bg-gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Payment Method: Cash on Delivery</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button 
            onClick={() => navigate('/orders')}
            className="w-full sm:w-auto"
          >
            View My Orders
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/products')}
            className="w-full sm:w-auto"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;