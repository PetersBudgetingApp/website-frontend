import { formatCurrency, formatPercent } from '@domain/format';
import { Card } from '@shared/ui/Card';

interface SummaryCardsProps {
  income: number;
  expenses: number;
  savingsRate: number;
}

export function SummaryCards({ income, expenses, savingsRate }: SummaryCardsProps) {
  const items = [
    { label: 'Income', value: formatCurrency(income) },
    { label: 'Expenses', value: formatCurrency(expenses) },
    { label: 'Savings Rate', value: formatPercent(savingsRate) },
  ];

  return (
    <section className="grid-cards summary-cards" aria-label="Financial summary cards">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="subtle">{item.label}</p>
          <p className="number" style={{ fontSize: '1.35rem', marginTop: '0.35rem' }}>
            {item.value}
          </p>
        </Card>
      ))}
    </section>
  );
}
