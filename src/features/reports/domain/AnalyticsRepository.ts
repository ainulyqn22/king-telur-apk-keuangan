import type{Sale}from'@/shared/types';
export type AnalyticsPeriod='today'|'week'|'month'|'year';
export interface PeriodStats{qty:number;revenue:number;cogs:number;profit:number;count:number;}
export interface AnalyticsComparison{current:PeriodStats;previous:PeriodStats;qtyChange:number;revChange:number;cogsChange:number;profitChange:number;periodLabel:string;range:{current:string;previous:string};}
export interface AnalyticsRepository{getSales():Promise<Sale[]>;}
