import { formatCurrency } from '@domain/format';

export function toRecommendationLabel(delta: number) {
  if (Math.abs(delta) <= 0.01) {
    return 'On target';
  }
  if (delta > 0) {
    return `Increase by ${formatCurrency(delta)}`;
  }
  return `Decrease by ${formatCurrency(Math.abs(delta))}`;
}

export function toMtdNarrative(categoryName: string, monthToDateDeltaPct: number | null | undefined, monthToDateSpend: number) {
  if (monthToDateDeltaPct === null || monthToDateDeltaPct === undefined) {
    if (monthToDateSpend <= 0) {
      return `No spending yet for ${categoryName} this month.`;
    }
    return `You've spent ${formatCurrency(monthToDateSpend)} this month, but there is no historical baseline yet.`;
  }

  if (Math.abs(monthToDateDeltaPct) <= 0.01) {
    return `You've spent in line with your usual pace by this time on ${categoryName}.`;
  }

  const direction = monthToDateDeltaPct > 0 ? 'more' : 'less';
  return `You've spent ${Math.abs(monthToDateDeltaPct).toFixed(1)}% ${direction} than usual by this time on ${categoryName}.`;
}
