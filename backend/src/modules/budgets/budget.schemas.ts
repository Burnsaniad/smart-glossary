import { z } from 'zod';

const monthSchema = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Month must use YYYY-MM format');

const amountSchema = z
  .union([
    z.number().nonnegative(),
    z
      .string()
      .trim()
      .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'Invalid amount'),
  ])
  .transform((value, ctx) => {
    if (typeof value === 'number' && (value.toString().split('.')[1]?.length ?? 0) > 2) {
      ctx.addIssue({ code: 'custom', message: 'Amount must have at most two decimal places' });
      return z.NEVER;
    }
    const amount = typeof value === 'number' ? value.toFixed(2) : value;
    const normalized = amount.includes('.') ? amount : `${amount}.00`;
    const whole = normalized.split('.')[0] ?? '';
    if (whole.length > 10) {
      ctx.addIssue({ code: 'custom', message: 'Amount is out of range' });
      return z.NEVER;
    }
    return normalized;
  });

export const setMonthlyBudgetSchema = z.object({
  month: monthSchema,
  amount: amountSchema,
});

export const checkMonthlyBudgetSchema = z.object({
  month: monthSchema,
  estimatedTotal: amountSchema,
});

export type SetMonthlyBudgetInput = z.infer<typeof setMonthlyBudgetSchema>;
export type CheckMonthlyBudgetInput = z.infer<typeof checkMonthlyBudgetSchema>;
