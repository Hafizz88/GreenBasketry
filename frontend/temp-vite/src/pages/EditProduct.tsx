import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const EditProduct: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [form, setForm] = useState({
    price: '',
    stock: '',
    description: '',
    vat_percentage: '',
    discount_percentage: '',
    discount_started: '',
    discount_finished: '',
    points_rewarded: '',
  });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5001/api/products/${id}`);
        setProduct(res.data);
        setForm({
          price: res.data.price || '',
          stock: res.data.stock || '',
          description: res.data.description || '',
          vat_percentage: res.data.vat_percentage || '',
          discount_percentage: res.data.discount_percentage || '',
          discount_started: res.data.discount_started ? res.data.discount_started.slice(0, 16) : '',
          discount_finished: res.data.discount_finished ? res.data.discount_finished.slice(0, 16) : '',
          points_rewarded: res.data.points_rewarded || '',
        });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to fetch product details', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/admin/products/${id}`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast({ title: 'Success', description: 'Product updated successfully!' });
      navigate('/admin/products');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !product) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={product.name} disabled />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={product.category} disabled />
            </div>
            <div>
              <Label>Image</Label>
              <Input value={product.image_url} disabled />
            </div>
            <div>
              <Label>Price</Label>
              <Input name="price" type="number" value={form.price} onChange={handleChange} required />
            </div>
            <div>
              <Label>Stock</Label>
              <Input name="stock" type="number" value={form.stock} onChange={handleChange} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input name="description" value={form.description} onChange={handleChange} />
            </div>
            <div>
              <Label>VAT Percentage</Label>
              <Input name="vat_percentage" type="number" value={form.vat_percentage} onChange={handleChange} />
            </div>
            <div>
              <Label>Discount Percentage</Label>
              <Input name="discount_percentage" type="number" value={form.discount_percentage} onChange={handleChange} />
            </div>
            <div>
              <Label>Discount Start</Label>
              <Input name="discount_started" type="datetime-local" value={form.discount_started} onChange={handleChange} />
            </div>
            <div>
              <Label>Discount End</Label>
              <Input name="discount_finished" type="datetime-local" value={form.discount_finished} onChange={handleChange} />
            </div>
            <div>
              <Label>Points Rewarded</Label>
              <Input name="points_rewarded" type="number" value={form.points_rewarded} onChange={handleChange} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Product'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProduct; 