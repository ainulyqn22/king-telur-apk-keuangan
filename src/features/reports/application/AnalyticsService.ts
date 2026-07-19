import type { Sale } from '@/shared/types';
import type { AnalyticsComparison, AnalyticsPeriod, AnalyticsRepository, PeriodStats } from '../domain/AnalyticsRepository';

function stats(sales: Sale[], start: Date, end: Date): PeriodStats {
  const from = new Date(start); from.setHours(0, 0, 0, 0);
  const to = new Date(end); to.setHours(23, 59, 59, 999);
  const rows = sales.filter((sale) => {
    const value = new Date(`${sale.date}T00:00:00`).getTime();
    return value >= from.getTime() && value <= to.getTime();
  });
  return {
    qty: rows.reduce((sum, row) => sum + row.qty, 0),
    revenue: rows.reduce((sum, row) => sum + row.totalRevenue, 0),
    cogs: rows.reduce((sum, row) => sum + row.cogs, 0),
    profit: rows.reduce((sum, row) => sum + row.grossProfit, 0),
    count: rows.length,
  };
}

const change = (current: number, previous: number) => previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
const label = (start: Date, end: Date) => `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}
  getSales() { return this.repository.getSales(); }

  compare(sales: Sale[], period: AnalyticsPeriod, reference = new Date()): AnalyticsComparison {
    const today = new Date(reference); today.setHours(0, 0, 0, 0);
    let currentStart = new Date(today), currentEnd = new Date(today);
    let previousStart = new Date(today), previousEnd = new Date(today);
    let periodLabel: string;
    if (period === 'today') {
      previousStart.setDate(today.getDate() - 1); previousEnd = new Date(previousStart); periodLabel = 'Hari Ini vs Kemarin';
    } else if (period === 'week') {
      currentStart.setDate(today.getDate() - 6); previousStart.setDate(today.getDate() - 13); previousEnd.setDate(today.getDate() - 7); periodLabel = '7 Hari Ini vs 7 Hari Lalu';
    } else if (period === 'month') {
      currentStart = new Date(today.getFullYear(), today.getMonth(), 1); currentEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1); previousEnd = new Date(today.getFullYear(), today.getMonth(), 0); periodLabel = 'Bulan Ini vs Bulan Lalu';
    } else {
      currentStart = new Date(today.getFullYear(), 0, 1); currentEnd = new Date(today.getFullYear(), 11, 31);
      previousStart = new Date(today.getFullYear() - 1, 0, 1); previousEnd = new Date(today.getFullYear() - 1, 11, 31); periodLabel = 'Tahun Ini vs Tahun Lalu';
    }
    const current = stats(sales, currentStart, currentEnd);
    const previous = stats(sales, previousStart, previousEnd);
    return { current, previous, qtyChange: change(current.qty, previous.qty), revChange: change(current.revenue, previous.revenue), cogsChange: change(current.cogs, previous.cogs), profitChange: change(current.profit, previous.profit), periodLabel, range: { current: label(currentStart, currentEnd), previous: label(previousStart, previousEnd) } };
  }
}
