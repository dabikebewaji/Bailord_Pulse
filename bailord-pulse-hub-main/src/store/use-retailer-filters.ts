import { create } from 'zustand';

interface RetailerFilters {
  search: string;
  businessType: string | null;
  status: string | null;
  setSearch: (search: string) => void;
  setBusinessType: (type: string | null) => void;
  setStatus: (status: string | null) => void;
  resetFilters: () => void;
}

export const useRetailerFilters = create<RetailerFilters>((set) => ({
  search: '',
  businessType: null,
  status: null,
  setSearch: (search) => set({ search }),
  setBusinessType: (businessType) => set({ businessType }),
  setStatus: (status) => set({ status }),
  resetFilters: () => set({ search: '', businessType: null, status: null }),
}));