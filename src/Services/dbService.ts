
import { Product, User } from '../types';

const API_BASE_URL = 'https://kimathimarket-backend.onrender.com';

export const productService = {
  async fetchAll(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      
      // Comprehensive debug logging
      console.log('=== BACKEND RESPONSE ===');
      console.log('Total products received:', data.length);
      console.table(data.map((p: Product) => ({
        title: p.title,
        imageCount: p.images?.length || 0,
        imageUrls: p.images?.join(', ') || 'NONE',
        isSold: p.isSold,
      })));
      
      // Detailed per-product logging
      data.forEach((product: Product, idx: number) => {
        console.group(`Product ${idx + 1}: "${product.title}"`);
        console.log('Full product object:', product);
        console.log('Images array:', product.images);
        console.log('Images array is null/undefined?', product.images === null || product.images === undefined);
        console.log('Images array length:', product.images?.length);
        if (product.images && product.images.length > 0) {
          product.images.forEach((url, i) => {
            console.log(`  Image ${i + 1}:`, url);
          });
        } else {
          console.warn('  ⚠️ NO IMAGES FOUND FOR THIS PRODUCT');
        }
        console.groupEnd();
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async create(
    product: Omit<Product,
      'id' | 'createdAt' | 'updatedAt' |
        'sellerName' | 'sellerPhone'
    >,
    user: User
  ): Promise<boolean> {
    try {
      const formData = new FormData();

      // Text fields - match backend expectations exactly
      formData.append('userId', user.id);
      formData.append('title', product.title);
      formData.append('description', product.description);
      formData.append('price', String(product.price));
      formData.append('category', product.category);
      formData.append('condition', product.condition);

      // Images - append each File object
      if (product.images && product.images.length > 0) {
        product.images.forEach((image: any) => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      }

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('Product created:', result);
      return true;
    } catch (error) {
      console.error('Error creating product:', error);
      return false;
    }
  },

  async markAsSold(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}/sold`, {
        method: 'PATCH',
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking product as sold:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }
};

export const authService = {
  async getProfileByEmail(email: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${encodeURIComponent(email)}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },
  async upsertProfile(user: User & { password?: string }): Promise<boolean> {
    try {
      const payload: any = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      };

      if (user.password) payload.password = user.password;

      const response = await fetch(`${API_BASE_URL}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  },

  async login(email: string, password: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }
};
