import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Store, Package, MessageSquare, Loader2, X, User, Users } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useSearch } from '@/store/use-search';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandShortcut,
} from '@/components/ui/command';
import { searchAPI, type SearchResponse, retailerAPI, projectAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

type SearchResultType = 'retailer' | 'project' | 'message' | 'conversation' | 'user';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
type BadgeColor = 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'gray';

interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  url: string;
  subtitle?: string;
  timestamp?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  badgeColor?: BadgeColor;
}

interface RetailerResult extends BaseSearchResult {
  type: 'retailer';
  metrics?: {
    orders?: number;
    revenue?: number;
    lastOrder?: string;
  };
}

interface ProjectResult extends BaseSearchResult {
  type: 'project';
}

interface MessageResult extends BaseSearchResult {
  type: 'message' | 'conversation';
}

interface UserResult extends BaseSearchResult {
  type: 'user';
}

type SearchResult = RetailerResult | ProjectResult | MessageResult | UserResult;

const getBadgeStyles = (color: BadgeColor) => {
  const styles = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return styles[color] || styles.gray;
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    isOpen,
    query,
    results,
    isLoading,
    setOpen,
    setQuery,
    setResults,
    setLoading,
  } = useSearch();

  const debouncedQuery = useDebounce(query);

  // Simple in-memory cache for fallback results
  // Cached for 5 minutes to reduce network calls
  const FALLBACK_TTL = 1000 * 60 * 5;
  // Module-level cache object (safe enough for dev server)
  // eslint-disable-next-line no-var
  if (!(globalThis as any).__globalSearchFallbackCache) {
    (globalThis as any).__globalSearchFallbackCache = { ts: 0, results: [] };
  }
  const fallbackCache = (globalThis as any).__globalSearchFallbackCache as { ts: number; results: SearchResult[] };

  const performSearch = useCallback(async (searchQuery: string, allowEmpty = false) => {
    if ((!searchQuery || searchQuery.trim().length === 0) && !allowEmpty) {
      setResults([]);
      return;
    }

    // Only show auth error if user actively tries to search
    if (!isAuthenticated && searchQuery.trim().length > 0) {
      setOpen(false);
      toast.error('Please login to use search');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await searchAPI.search(searchQuery);
      
      // Transform raw search results into the expected format
      const transformedResults = data.results.map((result: any) => {
        const base = {
          id: result.id,
          type: result.type,
          title: result.name || result.title || result.subject || '',
          url: getResultUrl(result),
        };

        // Add type-specific properties
        switch (result.type) {
          case 'retailer':
            return {
              ...base,
              subtitle: [
                result.businessType,
                result.location,
                result.metrics?.orders ? `${result.metrics.orders} orders` : null,
                result.metrics?.revenue ? formatCurrency(result.metrics.revenue) : null
              ].filter(Boolean).join(' • '),
              timestamp: getRelativeTime(result.lastInteraction || result.createdAt),
              metrics: result.metrics || {},
              badge: result.status,
              badgeColor: result.status?.toLowerCase() === 'active' ? 'green' : 
                         result.status?.toLowerCase() === 'pending' ? 'yellow' : 'gray'
            };
          case 'project':
            return {
              ...base,
              subtitle: `Due ${new Date(result.dueDate).toLocaleDateString()}`,
              timestamp: getRelativeTime(result.dueDate),
              badge: result.status,
              badgeColor: result.status?.toLowerCase() === 'completed' ? 'green' :
                         result.status?.toLowerCase() === 'in-progress' ? 'blue' :
                         result.status?.toLowerCase() === 'overdue' ? 'red' : 'gray'
            };
          case 'message':
          case 'conversation':
            return {
              ...base,
              subtitle: result.excerpt || result.lastMessage,
              timestamp: getRelativeTime(result.timestamp || result.updatedAt),
            };
          case 'user':
            return {
              ...base,
              subtitle: [
                result.role,
                result.department,
                result.lastActive ? `Last active ${getRelativeTime(result.lastActive)}` : null
              ].filter(Boolean).join(' • '),
              badge: result.role,
              badgeColor: result.role?.toLowerCase() === 'admin' ? 'purple' :
                         result.role?.toLowerCase() === 'manager' ? 'blue' : 'gray'
            };
          default:
            return base;
        }
      });

  setResults(transformedResults);
    } catch (error: any) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [setResults, setLoading]);

  // Helper function to generate URLs based on result type
  const getResultUrl = (result: any): string => {
    switch (result.type) {
      case 'retailer':
        return `/retailers/${result.id}`;
      case 'project':
        return `/projects/${result.id}`;
      case 'message':
      case 'conversation':
        return `/messages/${result.conversationId || result.id}`;
      case 'user':
        return `/users/${result.id}`;
      default:
        return '/';
    }
  };

  // Trigger search when the query changes (debounced)
  useEffect(() => {
    if (isAuthenticated && debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery, performSearch, isAuthenticated]);

  // When the dialog opens with no query, fetch initial suggestions/top results
  useEffect(() => {
    if (isOpen && isAuthenticated && (!query || query.trim().length === 0)) {
      const fetchFallbackResults = async () => {
        // Use cached results if fresh
          if (Date.now() - fallbackCache.ts < FALLBACK_TTL && fallbackCache.results.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setResults(fallbackCache.results as any);
          return;
        }

        setLoading(true);
        try {
          // Fetch a few top retailers and projects in parallel
          const [retRes, projRes] = await Promise.all([
            retailerAPI.getAll(1, 6),
            projectAPI.getAll(),
          ]);

          const retailers = Array.isArray(retRes.data?.data) ? retRes.data.data :
                        Array.isArray(retRes.data) ? retRes.data : [];
          const projects = Array.isArray(projRes.data?.data) ? projRes.data.data :
                        Array.isArray(projRes.data) ? projRes.data : [];

          const transformed: SearchResult[] = [];

          retailers.slice?.(0, 6)?.forEach((r) => {
            transformed.push({
              id: String(r.id),
              type: 'retailer',
              title: r.businessName || r.name || r.id,
              url: `/retailers/${r.id}`,
              subtitle: [r.businessType, r.location].filter(Boolean).join(' • '),
              timestamp: r.lastInteraction || r.createdAt,
              badge: r.status,
              badgeColor: r.status?.toLowerCase() === 'active' ? 'green' : 'gray',
            } as SearchResult);
          });

          projects.slice(0, 6).forEach((p) => {
            transformed.push({
              id: String(p.id),
              type: 'project',
              title: p.name || p.id,
              url: `/projects/${p.id}`,
              subtitle: p.dueDate ? `Due ${new Date(p.dueDate).toLocaleDateString()}` : undefined,
              timestamp: p.updatedAt || p.createdAt,
              badge: p.status,
              badgeColor: p.status?.toLowerCase() === 'completed' ? 'green' : 'blue',
            } as SearchResult);
          });

          // Cache and set
          fallbackCache.ts = Date.now();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fallbackCache.results = transformed as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setResults(transformed as any);
        } catch (err) {
          console.error('Fallback search error:', err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      };

      fetchFallbackResults();
    }
  }, [isOpen, isAuthenticated, query, performSearch]);

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'retailer':
        return <Store className="h-4 w-4" />;
      case 'project':
        return <Package className="h-4 w-4" />;
      case 'message':
      case 'conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const handleSelect = (result: any) => {
    setOpen(false);
    navigate(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close on escape
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
    // Enter on input focuses first result
    if (e.key === 'Enter' && results.length > 0) {
      const firstResult = results[0];
      handleSelect(firstResult);
    }
  };

  // Format relative time (e.g., "2 days ago")
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const handleOpen = useCallback((open: boolean) => {
    if (open && !isAuthenticated) {
      toast.error('Please login to use search');
      navigate('/login');
      return;
    }
    setOpen(open);
  }, [isAuthenticated, navigate, setOpen]);

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpen} aria-label="Search Dialog">
      <CommandInput 
        id="search-title"
        aria-label="Search"
        title="Global Search"
      />
      <div className="flex items-center border-b px-3">
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search retailers, projects, messages... (Press ↵ to open)"
          className="border-0 focus:ring-0"
        />
        <div className="flex items-center gap-2">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded-sm opacity-50 hover:opacity-100"
              title="Clear search (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
      <CommandList>
        {isLoading ? (
          <CommandLoading>
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </CommandLoading>
        ) : results.length > 0 ? (
          <>
            {results.some((r) => r.type === 'retailer') && (
              <CommandGroup heading="Retailers">
                {results
                  .filter((r) => r.type === 'retailer')
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-2"
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{result.title}</span>
                          {result.badge && result.badgeColor && (
                            <Badge variant="outline" className={cn(getBadgeStyles(result.badgeColor))}>
                              {result.badge}
                            </Badge>
                          )}
                        </div>
                        {result.subtitle && (
                          <div className="truncate text-sm text-muted-foreground">
                            {result.subtitle}
                          </div>
                        )}
                        {'metrics' in result && result.metrics && (
                          <div className="flex items-center gap-2 mt-1">
                            {result.metrics.orders && (
                              <span className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                                {result.metrics.orders} orders
                              </span>
                            )}
                            {result.metrics.revenue && (
                              <span className="text-xs bg-green-50 text-green-800 px-2 py-0.5 rounded-full">
                                {formatCurrency(result.metrics.revenue)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {result.timestamp && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {result.timestamp}
                        </span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
            
            {results.some((r) => r.type === 'project') && (
              <CommandGroup heading="Projects">
                {results
                  .filter((r) => r.type === 'project')
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-2"
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{result.title}</span>
                          {result.badge && (
                            <Badge variant="outline" className={`bg-${result.badgeColor}-100 text-${result.badgeColor}-800 border-${result.badgeColor}-200`}>
                              {result.badge}
                            </Badge>
                          )}
                        </div>
                        {result.subtitle && (
                          <div className="truncate text-sm text-muted-foreground">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {result.timestamp && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {result.timestamp}
                        </span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {results.some((r) => r.type === 'message' || r.type === 'conversation') && (
              <CommandGroup heading="Messages">
                {results
                  .filter((r) => r.type === 'message' || r.type === 'conversation')
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-2"
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="truncate text-sm text-muted-foreground">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {result.timestamp && (
                        <span className="text-sm text-muted-foreground">
                          {result.timestamp}
                        </span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {results.some((r) => r.type === 'user') && (
              <CommandGroup heading="Users">
                {results
                  .filter((r) => r.type === 'user')
                  .map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-2"
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="truncate text-sm text-muted-foreground">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {result.timestamp && (
                        <span className="text-sm text-muted-foreground">
                          {result.timestamp}
                        </span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </>
        ) : query.length > 0 ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <CommandEmpty>
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type to search users, retailers, projects, messages and more...
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="mb-1">• Search users by name, role, or department</div>
                <div className="mb-1">• Find retailers by name, type, status, or location</div>
                <div className="mb-1">• Press ⌘K or Ctrl+K to open search anywhere</div>
                <div className="mb-1">• Use arrow keys to navigate results</div>
                <div>• Press Enter to select or Esc to dismiss</div>
              </div>
            </div>
          </CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  );
}