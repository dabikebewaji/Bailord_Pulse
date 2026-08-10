import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  FolderKanban,
  TrendingUp,
  Activity,
  Calendar,
  Star,
  Package,
  ShoppingCart,
} from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { useState } from "react";
import {
  analyticsAPI,
  retailerAPI,
  projectAPI,
  orderAPI,
} from "@/services/api";
import MetricCard from "@/components/MetricCard";
import ChartCard from "@/components/ChartCard";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RetailerFormNew } from "@/components/RetailerFormNew";
import { PlaceOrderDialog } from "@/components/PlaceOrderDialog";
import { toast } from "sonner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);

const Dashboard = () => {
  const { user } = useAuth();
  return user?.role === "retailer" ? (
    <RetailerDashboardView />
  ) : (
    <AdminDashboardView />
  );
};

// The original platform-wide dashboard — admin/staff/superadmin only now.
const AdminDashboardView = () => {
  // Default chart data structure
  const defaultData = {
    metrics: {
      totalRetailers: { value: 0, trend: 0 },
      activeProjects: { value: 0, trend: 0 },
      performanceScore: { value: 0, trend: 0 },
      activeUsers: { value: 0, trend: 0 },
    },
    charts: {
      retailerPerformance: {
        labels: [],
        datasets: [{ data: [] }, { data: [] }],
      },
      projectDistribution: {
        labels: ["Completed", "Ongoing", "Delayed"],
        data: [0, 0, 0],
      },
      revenueGrowth: {
        labels: [],
        data: [],
      },
    },
  };

  // Fetch dashboard data with error handling
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      try {
        const { data } = await analyticsAPI.getDashboardStats();
        return {
          ...defaultData,
          ...data,
          charts: {
            ...defaultData.charts,
            ...data?.charts,
          },
          metrics: {
            ...defaultData.metrics,
            ...data?.metrics,
          },
        };
      } catch (error: any) {
        console.error("Failed to fetch dashboard stats:", error);
        if (error?.response?.status === 500) {
          throw new Error(
            "Server error loading dashboard data. Please try again later.",
          );
        }
        // Return default data for other types of errors
        return defaultData;
      }
    },
    retry: 1, // Allow one retry for transient errors
    staleTime: 30000, // Cache data for 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Loading dashboard data...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-lg border bg-card animate-pulse h-[120px]"
            />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-lg border bg-card animate-pulse h-[300px]"
            />
          ))}
        </div>
        <div className="p-6 rounded-lg border bg-card animate-pulse h-[300px]" />
      </div>
    );
  }

  const performanceData = {
    labels: dashboardData?.charts.retailerPerformance.labels || [],
    datasets: [
      {
        label: "Active Retailers",
        data: dashboardData?.charts.retailerPerformance.datasets[0].data || [],
        backgroundColor: "hsl(214, 100%, 34%)",
      },
      {
        label: "New Registrations",
        data: dashboardData?.charts.retailerPerformance.datasets[1].data || [],
        backgroundColor: "hsl(210, 100%, 50%)",
      },
    ],
  };

  const projectData = {
    labels: dashboardData?.charts.projectDistribution.labels || [],
    datasets: [
      {
        data: dashboardData?.charts.projectDistribution.data || [],
        backgroundColor: [
          "hsl(160, 84%, 39%)", // Completed
          "hsl(210, 100%, 50%)", // Ongoing
          "hsl(38, 92%, 50%)", // Delayed
        ],
      },
    ],
  };

  const monthlyGrowthData = {
    labels: dashboardData?.charts.revenueGrowth.labels || [],
    datasets: [
      {
        label: "Revenue Growth",
        data: dashboardData?.charts.revenueGrowth.data || [],
        borderColor: "hsl(214, 100%, 34%)",
        backgroundColor: "hsla(214, 100%, 34%, 0.1)",
        // Straight segments — a smoothed spline overshoots past the actual
        // value on either side of a spike (e.g. one active month among
        // otherwise-zero months), which reads as inaccurate data.
        tension: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your retailer network.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Retailers"
          value={(dashboardData?.metrics.totalRetailers.value ?? 0).toString()}
          icon={Users}
          trend={{
            value: Math.round(dashboardData?.metrics.totalRetailers.trend || 0),
          }}
        />
        <MetricCard
          title="Active Projects"
          value={(dashboardData?.metrics.activeProjects.value ?? 0).toString()}
          icon={FolderKanban}
          trend={{
            value: Math.round(dashboardData?.metrics.activeProjects.trend || 0),
          }}
        />
        <MetricCard
          title="Performance Score"
          value={`${dashboardData?.metrics.performanceScore.value || 0}%`}
          icon={TrendingUp}
          trend={{
            value: Math.round(
              dashboardData?.metrics.performanceScore.trend || 0,
            ),
          }}
        />
        <MetricCard
          title="Active Users"
          value={(dashboardData?.metrics.activeUsers.value ?? 0).toString()}
          icon={Activity}
          trend={{
            value: Math.round(dashboardData?.metrics.activeUsers.trend || 0),
          }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Retailer Performance"
          description="Monthly active retailers and new registrations"
        >
          <Bar
            data={performanceData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </ChartCard>

        <ChartCard
          title="Project Distribution"
          description="Current status of all projects"
        >
          <Doughnut
            data={projectData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
              },
            }}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Revenue Growth Trend"
        description="Monthly revenue performance for the current year (Jan–Dec)"
      >
        <Line
          data={monthlyGrowthData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: "bottom" },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => `$${value.toLocaleString()}`,
                },
              },
            },
          }}
        />
      </ChartCard>
    </div>
  );
};

const statusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "default" as const;
    case "ongoing":
      return "secondary" as const;
    case "delayed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

// A retailer's own view: their business profile + only the projects
// assigned to them. No platform-wide numbers, no other retailers' data.
const RetailerDashboardView = () => {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: retailer, isLoading: isLoadingRetailer } = useQuery({
    queryKey: ["myRetailerProfile"],
    queryFn: async () => {
      const { data } = await retailerAPI.getMine();
      return data.data.retailer;
    },
  });

  const { data: myProjects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["myProjects"],
    queryFn: async () => {
      const { data } = await projectAPI.getMine();
      return data as any[];
    },
  });

  const { data: myOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["myOrders"],
    queryFn: async () => {
      const { data } = await orderAPI.getMine();
      return data.data.orders;
    },
  });

  const handleUpdate = async (formData: any) => {
    try {
      await retailerAPI.updateMine(formData);
      toast.success("Business profile updated");
      queryClient.invalidateQueries({ queryKey: ["myRetailerProfile"] });
      setIsEditOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    }
  };

  if (isLoadingRetailer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Loading your business profile...
          </p>
        </div>
      </div>
    );
  }

  if (!retailer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            No business record is linked to your account yet — contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{retailer.businessName}</h1>
          <p className="text-muted-foreground mt-1">Your business dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={retailer.status === "active" ? "default" : "secondary"}
          >
            {retailer.status}
          </Badge>
          <PlaceOrderDialog
            onOrdered={() =>
              queryClient.invalidateQueries({ queryKey: ["myOrders"] })
            }
          />
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <Button onClick={() => setIsEditOpen(true)}>Edit Profile</Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Business Profile</DialogTitle>
                <DialogDescription>
                  Keep your business details up to date.
                </DialogDescription>
              </DialogHeader>
              <RetailerFormNew
                onSubmit={handleUpdate}
                defaultValues={retailer}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Sales"
          value={`$${Number(retailer.metrics?.totalSales ?? 0).toLocaleString()}`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Orders"
          value={String(retailer.metrics?.totalOrders ?? 0)}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Average Rating"
          value={String(retailer.metrics?.averageRating ?? 0)}
          icon={Star}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            My Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <p className="text-muted-foreground text-sm">Loading projects...</p>
          ) : !myProjects?.length ? (
            <p className="text-muted-foreground text-sm">
              No projects have been assigned to your business yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myProjects.map((project: any) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between mb-0">
                    <span className="font-medium">{project.name}</span>
                    <Badge variant={statusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between pt-7 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {project.start_date} - {project.end_date}
                    </span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            My Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <p className="text-muted-foreground text-sm">Loading orders...</p>
          ) : !myOrders?.length ? (
            <p className="text-muted-foreground text-sm">
              You haven't placed any orders yet — use "Place New Order" above to
              restock.
            </p>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : order.status === "cancelled"
                            ? "destructive"
                            : order.status === "pending"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                            {item.quantity}
                          </span>
                          <span className="font-medium truncate">
                            {item.productName}
                          </span>
                        </div>
                        <div className="text-muted-foreground shrink-0 text-right">
                          <span className="text-xs">
                            ${Number(item.unitPrice).toFixed(2)} each
                          </span>
                          <span className="ml-2 text-foreground font-medium">
                            $
                            {(Number(item.unitPrice) * item.quantity).toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-t">
                    <span className="text-sm text-muted-foreground">
                      Order total
                    </span>
                    <span className="font-semibold">
                      ${Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
