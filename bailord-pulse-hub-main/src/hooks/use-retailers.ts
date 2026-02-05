import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { retailerAPI } from '@/services/api';
import { Retailer, RetailerFormData, RetailersResponse } from '@/types/retailer';

interface UseRetailersOptions {
  search?: string;
  businessType?: string;
  status?: string;
  initialPage?: number;
  initialLimit?: number;
}

export function useRetailers({
  search = '',
  businessType,
  status,
  initialPage = 1,
  initialLimit = 10,
}: UseRetailersOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [searchQuery, setSearchQuery] = useState<string>(search || '');
  const queryClient = useQueryClient();

  // Keep internal searchQuery in sync when the `search` option changes
  useEffect(() => {
    setSearchQuery(search || '');
  }, [search]);

  // Fetch retailers with pagination
  const {
    data,
    isLoading,
    error,
  } = useQuery<RetailersResponse>({
    queryKey: ['retailers', page, limit, search, businessType, status],
    queryFn: async () => {
      const response = await retailerAPI.getAll(page, limit, {
        search,
        businessType,
        status,
      });
      return response.data;
    },
  });

  const retailers = data?.data?.retailers || [];
  const totalItems = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.pages || Math.max(1, Math.ceil(totalItems / limit));

  // Create retailer
  const createMutation = useMutation({
    mutationFn: (data: RetailerFormData) => retailerAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retailers'] });
      toast.success('Retailer created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create retailer');
    },
  });

  // Update retailer
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RetailerFormData> }) =>
      retailerAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retailers'] });
      toast.success('Retailer updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update retailer');
    },
  });

  // Delete retailer
  const deleteMutation = useMutation({
    mutationFn: (id: string) => retailerAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retailers'] });
      toast.success('Retailer deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete retailer');
    },
  });

  // Search handler with debouncing
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  }, []);

  // Handler functions
  const handleCreate = useCallback(
    async (data: RetailerFormData) => {
      await createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const handleUpdate = useCallback(
    async (id: string, data: Partial<RetailerFormData>) => {
      await updateMutation.mutateAsync({ id, data });
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  // Handler for page changes
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    retailers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    createRetailer: handleCreate,
    updateRetailer: handleUpdate,
    deleteRetailer: handleDelete,
  isCreating: createMutation.isPending,
  isUpdating: updateMutation.isPending,
  isDeleting: deleteMutation.isPending,
    // Pagination props
    page,
    limit,
    totalPages,
    totalItems,
    onPageChange: handlePageChange,
  };
}