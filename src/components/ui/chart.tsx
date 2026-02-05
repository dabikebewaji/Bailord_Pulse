import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"

interface ChartProps {
  type: "line" | "bar";
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      tension?: number;
    }>;
  };
  className?: string;
}

export function Chart({ data, className }: ChartProps) {
  // Since we can't install chart.js, we'll create a simple visualization
  const max = Math.max(...data.datasets[0].data);
  
  return (
    <div className={className}>
      <div className="w-full h-full flex items-end gap-2">
        {data.labels.map((label, index) => {
          const value = data.datasets[0].data[index];
          const height = (value / max) * 100;
          
          return (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-primary/20 relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary px-2 py-1 rounded text-sm">
                  {value}
                </div>
              </div>
              <span className="text-xs mt-2 text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}