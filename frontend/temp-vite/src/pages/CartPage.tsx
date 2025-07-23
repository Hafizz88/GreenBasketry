import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  cart_item_id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  // stock: number; // Remove stock from the interface
}

interface Cart {
  cart_id: number;
  price: number;
}

const CartPage = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    console.log('Frontend token:', token); // Add this line
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    };
  };

  const customerId = localStorage.getItem('userId');

  const fetchCart = async () => {
    try {
      if (!customerId) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your cart.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5001/api/cart`, getAuthHeader());

      if (response.data.cart) {
        setCart(response.data.cart);
        setCartItems(response.data.items);
      } else {
        setCart(null);
        setCartItems([]);
      }
    } catch (err: any) {
      console.error('Error fetching cart:', err);
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
          description: "Failed to load cart.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [customerId]);

  const handleAddToCart = async (productId: number) => {
    try {
      await axios.post(
        `http://localhost:5001/api/cart`,
        {
          product_id: productId,
          quantity: 1
        },
        getAuthHeader()
      );
      toast({
        title: "Added to Cart",
        description: "Item quantity increased.",
      });
      fetchCart();
    } catch (err) {
      console.error('Add to cart failed:', err);
      toast({
        title: "Error",
        description: "Failed to update cart.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    try {
      await axios.delete(`http://localhost:5001/api/cart`, {
        ...getAuthHeader(),
        data: {
          product_id: productId
        }
      });
      toast({
        title: "Removed from Cart",
        description: "Item has been removed from your cart.",
      });
      fetchCart();
    } catch (err) {
      console.error('Remove from cart failed:', err);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCartItem = async (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    try {
      await axios.put(
        `http://localhost:5001/api/cart`,
        {
          product_id: productId,
          quantity: newQuantity
        },
        getAuthHeader()
      );
      toast({
        title: "Cart Updated",
        description: "Item quantity has been updated.",
      });
      fetchCart();
    } catch (err) {
      console.error('Update quantity failed:', err);
      toast({
        title: "Error",
        description: "Failed to update item quantity.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading cart...</span>
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
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
              Back to Shopping
            </Button>
            <h1 className="text-3xl font-bold">My Cart</h1>
          </div>

          <Card className="shadow-card-hover border-0 bg-gradient-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-secondary rounded-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle>Your cart is empty</CardTitle>
              <CardDescription>
                Start adding some fresh groceries to your cart!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => navigate('/home')}
                className="mt-4"
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
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
            Back to Shopping
          </Button>
          <h1 className="text-3xl font-bold">My Cart</h1>
          <Badge variant="secondary">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.cart_item_id} className="shadow-card-hover border-0 bg-gradient-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image_url || '/placeholder.svg'} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-primary font-bold">৳{Number(item.price || 0).toFixed(2)}</p>
                      {/* <p className="text-xs text-muted-foreground">Stock: {item.stock}</p> */} {/* Remove stock display */}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateCartItem(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateCartItem(item.product_id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveFromCart(item.product_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-card-hover border-0 bg-gradient-card sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">৳{Number(cart.price || 0).toFixed(2)}</span>
                </div>
                
                <Button 
                  onClick={() => navigate('/voucher-summary')}
                  className="w-full"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/home')}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;