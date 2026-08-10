import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Users, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateProjectDialog as CreateProjectDialogComponent } from '@/components/projects/CreateProjectDialog';
import { ProjectDetails } from '@/components/projects/ProjectDetails';
import { RetailerAssignment } from '@/components/projects/RetailerAssignment';
import { useProjects, type Project } from '@/hooks/use-projects';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Projects = () => {
  const { user } = useAuth();
  const isRetailer = user?.role === 'retailer';
  const [searchQuery, setSearchQuery] = useState('');
  const {
    projects,
    isLoading,
    fetchProjects,
    selectedProjectId,
    setSelectedProjectId,
    createProject,
    updateProject,
    deleteProject,
    assignRetailers,
    removeRetailer,
  } = useProjects({ mine: isRetailer });
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showRetailerAssignment, setShowRetailerAssignment] = useState(false);
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'ongoing':
        return 'secondary';
      case 'delayed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isRetailer ? 'My Projects' : 'Projects'}</h1>
            <p className="text-muted-foreground mt-1">
              {isRetailer
                ? 'Projects your business has been assigned to'
                : 'Manage and track all ongoing projects'}
            </p>
          </div>
          {!isRetailer && (
            <div className="flex items-center gap-2">
              <CreateProjectDialogComponent createProject={createProject} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {!isRetailer && (
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No projects match your search'
                : isRetailer
                  ? 'No projects have been assigned to your business yet.'
                  : 'No projects found. Create your first project!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="card-shadow hover-lift cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                      <CardTitle className="text-xl mb-2 flex items-center justify-between">
                        <span>{project.name}</span>
                        {!isRetailer && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProjectId(project.id);
                                  setShowProjectDetails(true);
                                }}
                              >
                                Edit Project
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProjectId(project.id);
                                  setShowRetailerAssignment(true);
                                }}
                              >
                                Manage Retailers
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </CardTitle>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{project.startDate} - {project.endDate}</span>
                  </div>
                  {!isRetailer && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{project.assignedRetailers}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
          {!isRetailer && selectedProject && showProjectDetails && (
            <ProjectDetails
              project={selectedProject}
              isOpen={showProjectDetails}
              updateProject={updateProject}
              deleteProject={deleteProject}
              onClose={() => {
                setShowProjectDetails(false);
                setSelectedProjectId(null);
              }}
            />
          )}
          {!isRetailer && selectedProject && showRetailerAssignment && (
            <RetailerAssignment
              projectId={selectedProject.id}
              isOpen={showRetailerAssignment}
              assignRetailers={assignRetailers}
              removeRetailer={removeRetailer}
              onClose={() => {
                setShowRetailerAssignment(false);
                setSelectedProjectId(null);
              }}
            />
          )}
      </div>
  );
};

export default Projects;
