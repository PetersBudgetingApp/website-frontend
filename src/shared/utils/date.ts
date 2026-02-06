export function monthToDateRange(month: string): { startDate: string; endDate: string } {
  const [year, monthNum] = month.split('-').map(Number);
  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 0);

  const toISODate = (value: Date) => {
    const mm = `${value.getMonth() + 1}`.padStart(2, '0');
    const dd = `${value.getDate()}`.padStart(2, '0');
    return `${value.getFullYear()}-${mm}-${dd}`;
  };

  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
}
