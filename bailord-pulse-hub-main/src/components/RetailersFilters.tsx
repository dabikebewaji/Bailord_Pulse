import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRetailerFilters } from '@/store/use-retailer-filters';
import { cn } from '@/lib/utils';

const businessTypes = [
  'Grocery',
  'Electronics',
  'Fashion',
  'Food & Beverage',
  'Health & Beauty',
  'Other',
] as const;

const statuses = [
  'active',
  'inactive',
  'suspended',
] as const;

export function RetailersFilters() {
  const {
    businessType,
    status,
    setBusinessType,
    setStatus,
    resetFilters,
  } = useRetailerFilters();

  const hasFilters = businessType || status;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Business Type</label>
        <Select
          value={businessType || ''}
          onValueChange={(value) => setBusinessType(value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any type</SelectItem>
            {businessTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={status || ''}
          onValueChange={(value) => setStatus(value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any status</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          {businessType && (
            <Badge variant="secondary" className="gap-1">
              {businessType}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setBusinessType(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {status && (
            <Badge variant="secondary" className="gap-1">
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setStatus(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6"
            onClick={resetFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}