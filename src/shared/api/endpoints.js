import { z } from 'zod';
import { accountSchema, accountSummarySchema, cashFlowSchema, categorySchema, connectionSchema, spendingByCategorySchema, syncResultSchema, transactionSchema, transferPairSchema, trendSchema, } from '@domain/schemas';
import { apiClient } from '@shared/api/client';
const categoriesSchema = z.array(categorySchema);
const accountsSchema = z.array(accountSchema);
const connectionsSchema = z.array(connectionSchema);
const transactionsSchema = z.array(transactionSchema);
const transfersSchema = z.array(transferPairSchema);
export async function getAccounts() {
    return apiClient.request('accounts', {
        schema: accountsSchema,
    });
}
export async function getAccountSummary() {
    return apiClient.request('accounts/summary', {
        schema: accountSummarySchema,
    });
}
export async function getConnections() {
    return apiClient.request('connections', {
        schema: connectionsSchema,
    });
}
export async function setupSimpleFinConnection(setupToken) {
    return apiClient.request('connections/simplefin/setup', {
        method: 'POST',
        body: { setupToken },
        schema: connectionSchema,
    });
}
export async function syncConnection(id) {
    return apiClient.request(`connections/${id}/sync`, {
        method: 'POST',
        schema: syncResultSchema,
    });
}
export async function deleteConnection(id) {
    return apiClient.request(`connections/${id}`, {
        method: 'DELETE',
    });
}
export async function getTransactions(filters) {
    return apiClient.request('transactions', {
        method: 'GET',
        query: {
            includeTransfers: filters.includeTransfers,
            startDate: filters.startDate,
            endDate: filters.endDate,
            categoryId: filters.categoryId,
            accountId: filters.accountId,
            limit: filters.limit,
            offset: filters.offset,
        },
        schema: transactionsSchema,
    });
}
export async function updateTransaction(id, request) {
    return apiClient.request(`transactions/${id}`, {
        method: 'PATCH',
        body: request,
        schema: transactionSchema,
    });
}
export async function getTransfers() {
    return apiClient.request('transactions/transfers', {
        schema: transfersSchema,
    });
}
export async function markTransfer(id, pairTransactionId) {
    return apiClient.request(`transactions/${id}/mark-as-transfer`, {
        method: 'POST',
        body: { pairTransactionId },
    });
}
export async function unlinkTransfer(id) {
    return apiClient.request(`transactions/${id}/unlink-transfer`, {
        method: 'POST',
    });
}
export async function getCategories(flat = false) {
    return apiClient.request('categories', {
        query: { flat },
        schema: categoriesSchema,
    });
}
export async function createCategory(input) {
    return apiClient.request('categories', {
        method: 'POST',
        body: input,
        schema: categorySchema,
    });
}
export async function updateCategory(id, input) {
    return apiClient.request(`categories/${id}`, {
        method: 'PUT',
        body: input,
        schema: categorySchema,
    });
}
export async function deleteCategory(id) {
    return apiClient.request(`categories/${id}`, {
        method: 'DELETE',
    });
}
export async function getSpendingByCategory(startDate, endDate) {
    return apiClient.request('analytics/spending', {
        query: { startDate, endDate },
        schema: spendingByCategorySchema,
    });
}
export async function getTrends(months = 6) {
    return apiClient.request('analytics/trends', {
        query: { months },
        schema: trendSchema,
    });
}
export async function getCashFlow(startDate, endDate) {
    return apiClient.request('analytics/cashflow', {
        query: { startDate, endDate },
        schema: cashFlowSchema,
    });
}
