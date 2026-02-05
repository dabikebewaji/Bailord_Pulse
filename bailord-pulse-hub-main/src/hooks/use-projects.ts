import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useProjectNotifications } from './use-project-notifications';

// Backend response types
interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  status?: string;
  start_date?: string;  // Database uses snake_case
  end_date?: string;    // Database uses snake_case
  user_id?: number;     // Database uses snake_case
  assigned_retailers?: number;
  assigned_retailer_list?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

interface ApiSuccessResponse<T> {
  data: T;
  project?: T;
}

// Frontend types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ongoing' | 'completed' | 'delayed';
  startDate: string;
  endDate: string;
  assignedRetailers: number;
  progress: number;
}

interface CreateProjectData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: 'ongoing' | 'completed' | 'delayed';
  progress?: number;
}

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
      error?: string;
      code?: string;
      sqlMessage?: string;
    };
    status?: number;
  };
  isAxiosError?: boolean;
}

const formatDateForInput = (d?: string) => {
  if (!d) return new Date().toISOString().split('T')[0];
  try {
    // If string contains time portion, convert to yyyy-MM-dd
    if (d.includes('T')) return new Date(d).toISOString().split('T')[0];
    return d;
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

const transformProjectResponse = (p: ProjectResponse): Project => ({
  id: p.id.toString(),
  name: p.name,
  description: p.description,
  status: (p.status || 'ongoing') as Project['status'],
  startDate: formatDateForInput(p.start_date),
  endDate: formatDateForInput(p.end_date),
  assignedRetailers: p.assigned_retailers || 0,
  progress: p.progress || 0,
});

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const notifications = useProjectNotifications();

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<ApiSuccessResponse<ProjectResponse[]>>('/projects');
      // Backend may return either an array directly or an object with `data`.
  const projects = (response.data?.data ?? response.data ?? []) as ProjectResponse[];
  const transformedProjects = projects.map(transformProjectResponse);
      setProjects(transformedProjects);
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error fetching projects:', apiError);
      toast.error(apiError.response?.data?.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data: CreateProjectData) => {
    try {
      setIsLoading(true);
      // Send the expected camelCase fields to the controller. The API attaches
      // the current user via the auth token on the server-side, so don't include user_id.
      const transformedData = {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'ongoing',
      };
      
      console.log('Sending project data:', transformedData); // Debug log
      const response = await api.post<ApiSuccessResponse<ProjectResponse>>('/projects', transformedData);
      
      console.log('Server response:', response.data); // Debug log
      
      // Handle both possible response formats - project field or direct data
      const projectData = response.data.project || response.data.data;
      
      if (!projectData) {
        console.error('Project data is missing from response:', response.data);
        throw new Error('Invalid response from server: Missing project data');
      }
      
      if (!projectData.id) {
        console.error('Project ID is missing from data:', projectData);
        throw new Error('Invalid response from server: Missing project ID');
      }
      
      const project = transformProjectResponse(projectData);
      setProjects(prev => [...prev, project]);
      toast.success('Project created successfully');
      notifications.notifyProjectCreated(project);
      return project;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.response?.data) {
        const errorData = apiError.response.data;
        console.error('Server error details:', {
          message: errorData.message,
          error: errorData.error,
          code: errorData.code,
          sqlMessage: errorData.sqlMessage
        });
      }
      
      // Get the most descriptive error message available
      const errorMessage = apiError.response?.data?.sqlMessage || 
                         apiError.response?.data?.error ||
                         apiError.response?.data?.message ||
                         (apiError.isAxiosError ? 'Network or server error' : 'Failed to create project');
      
      toast.error(errorMessage);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleApiError = (error: ApiError) => {
    if (error.response?.data) {
      const errorData = error.response.data;
      console.error('Server error details:', {
        message: errorData.message,
        error: errorData.error,
        code: errorData.code,
        sqlMessage: errorData.sqlMessage
      });
    }
    
    const errorMessage = error.response?.data?.sqlMessage || 
                       error.response?.data?.error ||
                       error.response?.data?.message ||
                       (error.isAxiosError ? 'Network or server error' : 'Operation failed');
    
    toast.error(errorMessage);
  };

  const updateProject = useCallback(async (projectId: string, data: UpdateProjectData) => {
    try {
      setIsLoading(true);
      const response = await api.put<ApiSuccessResponse<ProjectResponse>>(`/projects/${projectId}`, data);
      const projectData = response.data.project || response.data.data;
      
      if (!projectData) {
        throw new Error('Invalid response from server: Missing project data');
      }
      
      const updatedProject = transformProjectResponse(projectData);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      toast.success('Project updated successfully');
      notifications.notifyProjectUpdated(updatedProject);
      return updatedProject;
    } catch (error) {
      handleApiError(error as ApiError);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      await api.delete(`/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
      notifications.notifyProjectDeleted(project);
    } catch (error) {
      handleApiError(error as ApiError);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assignRetailers = useCallback(async (projectId: string, retailerIds: string[]) => {
    try {
      setIsLoading(true);
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');

      await api.post(`/projects/${projectId}/retailers`, { retailerIds });
      await fetchProjects(); // Refresh to get updated assigned retailers count
      toast.success('Retailers assigned successfully');
      notifications.notifyRetailersAssigned(project, retailerIds.length);
    } catch (error) {
      handleApiError(error as ApiError);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjects]);

  const removeRetailer = useCallback(async (projectId: string, retailerId: string, retailerName: string) => {
    try {
      setIsLoading(true);
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');

      await api.delete(`/projects/${projectId}/retailers/${retailerId}`);
      await fetchProjects(); // Refresh to get updated assigned retailers count
      toast.success('Retailer removed from project');
      notifications.notifyRetailerRemoved(project, retailerName);
    } catch (error) {
      handleApiError(error as ApiError);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjects]);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id) || null;
  }, [projects]);

  return {
    projects,
    isLoading,
    selectedProjectId,
    setSelectedProjectId,
    getProject,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    assignRetailers,
    removeRetailer,
  };
}