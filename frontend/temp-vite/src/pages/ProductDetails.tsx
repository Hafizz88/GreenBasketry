import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

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
  created_at?: string;
  last_updated?: string;
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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

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

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;
  if (!product) return null;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 16 }}>{product.name}</h2>
      {product.image_url && (
        <img src={product.image_url} alt={product.name} style={{ maxWidth: 300, borderRadius: 8, marginBottom: 16 }} />
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1, minWidth: 250 }}>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Price:</strong> ৳{product.price}</p>
            <p><strong>Stock:</strong> {product.stock}</p>
            {product.discount_percentage && <p><strong>Discount:</strong> {product.discount_percentage}%</p>}
            {product.vat_percentage && <p><strong>VAT:</strong> {product.vat_percentage}%</p>}
            <p><strong>Description:</strong> {product.description}</p>
            <p><strong>Created At:</strong> {product.created_at}</p>
            <p><strong>Last Updated:</strong> {product.last_updated}</p>
          </CardContent>
        </Card>
      </div>
      <hr style={{ margin: '24px 0' }} />
      <h3 style={{ fontSize: 22, marginBottom: 12 }}>Reviews</h3>
      <Card style={{ marginBottom: 24 }}>
        <CardContent>
          <form onSubmit={handleAddReview} style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Write your review"
              required
              style={{ width: '100%', minHeight: 60, borderRadius: 8, border: '1px solid #ddd', padding: 8 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Rating:</span>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ cursor: 'pointer' }} onClick={() => setRating(n)}>
                  <svg width="22" height="22" viewBox="0 0 20 20" fill={n <= rating ? '#facc15' : '#e5e7eb'} xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"/>
                  </svg>
                </span>
              ))}
              <Button type="submit" disabled={reviewLoading} style={{ marginLeft: 16 }}>
                {reviewLoading ? 'Adding...' : 'Add Review'}
              </Button>
              {reviewError && <span style={{ color: 'red', marginLeft: 8 }}>{reviewError}</span>}
            </div>
          </form>
        </CardContent>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!Array.isArray(reviews) || reviews.length === 0 ? (
          <Card><CardContent><span style={{ color: '#888' }}>No reviews yet.</span></CardContent></Card>
        ) : reviews.map((r) => (
          <Card key={r.review_id}>
            <CardContent style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <Avatar>
                <AvatarFallback>{r.customer_id ? `C${r.customer_id}` : '?'}</AvatarFallback>
              </Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} width="18" height="18" viewBox="0 0 20 20" fill={n <= r.rating ? '#facc15' : '#e5e7eb'} xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"/>
                    </svg>
                  ))}
                  <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>By Customer #{r.customer_id} on {new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ margin: '8px 0' }}>{r.review_text}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button variant="ghost" size="sm" onClick={() => handleUpvote(r.review_id)}>
                    👍 Upvote
                  </Button>
                  <span style={{ color: '#888', fontSize: 14 }}>Upvotes: {r.upvotes}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductDetails; 