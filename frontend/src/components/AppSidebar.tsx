import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  MessageSquare,
  BarChart3,
  Settings,
  ShieldPlus,
  Package,
  ShoppingCart,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

const adminMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Retailers', url: '/retailers', icon: Users },
  { title: 'Projects', url: '/projects', icon: FolderKanban },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Settings',   url: '/settings', icon: Settings },
];

// Retailers get their own dashboard + business's projects only — no access
// to the full retailer directory or platform-wide analytics.
const retailerMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Projects', url: '/projects', icon: FolderKanban },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { user } = useAuth();
  const items = user?.role === 'retailer'
    ? retailerMenuItems
    : user?.role === 'superadmin'
      ? [...adminMenuItems, { title: 'Create Admin/Staff', url: '/admin/users', icon: ShieldPlus }]
      : adminMenuItems;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/OIP.webp" alt="Bailord Pulse" className="h-10 w-10 rounded-lg" />
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">Bailord Pulse</h2>
            <p className="text-xs text-sidebar-foreground/70">Retailer Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
