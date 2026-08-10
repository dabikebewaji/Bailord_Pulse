import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package } from 'lucide-react';
import { orderAPI, Order } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const STATUSES: Order['status'][] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusVariant = (status: Order['status']) => {
  switch (status) {
    case 'delivered':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
};

const Orders = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', filter],
    queryFn: async () => {
      const { data } = await orderAPI.getAll(filter === 'all' ? undefined : filter);
      return data.data.orders;
    },
  });

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    try {
      await orderAPI.updateStatus(order.id, status);
      toast.success(`Order updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage retailer restock orders</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Order['status'] | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading orders...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !orders?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{order.businessName || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-sm">
                            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <span className="text-muted-foreground">{item.productName}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>${Number(order.totalAmount).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleStatusChange(order, v as Order['status'])}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
