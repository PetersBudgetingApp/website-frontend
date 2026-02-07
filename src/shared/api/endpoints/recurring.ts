import { z } from 'zod';
import { recurringPatternSchema, upcomingBillSchema } from '@domain/schemas';
import { apiClient } from '@shared/api/client';

const recurringPatternsSchema = z.array(recurringPatternSchema);
const upcomingBillsSchema = z.array(upcomingBillSchema);

export type RecurringPatternDto = z.infer<typeof recurringPatternSchema>;
export type UpcomingBillDto = z.infer<typeof upcomingBillSchema>;

export async function getRecurringPatterns() {
  return apiClient.request('recurring', { schema: recurringPatternsSchema });
}

export async function detectRecurringPatterns() {
  return apiClient.request('recurring/detect', { method: 'POST' });
}

export async function getUpcomingBills() {
  return apiClient.request('recurring/upcoming', { schema: upcomingBillsSchema });
}

export async function getRecurringCalendar(month: string) {
  return apiClient.request('recurring/calendar', { query: { month }, schema: upcomingBillsSchema });
}

export async function toggleRecurringActive(id: number, active: boolean) {
  return apiClient.request(`recurring/${id}`, { method: 'PATCH', body: { active } });
}

export async function deleteRecurringPattern(id: number) {
  return apiClient.request<void>(`recurring/${id}`, { method: 'DELETE' });
}
