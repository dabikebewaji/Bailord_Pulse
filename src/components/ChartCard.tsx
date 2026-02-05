import { Card } from './ui/card';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  chart: ReactNode;
  description?: string;
}

export default function ChartCard({ title, chart, description }: ChartCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="w-full">{chart}</div>
      {description && (
        <p className="mt-4 text-sm text-muted-foreground">{description}</p>
      )}
    </Card>
  );
}