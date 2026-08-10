import { create } from 'zustand';
import { SearchResult } from '@/types/search';

interface SearchStore {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useSearch = create<SearchStore>((set) => ({
  isOpen: false,
  query: '',
  results: [],
  isLoading: false,
  setOpen: (open) => set({ isOpen: open }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ isLoading: loading }),
}));