import { useMemo } from 'react';
import { formatCurrency } from '@domain/format';
import type { AccountSummaryDto } from '@shared/api/endpoints/accounts';
import { Card } from '@shared/ui/Card';

interface NetWorthBreakdownCardProps {
  summary: AccountSummaryDto;
}

type BreakdownType = 'asset' | 'liability';

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

const assetTypes = new Set(['CHECKING', 'SAVINGS', 'INVESTMENT']);
const liabilityTypes = new Set(['CREDIT_CARD', 'LOAN']);

function classifyBreakdownType(accountType: string, currentBalance: number): BreakdownType {
  if (liabilityTypes.has(accountType)) {
    return 'liability';
  }

  if (assetTypes.has(accountType)) {
    return 'asset';
  }

  return currentBalance < 0 ? 'liability' : 'asset';
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
    const assets: BreakdownItem[] = [];
    const liabilities: BreakdownItem[] = [];

    summary.accounts.forEach((account) => {
      const type = classifyBreakdownType(account.accountType, account.currentBalance);
      const amount = type === 'liability' ? Math.abs(account.currentBalance) : account.currentBalance;

      const item = {
        id: account.id,
        name: account.name,
        institutionName: getInstitutionName(account.institutionName),
        amount,
      };

      if (type === 'liability') {
        liabilities.push(item);
      } else {
        assets.push(item);
      }
    });

    return {
      assetGroups: groupByInstitution(assets),
      liabilityGroups: groupByInstitution(liabilities),
    };
  }, [summary.accounts]);

  return (
    <Card title="Net Worth Breakdown" className="net-worth-breakdown-card">
      <div className="net-worth-breakdown-topline">
        <p className="subtle">Net Worth</p>
        <p className="number net-worth-breakdown-value">{formatCurrency(summary.netWorth)}</p>
      </div>

      <div className="net-worth-breakdown-columns">
        <section>
          <div className="net-worth-breakdown-column-header">
            <p className="subtle">Assets</p>
            <p className="number">{formatCurrency(summary.totalAssets)}</p>
          </div>
          {breakdown.assetGroups.length === 0 ? (
            <p className="subtle">No asset accounts yet.</p>
          ) : (
            <div className="net-worth-institution-groups">
              {breakdown.assetGroups.map((group) => (
                <article className="net-worth-institution-group" key={`asset-group-${group.institutionName}`}>
                  <div className="net-worth-institution-header">
                    <p className="net-worth-institution-name">{group.institutionName}</p>
                    <p className="number">{formatCurrency(group.total)}</p>
                  </div>
                  <table className="table">
                    <tbody>
                      {group.accounts.map((item) => (
                        <tr key={`asset-${item.id}`}>
                          <td>{item.name}</td>
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

        <section>
          <div className="net-worth-breakdown-column-header">
            <p className="subtle">Liabilities</p>
            <p className="number">{formatCurrency(summary.totalLiabilities)}</p>
          </div>
          {breakdown.liabilityGroups.length === 0 ? (
            <p className="subtle">No liability accounts.</p>
          ) : (
            <div className="net-worth-institution-groups">
              {breakdown.liabilityGroups.map((group) => (
                <article className="net-worth-institution-group" key={`liability-group-${group.institutionName}`}>
                  <div className="net-worth-institution-header">
                    <p className="net-worth-institution-name">{group.institutionName}</p>
                    <p className="number">{formatCurrency(group.total)}</p>
                  </div>
                  <table className="table">
                    <tbody>
                      {group.accounts.map((item) => (
                        <tr key={`liability-${item.id}`}>
                          <td>{item.name}</td>
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
      </div>
    </Card>
  );
}
