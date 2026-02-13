import { formatCurrency, formatPercent } from '@domain/format';
import { Card } from '@shared/ui/Card';

interface SummaryCardsProps {
  income: number;
  expenses: number;
  savingsRate: number;
  onIncomeClick?: () => void;
  onExpensesClick?: () => void;
}

export function SummaryCards({ income, expenses, savingsRate, onIncomeClick, onExpensesClick }: SummaryCardsProps) {
  const items = [
    { label: 'Income', value: formatCurrency(income), onClick: onIncomeClick },
    { label: 'Expenses', value: formatCurrency(expenses), onClick: onExpensesClick },
    { label: 'Savings Rate', value: formatPercent(savingsRate), onClick: undefined },
  ];

  return (
    <section className="grid-cards summary-cards" aria-label="Financial summary cards">
      {items.map((item) => (
        <Card
          key={item.label}
          onClick={item.onClick}
          style={item.onClick ? { cursor: 'pointer' } : undefined}
        >
          <p className="subtle">{item.label}</p>
          <p className="number" style={{ fontSize: '1.35rem', marginTop: '0.35rem' }}>
            {item.value}
          </p>
        </Card>
      ))}
    </section>
  );
}
