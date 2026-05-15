import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, MessageSquare, Loader2, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useRetailerFilters } from '@/store/use-retailer-filters';
import { RetailersFilters } from '@/components/RetailersFilters';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RetailerFormNew } from '@/components/RetailerFormNew';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRetailers } from '@/hooks/use-retailers';
import { Retailer } from '@/types/retailer';

const Retailers = () => {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  
  const {
    businessType,
    status,
    setSearch,
  } = useRetailerFilters();

  // Update search in store when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const {
    retailers,
    isLoading,
    createRetailer,
    updateRetailer,
    deleteRetailer,
    isCreating,
    isUpdating,
    isDeleting,
    page,
    totalPages,
    totalItems,
    onPageChange,
  } = useRetailers({
    search: debouncedSearch,
    businessType: businessType || undefined,
    status: status || undefined,
  });

  const hasActiveFilters = Boolean(businessType || status);
  const activeFilterCount = [businessType, status].filter(Boolean).length;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this retailer?')) {
      await deleteRetailer(id);
    }
  };

  const handleEditOpen = (retailer: Retailer) => {
    setEditingRetailer(retailer);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingRetailer) return;
    try {
      await updateRetailer(editingRetailer.id, data);
      setIsEditDialogOpen(false);
      setEditingRetailer(null);
    } catch (err) {
      // handled by mutation
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Retailers</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your retailer network
            </p>
          </div>
          <Button 
            className="gap-2" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Retailer
          </Button>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Retailer</DialogTitle>
              <DialogDescription>
                Fill out the form below to add a new retailer to your network.
              </DialogDescription>
            </DialogHeader>
            <RetailerFormNew
              onSubmit={async (data) => {
                try {
                  await createRetailer(data);
                  setIsCreateDialogOpen(false);
                } catch (error) {
                  // Error is handled by the mutation
                }
              }}
              isLoading={isCreating}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Retailer</DialogTitle>
              <DialogDescription>Update retailer details below.</DialogDescription>
            </DialogHeader>
            <RetailerFormNew
              onSubmit={handleEditSubmit}
              isLoading={isUpdating}
              defaultValues={editingRetailer ?? undefined}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search retailers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                variant={showFilters ? "secondary" : "outline"}
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-1 px-1.5",
                      showFilters ? "bg-secondary-foreground/20" : "bg-primary"
                    )}
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
            {showFilters && <RetailersFilters />}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Retailer Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading retailers...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : retailers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {searchQuery
                        ? 'No retailers found matching your search'
                        : 'No retailers found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  retailers.map((retailer) => (
                    <TableRow key={retailer.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{retailer.businessName}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages?userId=${retailer.id}`);
                            }}
                            title="Send message"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{retailer.name}</TableCell>
                      <TableCell>{retailer.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            retailer.status === 'active'
                              ? 'default'
                              : retailer.status === 'suspended'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {retailer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{retailer.metrics?.totalOrders ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div
                              className="bg-success h-2 rounded-full"
                              style={{ width: `${((retailer.metrics?.averageRating ?? 0) / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{retailer.metrics?.averageRating ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isDeleting}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/retailers/${retailer.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/messages?userId=${retailer.id}`)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditOpen(retailer)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(retailer.id)}
                              className="text-destructive"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between px-6 pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {retailers.length} of {totalItems} retailers
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1 || isLoading}
                  >
                    <PaginationPrevious />
                  </Button>
                </PaginationItem>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <PaginationItem key={pageNumber}>
                      <Button
                        variant={page === pageNumber ? "default" : "ghost"}
                        size="icon"
                        onClick={() => onPageChange(pageNumber)}
                        disabled={isLoading}
                      >
                        {pageNumber}
                      </Button>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        variant={page === totalPages ? "default" : "ghost"}
                        size="icon"
                        onClick={() => onPageChange(totalPages)}
                        disabled={isLoading}
                      >
                        {totalPages}
                      </Button>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages || isLoading}
                  >
                    <PaginationNext />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
      </div>
  );
};

export default Retailers;
