import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/services/api';

export interface Retailer {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  performance: number;
  projects: Array<{
    id: string;
    name: string;
    status: 'ongoing' | 'completed' | 'delayed';
  }>;
}

export function useRetailer(id: string) {
  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRetailer = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/retailers/${id}`);
      const data = response.data.data.retailer;

      // Transform backend data (formatRetailer's camelCase shape) to match
      // our frontend Retailer type.
      const transformedRetailer: Retailer = {
        id: data.id.toString(),
        name: data.name,
        contact: data.name || '',
        email: data.email,
        phone: data.phone || '',
        address: [data.address?.street, data.address?.city, data.address?.state, data.address?.zipCode]
          .filter(Boolean)
          .join(', '),
        status: data.status || 'active',
        joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
        performance: data.metrics?.averageRating ? Number(data.metrics.averageRating) * 20 : 0,
        projects: (data.projects || []).map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          status: p.status || 'ongoing'
        }))
      };

      setRetailer(transformedRetailer);
    } catch (error: any) {
      console.error('Error fetching retailer:', error);
      toast.error(error?.response?.data?.message || 'Failed to load retailer details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const updateRetailer = useCallback(async (data: Partial<Retailer>) => {
    try {
      setIsLoading(true);
      const response = await api.patch(`/retailers/${id}`, data);
      const updatedData = response.data.data.retailer;

      setRetailer(prev => prev ? { ...prev, ...updatedData } : null);
      toast.success('Retailer updated successfully');
    } catch (error: any) {
      console.error('Error updating retailer:', error);
      toast.error(error?.response?.data?.message || 'Failed to update retailer');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return {
    retailer,
    isLoading,
    fetchRetailer,
    updateRetailer
  };
}