import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { retailerAPI, projectAPI } from '@/services/api';
import type { useProjects } from '@/hooks/use-projects';
import { toast } from 'sonner';

interface Retailer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  businessName: string;
  businessType: string;
  city: string;
}

interface RetailerAssignmentProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  assignRetailers: ReturnType<typeof useProjects>['assignRetailers'];
  removeRetailer: ReturnType<typeof useProjects>['removeRetailer'];
}

export function RetailerAssignment({
  projectId,
  isOpen,
  onClose,
  assignRetailers,
  removeRetailer,
}: RetailerAssignmentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allRes, assignedRes] = await Promise.all([
        retailerAPI.getAll(1, 100),
        projectAPI.getAssignedRetailers(Number(projectId)),
      ]);

      const allRetailers = ((allRes.data as any).data?.retailers ?? []) as any[];
      const assigned = (assignedRes.data as any as any[]) ?? [];

      setRetailers(
        allRetailers.map((r) => ({
          id: String(r.id),
          name: r.name,
          email: r.email,
          status: r.status,
          businessName: r.businessName,
          businessType: r.businessType,
          city: r.address?.city ?? '',
        }))
      );
      setAssignedIds(new Set(assigned.map((r: any) => String(r.id))));
    } catch (error) {
      console.error('Failed to load retailers:', error);
      toast.error('Failed to load retailers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedRetailers([]);
      loadData();
    }
  }, [isOpen, projectId]);

  const filteredRetailers = retailers.filter((retailer) =>
    retailer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    retailer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    retailer.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignableRetailers = filteredRetailers.filter((r) => !assignedIds.has(r.id));

  const handleAssign = async () => {
    if (selectedRetailers.length === 0) return;
    try {
      setIsSubmitting(true);
      await assignRetailers(projectId, selectedRetailers);
      setSelectedRetailers([]);
      await loadData();
    } catch (error) {
      console.error('Failed to assign retailers:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (retailerId: string, retailerName: string) => {
    try {
      setIsSubmitting(true);
      await removeRetailer(projectId, retailerId, retailerName);
      await loadData();
    } catch (error) {
      console.error('Failed to remove retailer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRetailer = (retailerId: string) => {
    setSelectedRetailers(prev =>
      prev.includes(retailerId)
        ? prev.filter(id => id !== retailerId)
        : [...prev, retailerId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Retailers</DialogTitle>
          <DialogDescription>
            Assign or remove retailers from this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search retailers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleAssign}
            disabled={selectedRetailers.length === 0 || isSubmitting}
          >
            Assign Selected ({selectedRetailers.length})
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      assignableRetailers.length > 0 &&
                      assignableRetailers.every(r => selectedRetailers.includes(r.id))
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRetailers(prev => [
                          ...new Set([...prev, ...assignableRetailers.map(r => r.id)])
                        ]);
                      } else {
                        setSelectedRetailers(prev =>
                          prev.filter(id => !assignableRetailers.find(r => r.id === id))
                        );
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading retailers...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRetailers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No retailers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRetailers.map((retailer) => {
                  const isAssigned = assignedIds.has(retailer.id);
                  return (
                    <TableRow key={retailer.id}>
                      <TableCell>
                        {!isAssigned && (
                          <Checkbox
                            checked={selectedRetailers.includes(retailer.id)}
                            onCheckedChange={() => toggleRetailer(retailer.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{retailer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {retailer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{retailer.businessName}</div>
                          <div className="text-sm text-muted-foreground">
                            {retailer.businessType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{retailer.city}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              retailer.status === 'active'
                                ? 'default'
                                : retailer.status === 'inactive'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {retailer.status}
                          </Badge>
                          {isAssigned && <Badge variant="outline">Assigned</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAssigned && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(retailer.id, retailer.name)}
                            disabled={isSubmitting}
                          >
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
