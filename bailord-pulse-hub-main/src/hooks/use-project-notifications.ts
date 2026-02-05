import { useNotificationsContext } from "@/context/NotificationsContext";
import type { Project } from "./use-projects";

export function useProjectNotifications() {
  const { addNotification } = useNotificationsContext();

  const notifyProjectCreated = (project: Project) => {
    addNotification({
      title: "Project Created",
      message: `New project "${project.name}" has been created`,
      type: "success",
      entityId: project.id,
      entityType: "project"
    });
  };

  const notifyProjectUpdated = (project: Project) => {
    addNotification({
      title: "Project Updated",
      message: `Project "${project.name}" has been updated`,
      type: "project",
      entityId: project.id,
      entityType: "project"
    });
  };

  const notifyProjectDeleted = (project: Project) => {
    addNotification({
      title: "Project Deleted",
      message: `Project "${project.name}" has been deleted`,
      type: "warning",
      entityId: project.id,
      entityType: "project"
    });
  };

  const notifyRetailersAssigned = (project: Project, count: number) => {
    addNotification({
      title: "Retailers Assigned",
      message: `${count} retailer${count === 1 ? '' : 's'} assigned to "${project.name}"`,
      type: "project",
      entityId: project.id,
      entityType: "project"
    });
  };

  const notifyRetailerRemoved = (project: Project, retailerName: string) => {
    addNotification({
      title: "Retailer Removed",
      message: `${retailerName} has been removed from "${project.name}"`,
      type: "project",
      entityId: project.id,
      entityType: "project"
    });
  };

  return {
    notifyProjectCreated,
    notifyProjectUpdated,
    notifyProjectDeleted,
    notifyRetailersAssigned,
    notifyRetailerRemoved
  };
}