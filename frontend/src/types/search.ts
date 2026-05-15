export interface SearchResult {
  id: string;
  type: 'retailer' | 'project' | 'message';
  title: string;
  subtitle?: string;
  timestamp?: string;
  url: string;
  status?: string;
}

export interface SearchResponse {
  results: SearchResult[];
}