import { TrendingUp, DollarSign, Package, TrendingDown } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import MetricCard from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import { Bar, Line } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/services/api';

const defaultPalette = [
  'hsl(214, 100%, 34%)',
  'hsl(200, 100%, 40%)',
  'hsl(160, 90%, 35%)',
  'hsl(40, 100%, 50%)',
];

const fmtNumber = (v: number | undefined) => (v == null ? '-' : v.toLocaleString());
const fmtPercent = (v: number | undefined) => (v == null ? '-' : `${Math.round(v)}%`);

const Analytics = () => {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsAPI.getDashboardStats().then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const metrics = data?.metrics;
  const charts = data?.charts;

  const retailerPerf = charts?.retailerPerformance;
  const revenueGrowth = charts?.revenueGrowth;

  // Map backend datasets to Chart.js datasets with colors
  const mapDatasets = (ds: any[] | undefined) =>
    (ds || []).map((d: any, i: number) => ({
      label: d.label || `Series ${i + 1}`,
      data: d.data || [],
      borderColor: defaultPalette[i % defaultPalette.length],
      backgroundColor: defaultPalette[i % defaultPalette.length],
      tension: 0.4,
      fill: false,
    }));

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Retailers"
          value={fmtNumber(metrics?.totalRetailers?.value)}
          icon={Package}
          trend={{ value: Math.round(metrics?.totalRetailers?.trend || 0), isPositive: (metrics?.totalRetailers?.trend || 0) >= 0 }}
        />

        <MetricCard
          title="Active Projects"
          value={fmtNumber(metrics?.activeProjects?.value)}
          icon={TrendingUp}
          trend={{ value: Math.round(metrics?.activeProjects?.trend || 0), isPositive: (metrics?.activeProjects?.trend || 0) >= 0 }}
        />

        <MetricCard
          title="Performance Score"
          value={fmtNumber(metrics?.performanceScore?.value)}
          icon={TrendingUp}
          trend={{ value: Math.round(metrics?.performanceScore?.trend || 0), isPositive: (metrics?.performanceScore?.trend || 0) >= 0 }}
        />

        <MetricCard
          title="Active Users"
          value={fmtNumber(metrics?.activeUsers?.value)}
          icon={DollarSign}
          trend={{ value: Math.round(metrics?.activeUsers?.trend || 0), isPositive: (metrics?.activeUsers?.trend || 0) >= 0 }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Retailer Performance" description="Active retailers and new registrations">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading chart…</div>
          ) : retailerPerf ? (
            <Line
              data={{ labels: retailerPerf.labels || [], datasets: mapDatasets(retailerPerf.datasets) }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">No data</div>
          )}
        </ChartCard>

        <ChartCard title="Revenue Growth" description="Estimated revenue growth">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading chart…</div>
          ) : revenueGrowth ? (
            <Bar
              data={{ labels: revenueGrowth.labels || [], datasets: [{ label: 'Revenue', data: revenueGrowth.data || [], backgroundColor: defaultPalette[1] }] }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">No data</div>
          )}
        </ChartCard>
      </div>

      {error && (
        <div className="text-sm text-destructive">Failed to load analytics: {(error as any)?.message || 'Unknown error'}</div>
      )}
    </div>
  );
};

export default Analytics;
