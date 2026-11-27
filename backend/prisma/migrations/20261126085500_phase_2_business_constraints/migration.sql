-- Ensure authoritative monetary values and quantities cannot be negative or zero.
ALTER TABLE "products"
  ADD CONSTRAINT "products_price_non_negative"
  CHECK ("price" >= 0);

ALTER TABLE "grocery_list_items"
  ADD CONSTRAINT "grocery_list_items_quantity_positive"
  CHECK ("quantity" > 0);

ALTER TABLE "customer_orders"
  ADD CONSTRAINT "customer_orders_subtotal_non_negative"
  CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "customer_orders_total_non_negative"
  CHECK ("total" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive"
  CHECK ("quantity" > 0),
  ADD CONSTRAINT "order_items_unit_price_non_negative"
  CHECK ("unitPriceSnapshot" >= 0),
  ADD CONSTRAINT "order_items_line_total_non_negative"
  CHECK ("lineTotal" >= 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_non_negative"
  CHECK ("amount" >= 0);

ALTER TABLE "order_change_items"
  ADD CONSTRAINT "order_change_items_current_quantity_positive"
  CHECK ("currentQuantity" IS NULL OR "currentQuantity" > 0),
  ADD CONSTRAINT "order_change_items_proposed_quantity_positive"
  CHECK ("proposedQuantity" > 0);

-- A replacement QR revokes its predecessor, so only one active token may exist per order.
CREATE UNIQUE INDEX "qr_pickups_one_active_per_order"
  ON "qr_pickups"("orderId")
  WHERE "isActive" = true;
