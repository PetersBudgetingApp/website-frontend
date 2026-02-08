import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@domain/format';
import type { AccountSummaryDto } from '@shared/api/endpoints/accounts';
import { Card } from '@shared/ui/Card';

interface NetWorthBreakdownCardProps {
  summary: AccountSummaryDto;
}

type BreakdownType = 'bank' | 'investment' | 'liability';

interface BreakdownItem {
  id: number;
  name: string;
  institutionName: string;
  amount: number;
}

interface InstitutionGroup {
  institutionName: string;
  total: number;
  accounts: BreakdownItem[];
}

interface BreakdownSection {
  key: BreakdownType;
  title: string;
  emptyMessage: string;
  groups: InstitutionGroup[];
  total: number;
}

function toBreakdownType(netWorthCategory: string): BreakdownType {
  if (netWorthCategory === 'LIABILITY') {
    return 'liability';
  }
  if (netWorthCategory === 'INVESTMENT') {
    return 'investment';
  }
  return 'bank';
}

function getInstitutionName(input?: string | null): string {
  const trimmed = input?.trim();
  return trimmed ? trimmed : 'Unknown institution';
}

function groupByInstitution(accounts: BreakdownItem[]): InstitutionGroup[] {
  const groups = new Map<string, BreakdownItem[]>();

  accounts.forEach((account) => {
    const existing = groups.get(account.institutionName) ?? [];
    existing.push(account);
    groups.set(account.institutionName, existing);
  });

  return Array.from(groups.entries())
    .map(([institutionName, groupedAccounts]) => {
      const sortedAccounts = [...groupedAccounts].sort((a, b) => b.amount - a.amount);
      return {
        institutionName,
        total: sortedAccounts.reduce((sum, account) => sum + account.amount, 0),
        accounts: sortedAccounts,
      };
    })
    .sort((a, b) => b.total - a.total || a.institutionName.localeCompare(b.institutionName));
}

export function NetWorthBreakdownCard({ summary }: NetWorthBreakdownCardProps) {
  const breakdown = useMemo(() => {
    const bankAccounts: BreakdownItem[] = [];
    const investments: BreakdownItem[] = [];
    const liabilities: BreakdownItem[] = [];

    summary.accounts.forEach((account) => {
      const type = toBreakdownType(account.netWorthCategory);
      const amount = type === 'liability' ? Math.abs(account.currentBalance) : account.currentBalance;

      const item = {
        id: account.id,
        name: account.name,
        institutionName: getInstitutionName(account.institutionName),
        amount,
      };

      if (type === 'bank') {
        bankAccounts.push(item);
        return;
      }

      if (type === 'investment') {
        investments.push(item);
        return;
      }

      if (type === 'liability') {
        liabilities.push(item);
      }
    });

    const bankGroups = groupByInstitution(bankAccounts);
    const investmentGroups = groupByInstitution(investments);
    const liabilityGroups = groupByInstitution(liabilities);

    const sections: BreakdownSection[] = [
      {
        key: 'bank',
        title: 'Bank Accounts',
        emptyMessage: 'No bank accounts yet.',
        groups: bankGroups,
        total: bankAccounts.reduce((sum, account) => sum + account.amount, 0),
      },
      {
        key: 'investment',
        title: 'Investments',
        emptyMessage: 'No investment accounts yet.',
        groups: investmentGroups,
        total: investments.reduce((sum, account) => sum + account.amount, 0),
      },
      {
        key: 'liability',
        title: 'Liabilities',
        emptyMessage: 'No liability accounts.',
        groups: liabilityGroups,
        total: liabilities.reduce((sum, account) => sum + account.amount, 0),
      },
    ];

    return { sections };
  }, [summary.accounts]);

  return (
    <Card title="Net Worth Breakdown" className="net-worth-breakdown-card">
      <div className="net-worth-breakdown-topline">
        <p className="subtle">Net Worth</p>
        <p className="number net-worth-breakdown-value">{formatCurrency(summary.netWorth)}</p>
      </div>

      <div className="net-worth-breakdown-columns">
        {breakdown.sections.map((section) => (
          <section key={section.key}>
            <div className="net-worth-breakdown-column-header">
              <p className="subtle">{section.title}</p>
              <p className="number">{formatCurrency(section.total)}</p>
            </div>
            {section.groups.length === 0 ? (
              <p className="subtle">{section.emptyMessage}</p>
            ) : (
              <div className="net-worth-institution-groups">
                {section.groups.map((group) => (
                  <article className="net-worth-institution-group" key={`${section.key}-group-${group.institutionName}`}>
                    <div className="net-worth-institution-header">
                      <p className="net-worth-institution-name">{group.institutionName}</p>
                      <p className="number">{formatCurrency(group.total)}</p>
                    </div>
                    <table className="table">
                      <tbody>
                        {group.accounts.map((item) => (
                          <tr key={`${section.key}-${item.id}`}>
                            <td><Link to={`/accounts/${item.id}`}>{item.name}</Link></td>
                            <td className="number">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </Card>
  );
}
