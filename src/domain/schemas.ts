import { z } from 'zod';

type CategoryNode = {
  id: number;
  parentId?: number | null;
  name: string;
  icon?: string | null;
  color?: string | null;
  categoryType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  system: boolean;
  children?: CategoryNode[] | null;
};

export const apiErrorSchema = z.object({
  status: z.number(),
  message: z.string(),
  timestamp: z.string().optional(),
  errors: z.record(z.string()).optional(),
});

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
});

export const authSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string(),
  expiresIn: z.number(),
  user: userSchema,
});

export const authMeSchema = userSchema;

export const accountSchema = z.object({
  id: z.number(),
  name: z.string(),
  institutionName: z.string().nullable().optional(),
  accountType: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'LOAN', 'INVESTMENT', 'OTHER']),
  currency: z.string(),
  currentBalance: z.number(),
  availableBalance: z.number().nullable().optional(),
  balanceUpdatedAt: z.string().nullable().optional(),
  active: z.boolean(),
});

export const accountSummarySchema = z.object({
  totalAssets: z.number(),
  totalLiabilities: z.number(),
  netWorth: z.number(),
  accounts: z.array(accountSchema),
});

export const categorySchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({
    id: z.number(),
    parentId: z.number().nullable().optional(),
    name: z.string(),
    icon: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    categoryType: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    system: z.boolean(),
    children: z.array(categorySchema).nullable().optional(),
  }),
);

export const connectionSchema = z.object({
  id: z.number(),
  institutionName: z.string().nullable().optional(),
  lastSyncAt: z.string().nullable().optional(),
  syncStatus: z.enum(['PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED']),
  errorMessage: z.string().nullable().optional(),
  accountCount: z.number(),
});

export const syncResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  accountsSynced: z.number(),
  transactionsAdded: z.number(),
  transactionsUpdated: z.number(),
  transfersDetected: z.number(),
  syncedAt: z.string(),
});

export const transactionSchema = z.object({
  id: z.number(),
  accountId: z.number(),
  accountName: z.string().nullable().optional(),
  postedAt: z.string(),
  transactedAt: z.string().nullable().optional(),
  amount: z.number(),
  pending: z.boolean(),
  description: z.string().nullable().optional(),
  payee: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  category: categorySchema.nullable().optional(),
  manuallyCategorized: z.boolean(),
  internalTransfer: z.boolean(),
  excludeFromTotals: z.boolean(),
  transferPairId: z.number().nullable().optional(),
  transferPairAccountName: z.string().nullable().optional(),
  recurring: z.boolean(),
  notes: z.string().nullable().optional(),
});

export const transactionCoverageSchema = z.object({
  totalTransactions: z.number(),
  oldestPostedAt: z.string().nullable().optional(),
  newestPostedAt: z.string().nullable().optional(),
});

export const spendingByCategorySchema = z.object({
  totalSpending: z.number(),
  categories: z.array(
    z.object({
      categoryId: z.number().nullable().optional(),
      categoryName: z.string(),
      categoryColor: z.string(),
      amount: z.number(),
      percentage: z.number(),
      transactionCount: z.number(),
    }),
  ),
});

export const trendSchema = z.object({
  trends: z.array(
    z.object({
      month: z.string(),
      income: z.number(),
      expenses: z.number(),
      transfers: z.number(),
      netCashFlow: z.number(),
    }),
  ),
});

export const cashFlowSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  totalIncome: z.number(),
  totalExpenses: z.number(),
  totalTransfers: z.number(),
  netCashFlow: z.number(),
  savingsRate: z.number(),
});

export const transferPairSchema = z.object({
  fromTransactionId: z.number(),
  fromAccountName: z.string(),
  toTransactionId: z.number(),
  toAccountName: z.string(),
  amount: z.number(),
  date: z.string(),
  description: z.string().nullable().optional(),
  autoDetected: z.boolean(),
});

export const recurringPatternSchema = z.object({
  id: z.number(),
  name: z.string(),
  merchantPattern: z.string().nullable().optional(),
  expectedAmount: z.number(),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  dayOfMonth: z.number().nullable().optional(),
  nextExpectedDate: z.string().nullable().optional(),
  category: categorySchema.nullable().optional(),
  bill: z.boolean(),
  active: z.boolean(),
  lastOccurrenceAt: z.string().nullable().optional(),
});

export const upcomingBillSchema = z.object({
  patternId: z.number(),
  name: z.string(),
  expectedAmount: z.number(),
  dueDate: z.string().nullable().optional(),
  daysUntilDue: z.number(),
  category: categorySchema.nullable().optional(),
  overdue: z.boolean(),
});
