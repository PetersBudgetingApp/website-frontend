import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SummaryCards } from '@features/dashboard/components/SummaryCards';
describe('SummaryCards', () => {
    it('renders all financial summary cards', () => {
        render(_jsx(SummaryCards, { netWorth: 1000, income: 5000, expenses: 2200, savingsRate: 56 }));
        expect(screen.getByText('Net Worth')).toBeInTheDocument();
        expect(screen.getByText('Income')).toBeInTheDocument();
        expect(screen.getByText('Expenses')).toBeInTheDocument();
        expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    });
});
