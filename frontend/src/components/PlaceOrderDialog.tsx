import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Loader2, ShoppingCart } from 'lucide-react';
import { productAPI, orderAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const PlaceOrderDialog = ({ onOrdered }: { onOrdered?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: async () => {
      const { data } = await productAPI.getAll({ activeOnly: true });
      return data.data.products;
    },
    enabled: open,
  });

  const setQuantity = (productId: string, quantity: number, max: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, Math.min(quantity, max)) }));
  };

  const cartItems = Object.entries(quantities).filter(([, qty]) => qty > 0);
  const total = cartItems.reduce((sum, [productId, qty]) => {
    const product = products?.find((p) => p.id === productId);
    return sum + (product ? Number(product.price) * qty : 0);
  }, 0);

  const handleSubmit = async () => {
    if (!cartItems.length) return;
    setIsSubmitting(true);
    try {
      await orderAPI.placeOrder(cartItems.map(([productId, quantity]) => ({ productId, quantity })));
      toast.success('Order placed');
      setQuantities({});
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['myRetailerProfile'] });
      onOrdered?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Place New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Place New Order</DialogTitle>
          <DialogDescription>Pick products and quantities to restock your business.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading catalog...
          </div>
        ) : !products?.length ? (
          <p className="text-muted-foreground text-sm py-6 text-center">No products are available right now.</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const qty = quantities[product.id] ?? 0;
              const outOfStock = product.stockQuantity < 1;
              return (
                <div key={product.id} className="flex items-center justify-between border rounded-lg p-3 gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{product.name}</span>
                      {outOfStock && <Badge variant="secondary">Out of stock</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ₦{Number(product.price).toFixed(2)} · {product.stockQuantity} in stock
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={qty <= 0}
                      onClick={() => setQuantity(product.id, qty - 1, product.stockQuantity)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{qty}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={outOfStock || qty >= product.stockQuantity}
                      onClick={() => setQuantity(product.id, qty + 1, product.stockQuantity)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="font-semibold">Total: ₦{total.toFixed(2)}</span>
          <Button onClick={handleSubmit} disabled={!cartItems.length || isSubmitting}>
            {isSubmitting ? 'Placing order...' : `Place Order (${cartItems.length} item${cartItems.length === 1 ? '' : 's'})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
