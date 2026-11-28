ALTER TABLE "order_change_items"
  DROP CONSTRAINT "order_change_items_proposed_quantity_positive";

ALTER TABLE "order_change_items"
  ADD CONSTRAINT "order_change_items_proposed_quantity_non_negative"
  CHECK ("proposedQuantity" >= 0),
  ADD CONSTRAINT "order_change_items_action_quantity"
  CHECK (
    ("action" = 'REMOVE' AND "proposedQuantity" = 0)
    OR ("action" <> 'REMOVE' AND "proposedQuantity" > 0)
  );
