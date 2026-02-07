import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteConnection, getConnections, getAccountSummary, setupSimpleFinConnection, syncConnection } from '@shared/api/endpoints';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Input } from '@shared/ui/Input';
import { EmptyState } from '@shared/ui/EmptyState';
import { formatDate } from '@domain/format';
const setupSchema = z.object({
    setupToken: z.string().min(1, 'Setup token is required'),
});
export function ConnectionsPage() {
    const [syncMessage, setSyncMessage] = useState(null);
    const queryClient = useQueryClient();
    const setupForm = useForm({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            setupToken: '',
        },
    });
    const connectionsQuery = useQuery({
        queryKey: ['connections'],
        queryFn: getConnections,
    });
    const summaryQuery = useQuery({
        queryKey: ['accounts', 'summary'],
        queryFn: getAccountSummary,
    });
    const setupMutation = useMutation({
        mutationFn: (values) => setupSimpleFinConnection(values.setupToken),
        onSuccess: () => {
            setupForm.reset();
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
    const syncMutation = useMutation({
        mutationFn: syncConnection,
        onSuccess: (result) => {
            setSyncMessage(result.message);
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: deleteConnection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        },
    });
    return (_jsxs("section", { className: "page", children: [_jsx("h2", { children: "Connections" }), _jsx(Card, { title: "Connect Bank via SimpleFIN", children: _jsxs("form", { className: "form-grid", onSubmit: setupForm.handleSubmit((values) => setupMutation.mutate(values)), children: [_jsx(Input, { id: "setup-token", label: "SimpleFIN Setup Token", placeholder: "Paste setup token", error: setupForm.formState.errors.setupToken?.message, ...setupForm.register('setupToken') }), _jsx(Button, { type: "submit", disabled: setupMutation.isPending, children: setupMutation.isPending ? 'Connecting...' : 'Connect' }), setupMutation.error && _jsx("p", { className: "field-error", children: "Could not connect account." })] }) }), _jsx(Card, { title: "Account Snapshot", children: summaryQuery.data ? (_jsxs("div", { className: "grid-cards", children: [_jsxs("div", { children: [_jsx("p", { className: "subtle", children: "Assets" }), _jsx("p", { className: "number", children: summaryQuery.data.totalAssets.toFixed(2) })] }), _jsxs("div", { children: [_jsx("p", { className: "subtle", children: "Liabilities" }), _jsx("p", { className: "number", children: summaryQuery.data.totalLiabilities.toFixed(2) })] }), _jsxs("div", { children: [_jsx("p", { className: "subtle", children: "Net Worth" }), _jsx("p", { className: "number", children: summaryQuery.data.netWorth.toFixed(2) })] })] })) : (_jsx("p", { className: "subtle", children: "No account data yet." })) }), _jsxs(Card, { title: "Linked Institutions", children: [syncMessage && _jsx("p", { children: syncMessage }), connectionsQuery.data && connectionsQuery.data.length > 0 ? (_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Institution" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Accounts" }), _jsx("th", { children: "Last Sync" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: connectionsQuery.data.map((connection) => (_jsxs("tr", { children: [_jsx("td", { children: connection.institutionName ?? 'Unknown Institution' }), _jsx("td", { children: connection.syncStatus }), _jsx("td", { children: connection.accountCount }), _jsx("td", { children: formatDate(connection.lastSyncAt) }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }, children: [_jsx(Button, { variant: "secondary", onClick: () => syncMutation.mutate(connection.id), disabled: syncMutation.isPending, children: "Sync" }), _jsx(Button, { variant: "danger", onClick: () => deleteMutation.mutate(connection.id), disabled: deleteMutation.isPending, children: "Remove" })] }) })] }, connection.id))) })] })) : (_jsx(EmptyState, { title: "No connections", description: "Add a SimpleFIN token to connect your institutions." }))] })] }));
}
