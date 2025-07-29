import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Clock, Star, Gift, ShoppingCart, TrendingUp, AlertTriangle, ArrowLeft, Plus } from 'lucide-react';

interface Product {
  product_id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  image_url?: string;
  discount_percentage?: number;
  vat_percentage?: number;
  discount_end_date?: string;
  points_earned?: number;
  points_rewarded?: number;
  reviews?: any[];
}

interface Review {
  review_id: number;
  customer_id: number;
  rating: number;
  review_text: string;
  created_at: string;
  upvotes: number;
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.product_id,
          quantity: 1
        })
      });

      if (response.ok) {
        // Show success message or toast
        alert('Product added to cart successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_ENDPOINTS.PRODUCTS}/${id}`);
        setProduct(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const res = await axios.get(`${API_ENDPOINTS.PRODUCTS}/${id}/reviews`);
        setReviews(Array.isArray(res.data) ? res.data : []);
      } catch {
        setReviews([]);
      }
    };
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API_ENDPOINTS.PRODUCTS}/${id}/reviews`,
        { rating, review_text: reviewText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviewText('');
      // Refresh reviews
      const res = await axios.get(`${API_ENDPOINTS.PRODUCTS}/${id}/reviews`);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setReviewError(err.response?.data?.error || 'Failed to add review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleUpvote = async (reviewId: number) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${API_ENDPOINTS.PRODUCTS}/reviews/${reviewId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh reviews
      const res = await axios.get(`${API_ENDPOINTS.PRODUCTS}/${id}/reviews`);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upvote');
    }
  };

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount / 100);
  };

  const getDiscountTimeLeft = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) return null;

  const discountedPrice = product.discount_percentage 
    ? calculateDiscountedPrice(product.price, product.discount_percentage)
    : product.price;

  const discountTimeLeft = product.discount_end_date 
    ? getDiscountTimeLeft(product.discount_end_date)
    : null;

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
        </Card>
      </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{product.category}</Badge>
                {product.discount_percentage && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {product.discount_percentage}% OFF
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({reviews.length} reviews)
                </span>
              </div>
            </div>

            {/* Price Section */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {product.discount_percentage ? (
                      <>
                        <span className="text-3xl font-bold text-green-600">
                          ৳{discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-xl text-gray-500 line-through">
                          ৳{product.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-green-600">
                        ৳{product.price}
                      </span>
                    )}
                  </div>

                  {/* Discount Timer */}
                  {discountTimeLeft && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Discount ends in:</strong> {discountTimeLeft.days}d {discountTimeLeft.hours}h {discountTimeLeft.minutes}m
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Points Earning - Always show, display 0 if no points */}
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Gift className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700">
                      Earn <strong>{product.points_rewarded || 0} points</strong> on this purchase
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Status */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Stock Status</span>
                    <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </Badge>
                  </div>
                  {product.stock > 0 && (
                    <Progress value={(product.stock / 100) * 100} className="h-2" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1" 
                disabled={product.stock === 0 || addingToCart}
                onClick={handleAddToCart}
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <p className="text-gray-900">{product.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Price</Label>
                    <p className="text-gray-900">৳{product.price}</p>
                  </div>
                  {product.discount_percentage && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Discount</Label>
                      <p className="text-gray-900">{product.discount_percentage}%</p>
                    </div>
                  )}
                  {product.vat_percentage && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">VAT</Label>
                      <p className="text-gray-900">{product.vat_percentage}%</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Stock</Label>
                    <p className="text-gray-900">{product.stock} units</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Points Earned</Label>
                    <p className="text-gray-900">{product.points_rewarded || 0} points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {/* Add Review Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddReview} className="space-y-4">
                    <div>
                      <Label htmlFor="review">Your Review</Label>
                      <Textarea
                        id="review"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your experience with this product..."
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label>Rating:</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button type="submit" disabled={reviewLoading}>
                        {reviewLoading ? 'Adding...' : 'Add Review'}
                      </Button>
                    </div>
                    {reviewError && (
                      <Alert variant="destructive">
                        <AlertDescription>{reviewError}</AlertDescription>
                      </Alert>
                    )}
          </form>
        </CardContent>
      </Card>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      No reviews yet. Be the first to review this product!
                    </CardContent>
                  </Card>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.review_id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
              <Avatar>
                            <AvatarFallback>U{review.customer_id}</AvatarFallback>
              </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                by Customer #{review.customer_id} • {new Date(review.created_at).toLocaleDateString()}
                              </span>
                </div>
                            <p className="text-gray-700 mb-3">{review.review_text}</p>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpvote(review.review_id)}
                              >
                                👍 Upvote ({review.upvotes})
                  </Button>
                            </div>
                </div>
              </div>
            </CardContent>
          </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetails; 