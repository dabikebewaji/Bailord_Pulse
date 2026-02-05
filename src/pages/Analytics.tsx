import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui/card';
import { Chart } from '../components/ui/chart';
import MetricCard from '../components/MetricCard';
import ChartCard from '../components/ChartCard';

interface AnalyticsData {
  totalRetailers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  retailerTrends: {
    labels: string[];
    data: number[];
  };
  projectTrends: {
    labels: string[];
    data: number[];
  };
  performanceMetrics: {
    onTimeDelivery: number;
    customerSatisfaction: number;
    qualityScore: number;
  };
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
            <p className="mt-2">{error}</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!analyticsData) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Retailers"
            value={analyticsData.totalRetailers}
            trend={5}
            description="Total number of registered retailers"
          />
          <MetricCard
            title="Total Projects"
            value={analyticsData.totalProjects}
            trend={8}
            description="Total projects in the system"
          />
          <MetricCard
            title="Active Projects"
            value={analyticsData.activeProjects}
            trend={3}
            description="Currently active projects"
          />
          <MetricCard
            title="Completed Projects"
            value={analyticsData.completedProjects}
            trend={2}
            description="Successfully completed projects"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Retailer Growth Trends"
            chart={
              <Chart
                type="line"
                data={{
                  labels: analyticsData.retailerTrends.labels,
                  datasets: [{
                    label: 'New Retailers',
                    data: analyticsData.retailerTrends.data,
                    borderColor: 'rgb(99, 102, 241)',
                    tension: 0.3,
                  }]
                }}
                className="w-full h-[300px]"
              />
            }
          />
          <ChartCard
            title="Project Completion Trends"
            chart={
              <Chart
                type="bar"
                data={{
                  labels: analyticsData.projectTrends.labels,
                  datasets: [{
                    label: 'Completed Projects',
                    data: analyticsData.projectTrends.data,
                    backgroundColor: 'rgb(99, 102, 241)',
                  }]
                }}
                className="w-full h-[300px]"
              />
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">On-Time Delivery</h3>
            <div className="text-3xl font-bold text-primary">
              {analyticsData.performanceMetrics.onTimeDelivery}%
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Satisfaction</h3>
            <div className="text-3xl font-bold text-primary">
              {analyticsData.performanceMetrics.customerSatisfaction}%
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quality Score</h3>
            <div className="text-3xl font-bold text-primary">
              {analyticsData.performanceMetrics.qualityScore}%
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}