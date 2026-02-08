import type { TransferPairDto } from '@shared/api/endpoints/transactions';
import { formatCurrency, formatDate } from '@domain/format';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';

interface TransferPairRowProps {
  pair: TransferPairDto;
  onUnlink: (fromTransactionId: number) => void;
  disabled?: boolean;
}

export function TransferPairRow({ pair, onUnlink, disabled }: TransferPairRowProps) {
  return (
    <article className="transfer-entry" role="listitem" aria-label={`Transfer pair ${pair.fromTransactionId} to ${pair.toTransactionId}`}>
      <div className="number transfer-entry-id">
        <span className="subtle">From</span>
        <span>{pair.fromTransactionId}</span>
        <span className="subtle">To</span>
        <span>{pair.toTransactionId}</span>
      </div>

      <div className="transfer-entry-main">
        <div className="transfer-entry-line">
          <div className="transfer-entry-field transfer-entry-date">
            <p className="subtle">Date</p>
            <p>{formatDate(pair.date)}</p>
          </div>
          <div className="transfer-entry-field transfer-entry-description">
            <p className="subtle">Description</p>
            <p>{pair.description ?? 'Transfer'}</p>
          </div>
          <div className="transfer-entry-field transfer-entry-amount">
            <p className="subtle">Amount</p>
            <p className="number transfer-entry-amount-value">{formatCurrency(pair.amount)}</p>
          </div>
        </div>

        <div className="transfer-entry-line">
          <div className="transfer-entry-field transfer-entry-from-account">
            <p className="subtle">From Account</p>
            <p>{pair.fromAccountName}</p>
          </div>
          <div className="transfer-entry-field transfer-entry-to-account">
            <p className="subtle">To Account</p>
            <p>{pair.toAccountName}</p>
          </div>
          <div className="transfer-entry-field transfer-entry-type">
            <p className="subtle">Type</p>
            <div>{pair.autoDetected ? <Badge>Auto-detected</Badge> : <Badge>Manual</Badge>}</div>
          </div>
        </div>
      </div>

      <div className="transfer-entry-actions">
        <Button type="button" variant="secondary" onClick={() => onUnlink(pair.fromTransactionId)} disabled={disabled}>
          Unlink
        </Button>
      </div>
    </article>
  );
}
