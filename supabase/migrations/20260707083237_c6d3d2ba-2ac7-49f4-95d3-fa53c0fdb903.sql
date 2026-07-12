-- Allow users to cancel/delete their own PENDING orders (and cascade items via existing FK)
CREATE POLICY orders_owner_delete_pending ON public.orders
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Allow users to delete rows of their own order_items when they own the parent order
CREATE POLICY order_items_owner_delete ON public.order_items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));