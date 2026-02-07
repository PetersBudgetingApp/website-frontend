import { describe, expect, it } from 'vitest';
import { isBudgetEligibleTransaction } from '@domain/transactions';
describe('transaction budget eligibility', () => {
    it('excludes transfer and excluded transactions', () => {
        expect(isBudgetEligibleTransaction({
            amount: -30,
            internalTransfer: true,
            excludeFromTotals: false,
        })).toBe(false);
        expect(isBudgetEligibleTransaction({
            amount: -30,
            internalTransfer: false,
            excludeFromTotals: true,
        })).toBe(false);
    });
    it('includes normal outflow transactions', () => {
        expect(isBudgetEligibleTransaction({
            amount: -25,
            internalTransfer: false,
            excludeFromTotals: false,
        })).toBe(true);
    });
});
