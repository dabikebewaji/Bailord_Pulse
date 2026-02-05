import { Card } from './ui/card';
import { ArrowDownIcon, ArrowUpIcon } from '@radix-ui/react-icons';

interface MetricCardProps {
  title: string;
  value: number;
  trend?: number;
  description?: string;
}

export default function MetricCard({ title, value, trend, description }: MetricCardProps) {
  const trendIsPositive = trend && trend > 0;
  
  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-2 flex items-center">
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <span
            className={`ml-2 flex items-center text-sm ${
              trendIsPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trendIsPositive ? (
              <ArrowUpIcon className="mr-1 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="mr-1 h-4 w-4" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </Card>
  );
}