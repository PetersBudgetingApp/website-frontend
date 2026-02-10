import { formatCurrency } from '@domain/format';
import type { BudgetInsightsDto } from '@shared/api/endpoints/analytics';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { EmptyState } from '@shared/ui/EmptyState';
import { Spinner } from '@shared/ui/Spinner';
import { toMtdNarrative, toRecommendationLabel } from '@features/dashboard/budgetInsightsText';

interface BudgetInsightsPanelProps {
  insights?: BudgetInsightsDto;
  isLoading: boolean;
  isError: boolean;
  applyingCategoryId: number | null;
  statusMessage: string | null;
  onApplyRecommendation: (categoryId: number, recommendedBudget: number, categoryName: string) => void;
  onOpenDetails: (categoryId: number) => void;
}

export function BudgetInsightsPanel({
  insights,
  isLoading,
  isError,
  applyingCategoryId,
  statusMessage,
  onApplyRecommendation,
  onOpenDetails,
}: BudgetInsightsPanelProps) {
  return (
    <Card title="Budget Alignment Insights" className="budget-insights-card">
      {isLoading ? (
        <Spinner />
      ) : isError || !insights ? (
        <EmptyState
          title="Could not load budget insights"
          description="Try refreshing after transactions sync, or check back in a few moments."
        />
      ) : insights.categories.length === 0 ? (
        <EmptyState
          title="No spend insights yet"
          description="Add budget targets and transaction history to unlock category recommendations."
        />
      ) : (
        <div className="budget-insights-layout">
          <div className="budget-insights-summary">
            <article className="budget-insights-summary-item">
              <p className="subtle">Current Budget Total</p>
              <p className="number">{formatCurrency(insights.totalCurrentBudget)}</p>
            </article>
            <article className="budget-insights-summary-item">
              <p className="subtle">Recommended Total</p>
              <p className="number">{formatCurrency(insights.totalRecommendedBudget)}</p>
            </article>
            <article className="budget-insights-summary-item">
              <p className="subtle">Net Change</p>
              <p
                className={`number ${
                  insights.totalRecommendedBudget > insights.totalCurrentBudget
                    ? 'budget-insights-number-up'
                    : insights.totalRecommendedBudget < insights.totalCurrentBudget
                      ? 'budget-insights-number-down'
                      : ''
                }`}
              >
                {formatCurrency(insights.totalRecommendedBudget - insights.totalCurrentBudget)}
              </p>
            </article>
          </div>

          {statusMessage ? <p className="subtle budget-insights-status">{statusMessage}</p> : null}

          <div className="budget-insights-grid">
            {insights.categories.map((insight) => {
              const recommendationLabel = toRecommendationLabel(insight.budgetDelta);
              const isOnTarget = Math.abs(insight.budgetDelta) <= 0.01;
              const badgeClass = isOnTarget
                ? 'budget-insights-badge-neutral'
                : insight.budgetDelta > 0
                  ? 'budget-insights-badge-up'
                  : 'budget-insights-badge-down';

              return (
                <article
                  className="budget-insights-item budget-insights-item-clickable"
                  key={insight.categoryId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open details for ${insight.categoryName}`}
                  onClick={() => onOpenDetails(insight.categoryId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOpenDetails(insight.categoryId);
                    }
                  }}
                >
                  <header className="budget-insights-item-header">
                    <div className="budget-insights-item-title">
                      <span
                        className="budget-insights-dot"
                        style={{ backgroundColor: insight.categoryColor ?? '#9CA3AF' }}
                        aria-hidden
                      />
                      <h4>{insight.categoryName}</h4>
                    </div>
                    <span className={`budget-insights-badge ${badgeClass}`}>{recommendationLabel}</span>
                  </header>

                  <div className="budget-insights-metrics">
                    <div className="budget-insights-metric">
                      <p className="subtle">Current Budget</p>
                      <p className="number">{formatCurrency(insight.currentBudget)}</p>
                    </div>
                    <div className="budget-insights-metric">
                      <p className="subtle">Recommended Budget</p>
                      <p className="number">{formatCurrency(insight.recommendedBudget)}</p>
                    </div>
                    <div className="budget-insights-metric">
                      <p className="subtle">Average Spend</p>
                      <p className="number">{formatCurrency(insight.averageMonthlySpend)}</p>
                    </div>
                    <div className="budget-insights-metric">
                      <p className="subtle">Current Spend</p>
                      <p className="number">{formatCurrency(insight.currentMonthSpend)}</p>
                    </div>
                  </div>

                  <p className="budget-insights-narrative subtle">
                    {toMtdNarrative(insight.categoryName, insight.monthToDateDeltaPct, insight.monthToDateSpend)}
                  </p>

                  <div className="budget-insights-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenDetails(insight.categoryId);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isOnTarget || applyingCategoryId !== null}
                      onClick={(event) => {
                        event.stopPropagation();
                        onApplyRecommendation(
                          insight.categoryId,
                          insight.recommendedBudget,
                          insight.categoryName,
                        );
                      }}
                    >
                      {applyingCategoryId === insight.categoryId ? 'Applying...' : 'Apply Recommendation'}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
