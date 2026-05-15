// Base interfaces for common fields
interface BaseModel {
  id: number;
  created_at: string;
}

// User model
export interface User extends BaseModel {
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'retailer';
}

// Project model
export interface Project extends BaseModel {
  name: string;
  description?: string;
  status: 'ongoing' | 'completed' | 'delayed';
  start_date?: string;
  end_date?: string;
  progress: number;
  user_id: number;
}

// Retailer model
export interface Retailer extends BaseModel {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  performance: number;
  joined_date: string;
}

// Project-Retailer assignment
export interface ProjectRetailer {
  project_id: number;
  retailer_id: number;
  assigned_at: string;
}

// Form data interfaces
export interface RetailerFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive';
}

export interface ProjectFormData {
  name: string;
  description?: string;
  status?: 'ongoing' | 'completed' | 'delayed';
  start_date?: string;
  end_date?: string;
  progress?: number;
}

// Response interfaces
export interface RetailersResponse {
  data: Retailer[];
  total: number;
  page: number;
  limit: number;
}

export interface RetailerResponse {
  data: Retailer;
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectResponse {
  data: Project;
}

// Analytics interfaces
export interface RetailerMetrics {
  performance: number;
  orders?: number;
  revenue?: number;
  lastOrder?: string;
}

export interface ProjectMetrics {
  progress: number;
  delay_days?: number;
  completion_rate?: number;
  retailer_count?: number;
}

// Message related interfaces
export interface Message extends BaseModel {
  sender_id: number;
  conversation_id: number;
  content: string;
  read_at?: string;
}

export interface Conversation extends BaseModel {
  title?: string;
  last_message_at: string;
  participants: User[];
}

export interface MessageFormData {
  content: string;
  conversation_id: number;
}

export interface ConversationFormData {
  title?: string;
  participant_ids: number[];
}

export interface MessagesResponse {
  data: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface ConversationsResponse {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface AnalyticsResponse {
  metrics: {
    totalRetailers: {
      value: number;
      trend: number;
    };
    activeRetailers: {
      value: number;
      trend: number;
    };
    totalProjects: {
      value: number;
      trend: number;
    };
    activeProjects: {
      value: number;
      trend: number;
    };
  };
  charts: {
    retailerPerformance: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    };
    projectProgress: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    };
  };
}