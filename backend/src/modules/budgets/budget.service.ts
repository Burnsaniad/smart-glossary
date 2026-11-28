import { PaymentStatus } from '../../generated/prisma/index.js';
import { getPrisma } from '../../lib/db.js';
import type { CheckMonthlyBudgetInput, SetMonthlyBudgetInput } from './budget.schemas.js';

function decimalToCents(value: string | number): number {
  const text = typeof value === 'string' ? value : value.toFixed(2);
  const [whole = '0', fraction = '0'] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

function centsToDecimal(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${String(Math.floor(absolute / 100))}.${fraction}`;
}

export function currentMonth(): string {
  const now = new Date();
  return `${String(now.getUTCFullYear())}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function setMonthlyBudget(customerId: string, input: SetMonthlyBudgetInput) {
  return getPrisma().monthlyBudget.upsert({
    where: {
      customerId_month: { customerId, month: input.month },
    },
    create: { customerId, month: input.month, amount: input.amount },
    update: { amount: input.amount },
  });
}

export async function getMonthlyBudget(customerId: string, month: string) {
  return getPrisma().monthlyBudget.findUnique({
    where: { customerId_month: { customerId, month } },
  });
}

async function getConfirmedSpending(customerId: string, month: string): Promise<number> {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return 0;
  const next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 1);

  const payments = await getPrisma().payment.findMany({
    where: {
      status: PaymentStatus.CONFIRMED,
      confirmedAt: { gte: start, lt: next },
      order: { customerId, status: 'COMPLETED' },
    },
    select: { amount: true },
  });
  return payments.reduce((total, payment) => total + decimalToCents(payment.amount.toString()), 0);
}

export async function checkMonthlyBudget(customerId: string, input: CheckMonthlyBudgetInput) {
  const budget = await getMonthlyBudget(customerId, input.month);
  const spentCents = await getConfirmedSpending(customerId, input.month);
  const estimatedCents = decimalToCents(input.estimatedTotal);
  const budgetCents = budget ? decimalToCents(budget.amount.toString()) : 0;
  const remainingBeforeEstimateCents = budgetCents - spentCents;
  const remainingAfterEstimateCents = remainingBeforeEstimateCents - estimatedCents;

  return {
    month: input.month,
    budgetConfigured: budget !== null,
    budgetAmount: budget ? centsToDecimal(budgetCents) : null,
    spentAmount: centsToDecimal(spentCents),
    estimatedTotal: centsToDecimal(estimatedCents),
    remainingBeforeEstimate: centsToDecimal(remainingBeforeEstimateCents),
    remainingAfterEstimate: centsToDecimal(remainingAfterEstimateCents),
    isOverBudget: budget !== null && remainingAfterEstimateCents < 0,
    requiresConfirmation: budget !== null && remainingAfterEstimateCents < 0,
  };
}
