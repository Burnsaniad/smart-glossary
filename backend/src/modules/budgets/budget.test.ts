import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkMonthlyBudget, setMonthlyBudget } from './budget.service.js';

const mocks = vi.hoisted(() => ({
  monthlyBudgetUpsert: vi.fn(),
  monthlyBudgetFindUnique: vi.fn(),
  paymentFindMany: vi.fn(),
}));

vi.mock('../../lib/db.js', () => ({
  getPrisma: () => ({
    monthlyBudget: {
      upsert: mocks.monthlyBudgetUpsert,
      findUnique: mocks.monthlyBudgetFindUnique,
    },
    payment: { findMany: mocks.paymentFindMany },
  }),
}));

describe('monthly budget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets or changes a monthly budget', async () => {
    mocks.monthlyBudgetUpsert.mockResolvedValue({
      id: 'budget-1',
      customerId: 'customer-1',
      month: '2026-11',
      amount: '500.00',
    });

    await expect(
      setMonthlyBudget('customer-1', { month: '2026-11', amount: '500.00' }),
    ).resolves.toMatchObject({ month: '2026-11', amount: '500.00' });
  });

  it('counts only confirmed completed-order payments as spent', async () => {
    mocks.monthlyBudgetFindUnique.mockResolvedValue({
      id: 'budget-1',
      customerId: 'customer-1',
      month: '2026-11',
      amount: '100.00',
    });
    mocks.paymentFindMany.mockResolvedValue([{ amount: '40.25' }, { amount: '10.75' }]);

    const result = await checkMonthlyBudget('customer-1', {
      month: '2026-11',
      estimatedTotal: '55.00',
    });

    expect(result).toMatchObject({
      spentAmount: '51.00',
      remainingAfterEstimate: '-6.00',
      isOverBudget: true,
      requiresConfirmation: true,
    });
  });

  it('returns no over-budget confirmation without a configured budget', async () => {
    mocks.monthlyBudgetFindUnique.mockResolvedValue(null);
    mocks.paymentFindMany.mockResolvedValue([]);

    const result = await checkMonthlyBudget('customer-1', {
      month: '2026-11',
      estimatedTotal: '55.00',
    });

    expect(result).toMatchObject({
      budgetConfigured: false,
      isOverBudget: false,
      requiresConfirmation: false,
    });
  });
});
