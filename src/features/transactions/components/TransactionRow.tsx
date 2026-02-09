import { useCallback, useEffect, useRef, useState } from 'react';
import type { CategoryDto } from '@shared/api/endpoints/categories';
import type { TransactionDto } from '@shared/api/endpoints/transactions';
import { formatCurrency, formatDate } from '@domain/format';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { CategoryPicker } from '@features/transactions/components/CategoryPicker';

interface TransactionRowProps {
  transaction: TransactionDto;
  categories: CategoryDto[];
  onCategoryChange: (transactionId: number, categoryId: number | null) => void;
  onExcludeToggle: (transactionId: number, excludeFromTotals: boolean) => void;
  onNotesChange: (transactionId: number, notes: string) => void;
  onAddRule: (transaction: TransactionDto) => void;
  onMarkTransfer?: (transactionId: number, pairTransactionId: number) => void;
  onDelete?: (transactionId: number) => void;
  disabled?: boolean;
}

export function TransactionRow({
  transaction,
  categories,
  onCategoryChange,
  onExcludeToggle,
  onNotesChange,
  onAddRule,
  onMarkTransfer,
  onDelete,
  disabled,
}: TransactionRowProps) {
  const [notes, setNotes] = useState(transaction.notes ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [pairId, setPairId] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const lastSavedNotes = useRef(transaction.notes ?? '');

  const persistNotes = useCallback(
    (nextNotes: string) => {
      if (nextNotes === lastSavedNotes.current) {
        return;
      }
      lastSavedNotes.current = nextNotes;
      onNotesChange(transaction.id, nextNotes);
    },
    [onNotesChange, transaction.id],
  );

  useEffect(() => {
    const nextNotes = transaction.notes ?? '';
    setNotes(nextNotes);
    lastSavedNotes.current = nextNotes;
  }, [transaction.id, transaction.notes]);

  useEffect(() => {
    if (!showNotesEditor) {
      return;
    }

    const timeoutId = window.setTimeout(() => persistNotes(notes), 550);
    return () => window.clearTimeout(timeoutId);
  }, [notes, persistNotes, showNotesEditor]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      persistNotes(notes);
      setMenuOpen(false);
      setShowNotesEditor(false);
      setShowTransferForm(false);
      setPairId('');
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen, notes, persistNotes]);

  const description = transaction.description ?? transaction.payee ?? 'Unknown';
  const closeMenu = () => {
    persistNotes(notes);
    setMenuOpen(false);
    setShowNotesEditor(false);
    setShowTransferForm(false);
    setPairId('');
  };

  return (
    <article className="transaction-entry" role="listitem" aria-label={`Transaction ${transaction.id}: ${description}`}>
      <div className="transaction-entry-title">
        <p className="subtle">Description</p>
        <p>{description}</p>
        {transaction.internalTransfer && <Badge>Transfer</Badge>}
      </div>

      <div className="transaction-entry-main">
        <div className="transaction-entry-line">
          <div className="transaction-entry-field transaction-entry-date">
            <p className="subtle">Date</p>
            <p>{formatDate(transaction.postedAt)}</p>
          </div>
          <div className="transaction-entry-field transaction-entry-transaction-id">
            <p className="subtle">ID</p>
            <p className="number">{transaction.id}</p>
          </div>
          <div className="transaction-entry-field transaction-entry-amount">
            <p className="subtle">Amount</p>
            <p className="number transaction-entry-amount-value">{formatCurrency(transaction.amount)}</p>
          </div>
        </div>

        <div className="transaction-entry-line">
          <div className="transaction-entry-field transaction-entry-account">
            <p className="subtle">Account</p>
            <p>{transaction.accountName ?? 'Unknown account'}</p>
          </div>
          <div className="transaction-entry-field transaction-entry-category">
            <p className="subtle">Category</p>
            <CategoryPicker
              categories={categories}
              value={transaction.category?.id ?? null}
              className="transaction-category-picker"
              disabled={disabled}
              onChange={(categoryId) => onCategoryChange(transaction.id, categoryId)}
            />
          </div>
          <div className="transaction-entry-field transaction-entry-notes">
            <p className="subtle">Notes</p>
            <p className="transaction-notes-preview">{notes.trim() ? notes : '—'}</p>
          </div>
        </div>
      </div>

      <div className="transaction-entry-actions">
        <div className="transaction-row-menu" ref={menuRef}>
          <Button
            type="button"
            variant="ghost"
            className="transaction-row-menu-trigger"
            aria-label={`Transaction actions for ${transaction.id}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            disabled={disabled}
          >
            ...
          </Button>
          {menuOpen && (
            <div className="transaction-row-menu-popover">
              <Button
                type="button"
                variant="ghost"
                className="transaction-row-menu-item"
                onClick={() => {
                  if (showNotesEditor) {
                    persistNotes(notes);
                  }
                  setShowNotesEditor((prev) => !prev);
                }}
                disabled={disabled}
              >
                Notes
              </Button>
              {showNotesEditor && (
                <div className="transaction-row-menu-section">
                  <textarea
                    className="input"
                    aria-label={`Notes for transaction ${transaction.id}`}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    onBlur={() => persistNotes(notes)}
                    placeholder="Add notes"
                    disabled={disabled}
                  />
                  <p className="subtle">Autosaves while you type.</p>
                </div>
              )}
              <label className="transaction-row-menu-checkbox">
                <input
                  type="checkbox"
                  checked={transaction.excludeFromTotals}
                  onChange={(event) => onExcludeToggle(transaction.id, event.target.checked)}
                  disabled={disabled}
                />
                Exclude from totals
              </label>
              <Button
                type="button"
                variant="ghost"
                className="transaction-row-menu-item"
                onClick={() => {
                  onAddRule(transaction);
                  closeMenu();
                }}
                disabled={disabled}
              >
                Add Rule
              </Button>
              {onMarkTransfer && !transaction.internalTransfer && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="transaction-row-menu-item"
                    onClick={() => setShowTransferForm((prev) => !prev)}
                    disabled={disabled}
                  >
                    Mark Transfer
                  </Button>
                  {showTransferForm && (
                    <div className="transaction-row-menu-section transaction-row-transfer-linker">
                      <input
                        className="input"
                        type="number"
                        placeholder="Pair ID"
                        value={pairId}
                        onChange={(event) => setPairId(event.target.value)}
                        disabled={disabled}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={disabled || !pairId}
                        onClick={() => {
                          onMarkTransfer(transaction.id, Number(pairId));
                          closeMenu();
                        }}
                      >
                        Link
                      </Button>
                    </div>
                  )}
                </>
              )}
              {onDelete && transaction.manualEntry && (
                <Button
                  type="button"
                  variant="danger"
                  className="transaction-row-menu-item"
                  onClick={() => {
                    if (!window.confirm('Delete this manually created transaction?')) {
                      return;
                    }
                    onDelete(transaction.id);
                    closeMenu();
                  }}
                  disabled={disabled}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
