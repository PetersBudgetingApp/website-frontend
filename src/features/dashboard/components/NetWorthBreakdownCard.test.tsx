import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NetWorthBreakdownCard } from '@features/dashboard/components/NetWorthBreakdownCard';

describe('NetWorthBreakdownCard', () => {
  it('groups account rows into asset and liability sections', () => {
    render(
      <MemoryRouter>
      <NetWorthBreakdownCard
        summary={{
          totalAssets: 150,
          totalLiabilities: 75,
          netWorth: 75,
          accounts: [
            {
              id: 1,
              name: 'RBC Checking 1',
              institutionName: 'RBC',
              accountType: 'CHECKING',
              currency: 'USD',
              currentBalance: 100,
              active: true,
            },
            {
              id: 2,
              name: 'RBC Loan 1',
              institutionName: 'RBC',
              accountType: 'LOAN',
              currency: 'USD',
              currentBalance: -60,
              active: true,
            },
            {
              id: 3,
              name: 'Wealthsimple Cash',
              institutionName: 'Wealthsimple',
              accountType: 'OTHER',
              currency: 'USD',
              currentBalance: 30,
              active: true,
            },
            {
              id: 4,
              name: 'Unknown Liability',
              accountType: 'OTHER',
              currency: 'USD',
              currentBalance: -15,
              active: true,
            },
            {
              id: 5,
              name: 'Unknown Asset',
              accountType: 'OTHER',
              currency: 'USD',
              currentBalance: 20,
              active: true,
            },
          ],
        }}
      />
      </MemoryRouter>,
    );

    expect(screen.getByText('Net Worth Breakdown')).toBeInTheDocument();
    expect(screen.getAllByText('$75.00')).toHaveLength(2);

    expect(screen.getAllByText('RBC')).toHaveLength(2);
    expect(screen.getByText('Wealthsimple')).toBeInTheDocument();
    expect(screen.getAllByText('Unknown institution')).toHaveLength(2);

    expect(screen.getByText('RBC Checking 1')).toBeInTheDocument();
    expect(screen.getByText('RBC Loan 1')).toBeInTheDocument();
    expect(screen.getByText('Wealthsimple Cash')).toBeInTheDocument();
    expect(screen.getByText('Unknown Asset')).toBeInTheDocument();
    expect(screen.getByText('Unknown Liability')).toBeInTheDocument();

    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });
});
