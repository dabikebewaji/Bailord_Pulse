import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  // Signed change vs. last month. 0 renders as a neutral indicator rather
  // than a false "decline" — there's no meaningful up/down at exactly 0%.
  trend?: {
    value: number;
  };
  description?: string;
}

const MetricCard = ({ title, value, icon: Icon, trend, description }: MetricCardProps) => {
  const trendColor =
    trend && trend.value > 0 ? 'text-success' : trend && trend.value < 0 ? 'text-destructive' : 'text-muted-foreground';
  const trendArrow = trend && trend.value > 0 ? '↑' : trend && trend.value < 0 ? '↓' : '→';

  return (
    <Card className="card-shadow hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs mt-1 ${trendColor}`}>
            {trendArrow} {Math.abs(trend.value)}% from last month
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
