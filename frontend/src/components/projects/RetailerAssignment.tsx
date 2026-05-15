import { useState } from 'react';
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
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/use-projects';
import { Checkbox } from '@/components/ui/checkbox';

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
  initialRetailers?: Retailer[];
}

export function RetailerAssignment({
  projectId,
  isOpen,
  onClose,
  initialRetailers = [],
}: RetailerAssignmentProps) {
  const { assignRetailers, removeRetailer } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retailers] = useState<Retailer[]>(initialRetailers);

  const filteredRetailers = retailers.filter((retailer) =>
    retailer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    retailer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    retailer.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (selectedRetailers.length === 0) return;
    try {
      setIsSubmitting(true);
      await assignRetailers(projectId, selectedRetailers);
      onClose();
    } catch (error) {
      console.error('Failed to assign retailers:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (retailerId: string) => {
    try {
      setIsSubmitting(true);
      await removeRetailer(projectId, retailerId);
      setSelectedRetailers(prev => prev.filter(id => id !== retailerId));
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
            Assign Selected
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      filteredRetailers.length > 0 &&
                      filteredRetailers.every(r => selectedRetailers.includes(r.id))
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRetailers(prev => [
                          ...new Set([...prev, ...filteredRetailers.map(r => r.id)])
                        ]);
                      } else {
                        setSelectedRetailers(prev =>
                          prev.filter(id => !filteredRetailers.find(r => r.id === id))
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
              {filteredRetailers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No retailers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRetailers.map((retailer) => (
                  <TableRow key={retailer.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRetailers.includes(retailer.id)}
                        onCheckedChange={() => toggleRetailer(retailer.id)}
                      />
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
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(retailer.id)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}