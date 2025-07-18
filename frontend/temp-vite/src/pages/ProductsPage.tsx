import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Product {
  product_id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
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

  const isLoggedIn = () => {
    return localStorage.getItem('userId') && localStorage.getItem('token');
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products', getAuthHeader());
        setProducts(response.data);
      } catch (err) {
        console.error('Failed to load products', err);
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    try {
      const storedCustomerId = localStorage.getItem('userId');
      const customerId = parseInt(storedCustomerId || '0', 10);

      if (!customerId || isNaN(customerId)) {
        toast({
          title: "Error",
          description: "Customer ID is invalid or missing!",
          variant: "destructive",
        });
        return;
      }

      await axios.post('http://localhost:5000/api/cart', {
        customer_id: customerId,
        product_id: productId,
        quantity: 1
      }, getAuthHeader());

      toast({
        title: "Added to Cart!",
        description: "Item has been added to your cart successfully.",
      });
    } catch (err) {
      console.error('Add to cart failed:', err);
      toast({
        title: "Error",
        description: "Failed to add to cart. Please try again.",
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
      navigate('/login');
      return;
    }

    try {
      const storedCustomerId = localStorage.getItem('userId');
      const customerId = parseInt(storedCustomerId || '0', 10);

      await axios.post('http://localhost:5000/api/wishlist', {
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
        description: "Failed to add to wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/home')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold">All Products</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card 
              key={product.product_id} 
              className="group hover:shadow-card-hover transition-all duration-300 hover:scale-105 border-0 bg-gradient-card overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {product.stock === 0 && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                      Out of Stock
                    </Badge>
                  )}

                  <Button
                    variant="wishlist"
                    size="icon"
                    onClick={() => handleAddToWishlist(product.product_id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-foreground line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Stock:</span>
                    <span className={product.stock > 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                      {product.stock}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      ৳{product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-accent fill-current" />
                      <span className="text-sm text-muted-foreground">4.5</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleAddToCart(product.product_id)}
                    disabled={product.stock === 0}
                    className="w-full"
                    variant={product.stock === 0 ? "outline" : "default"}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No products available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;