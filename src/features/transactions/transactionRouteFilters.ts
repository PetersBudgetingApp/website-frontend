import { appRoutes } from '@app/routes';
import { defaultTransactionFilters } from '@domain/transactions';
import type { AmountFilterOperator, TransactionFilters } from '@domain/types';
import { monthToDateRange } from '@shared/utils/date';

const AMOUNT_OPERATORS: AmountFilterOperator[] = ['eq', 'gt', 'lt'];

export interface TransactionRouteFilters {
  includeTransfers?: boolean;
  month?: string;
  startDate?: string;
  endDate?: string;
  descriptionQuery?: string;
  merchantQuery?: string;
  categoryId?: number;
  uncategorized?: boolean;
  accountId?: number;
  amountOperator?: AmountFilterOperator;
  amountValue?: number;
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

function parseNumberParam(value: string | null): number | undefined {
  if (value === null || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseAmountOperator(value: string | null): AmountFilterOperator | undefined {
  if (!value) {
    return undefined;
  }

  return AMOUNT_OPERATORS.includes(value as AmountFilterOperator) ? (value as AmountFilterOperator) : undefined;
}

function setTextQueryParam(params: URLSearchParams, key: string, value: string | undefined) {
  if (!value) {
    return;
  }

  const normalized = value.trim();
  if (normalized.length > 0) {
    params.set(key, normalized);
  }
}

function setNumberQueryParam(params: URLSearchParams, key: string, value: number | undefined) {
  if (value !== undefined && Number.isFinite(value)) {
    params.set(key, String(value));
  }
}

export function buildTransactionsPath(filters: TransactionRouteFilters = {}): string {
  const params = new URLSearchParams();
  const monthRange = filters.month ? monthToDateRange(filters.month) : null;
  const startDate = filters.startDate ?? monthRange?.startDate;
  const endDate = filters.endDate ?? monthRange?.endDate;

  if (filters.includeTransfers !== undefined) {
    params.set('includeTransfers', String(filters.includeTransfers));
  }

  if (startDate) {
    params.set('startDate', startDate);
  }

  if (endDate) {
    params.set('endDate', endDate);
  }

  setTextQueryParam(params, 'descriptionQuery', filters.descriptionQuery);
  setTextQueryParam(params, 'merchantQuery', filters.merchantQuery);

  if (filters.uncategorized) {
    params.set('uncategorized', 'true');
  } else {
    setNumberQueryParam(params, 'categoryId', filters.categoryId);
  }

  setNumberQueryParam(params, 'accountId', filters.accountId);

  if (filters.amountOperator && filters.amountValue !== undefined && Number.isFinite(filters.amountValue)) {
    params.set('amountOperator', filters.amountOperator);
    params.set('amountValue', String(filters.amountValue));
  }

  const query = params.toString();
  return query ? `${appRoutes.transactions}?${query}` : appRoutes.transactions;
}

export function getInitialFiltersFromSearchParams(searchParams: URLSearchParams): TransactionFilters {
  const baseFilters = defaultTransactionFilters();
  const includeTransfers = parseBooleanParam(searchParams.get('includeTransfers'));
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const descriptionQuery = searchParams.get('descriptionQuery');
  const merchantQuery = searchParams.get('merchantQuery');
  const categoryId = parseNumberParam(searchParams.get('categoryId'));
  const uncategorized = parseBooleanParam(searchParams.get('uncategorized'));
  const accountId = parseNumberParam(searchParams.get('accountId'));
  const amountOperator = parseAmountOperator(searchParams.get('amountOperator'));
  const amountValue = parseNumberParam(searchParams.get('amountValue'));

  if (includeTransfers !== undefined) {
    baseFilters.includeTransfers = includeTransfers;
  }
  if (startDate) {
    baseFilters.startDate = startDate;
  }
  if (endDate) {
    baseFilters.endDate = endDate;
  }
  if (descriptionQuery) {
    baseFilters.descriptionQuery = descriptionQuery;
  }
  if (merchantQuery) {
    baseFilters.merchantQuery = merchantQuery;
  }
  if (uncategorized) {
    baseFilters.uncategorized = true;
  } else if (categoryId !== undefined) {
    baseFilters.categoryId = categoryId;
  }
  if (accountId !== undefined) {
    baseFilters.accountId = accountId;
  }
  if (amountOperator) {
    baseFilters.amountOperator = amountOperator;
    if (amountValue !== undefined) {
      baseFilters.amountValue = amountValue;
    }
  }

  return baseFilters;
}
