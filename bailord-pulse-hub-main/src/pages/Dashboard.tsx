import { useQuery } from '@tanstack/react-query';
import { Users, FolderKanban, TrendingUp, Activity } from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
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
} from 'chart.js';
import { analyticsAPI } from '@/services/api';
import MetricCard from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  // Default chart data structure
  const defaultData = {
    metrics: {
      totalRetailers: { value: 0, trend: 0 },
      activeProjects: { value: 0, trend: 0 },
      performanceScore: { value: 0, trend: 0 },
      activeUsers: { value: 0, trend: 0 }
    },
    charts: {
      retailerPerformance: {
        labels: [],
        datasets: [
          { data: [] },
          { data: [] }
        ]
      },
      projectDistribution: {
        labels: ['Completed', 'Ongoing', 'Delayed'],
        data: [0, 0, 0]
      },
      revenueGrowth: {
        labels: [],
        data: []
      }
    }
  };

  // Fetch dashboard data with error handling
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      try {
        const { data } = await analyticsAPI.getDashboardStats();
        return {
          ...defaultData,
          ...data,
          charts: {
            ...defaultData.charts,
            ...data?.charts
          },
          metrics: {
            ...defaultData.metrics,
            ...data?.metrics
          }
        };
      } catch (error: any) {
        console.error('Failed to fetch dashboard stats:', error);
        if (error?.response?.status === 500) {
          throw new Error('Server error loading dashboard data. Please try again later.');
        }
        // Return default data for other types of errors
        return defaultData;
      }
    },
    retry: 1, // Allow one retry for transient errors
    initialData: defaultData,
    staleTime: 30000 // Cache data for 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg border bg-card animate-pulse h-[120px]" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg border bg-card animate-pulse h-[300px]" />
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
        label: 'Active Retailers',
        data: dashboardData?.charts.retailerPerformance.datasets[0].data || [],
        backgroundColor: 'hsl(214, 100%, 34%)',
      },
      {
        label: 'New Registrations',
        data: dashboardData?.charts.retailerPerformance.datasets[1].data || [],
        backgroundColor: 'hsl(210, 100%, 50%)',
      },
    ],
  };

  const projectData = {
    labels: dashboardData?.charts.projectDistribution.labels || [],
    datasets: [
      {
        data: dashboardData?.charts.projectDistribution.data || [],
        backgroundColor: [
          'hsl(160, 84%, 39%)', // Completed
          'hsl(210, 100%, 50%)', // Ongoing
          'hsl(38, 92%, 50%)', // Delayed
        ],
      },
    ],
  };

  const monthlyGrowthData = {
    labels: dashboardData?.charts.revenueGrowth.labels || [],
    datasets: [
      {
        label: 'Revenue Growth',
        data: dashboardData?.charts.revenueGrowth.data || [],
        borderColor: 'hsl(214, 100%, 34%)',
        backgroundColor: 'hsla(214, 100%, 34%, 0.1)',
        tension: 0.4,
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
            value={dashboardData?.metrics.totalRetailers.value.toString() || '0'}
            icon={Users}
            trend={{ 
              value: Math.round(dashboardData?.metrics.totalRetailers.trend || 0), 
              isPositive: (dashboardData?.metrics.totalRetailers.trend || 0) > 0 
            }}
          />
          <MetricCard
            title="Active Projects"
            value={dashboardData?.metrics.activeProjects.value.toString() || '0'}
            icon={FolderKanban}
            trend={{ 
              value: Math.round(dashboardData?.metrics.activeProjects.trend || 0),
              isPositive: (dashboardData?.metrics.activeProjects.trend || 0) > 0
            }}
          />
          <MetricCard
            title="Performance Score"
            value={`${dashboardData?.metrics.performanceScore.value || 0}%`}
            icon={TrendingUp}
            trend={{ 
              value: Math.round(dashboardData?.metrics.performanceScore.trend || 0),
              isPositive: (dashboardData?.metrics.performanceScore.trend || 0) > 0
            }}
          />
          <MetricCard
            title="Active Users"
            value={dashboardData?.metrics.activeUsers.value.toString() || '0'}
            icon={Activity}
            trend={{ 
              value: Math.round(dashboardData?.metrics.activeUsers.trend || 0),
              isPositive: (dashboardData?.metrics.activeUsers.trend || 0) > 0
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
                  legend: { position: 'bottom' },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  }
                }
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
                  legend: { position: 'bottom' },
                },
              }}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Revenue Growth Trend"
          description="Monthly revenue performance over the past 6 months"
        >
          <Line
            data={monthlyGrowthData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `$${value.toLocaleString()}`
                  }
                }
              }
            }}
          />
        </ChartCard>
      </div>
  );
};

export default Dashboard;
