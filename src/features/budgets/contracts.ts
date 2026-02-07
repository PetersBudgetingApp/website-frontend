export interface BudgetTargetDto {
  categoryId: number;
  targetAmount: number;
  notes?: string;
}

export interface BudgetMonthDto {
  month: string;
  currency: string;
  targets: BudgetTargetDto[];
}

// Backend endpoints:
// GET /api/v1/budgets?month=YYYY-MM
// PUT /api/v1/budgets/{month}
// DELETE /api/v1/budgets/{month}/categories/{categoryId}
