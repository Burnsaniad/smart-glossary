ALTER TABLE "grocery_lists"
  ADD COLUMN "shopId" TEXT NOT NULL;

ALTER TABLE "grocery_lists"
  ADD CONSTRAINT "grocery_lists_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "shops"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "grocery_lists_shopId_idx"
  ON "grocery_lists"("shopId");

CREATE UNIQUE INDEX "grocery_lists_customerId_shopId_name_key"
  ON "grocery_lists"("customerId", "shopId", "name");

CREATE TABLE "monthly_budgets" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "monthly_budgets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "monthly_budgets"
  ADD CONSTRAINT "monthly_budgets_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "monthly_budgets_customerId_month_key"
  ON "monthly_budgets"("customerId", "month");

CREATE INDEX "monthly_budgets_month_idx"
  ON "monthly_budgets"("month");

ALTER TABLE "monthly_budgets"
  ADD CONSTRAINT "monthly_budgets_amount_non_negative"
  CHECK ("amount" >= 0),
  ADD CONSTRAINT "monthly_budgets_month_format"
  CHECK ("month" ~ '^[0-9]{4}-[0-9]{2}$');
