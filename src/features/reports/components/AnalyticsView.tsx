import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Utils } from '@/shared/utils';
import { useAnalyticsController } from '../controllers/useAnalyticsController';

interface AnalyticsViewProps {
  refreshKey: number;
}

type ComparePeriod = 'today' | 'week' | 'month' | 'year';

export default function AnalyticsView({ refreshKey }: AnalyticsViewProps) {
  const [activeCompare, setActiveCompare] = useState<ComparePeriod>('month');
  const{comparison:comp,loading,error}=useAnalyticsController(activeCompare,refreshKey);
  if(loading)return <div className="p-8 text-center text-sm text-gray-400">Memuat analitik dari PostgreSQL...</div>;
  if(error)return <div className="p-8 text-center text-sm text-rose-600">{error}</div>;

  // Prepare side-by-side data for chart visualization
  const chartData = [
    { name: 'Volume Jual (Butir)', 'Periode Lalu': comp.previous.qty, 'Periode Kini': comp.current.qty },
    { name: 'Omzet Penjualan (Ribu)', 'Periode Lalu': Math.round(comp.previous.revenue / 1000), 'Periode Kini': Math.round(comp.current.revenue / 1000) },
    { name: 'Laba Kotor (Ribu)', 'Periode Lalu': Math.round(comp.previous.profit / 1000), 'Periode Kini': Math.round(comp.current.profit / 1000) }
  ];

  // Helper to render trend badging
  const renderTrendBadge = (pct: number, isCost: boolean = false) => {
    const isPositive = pct > 0;
    // Costs are "good" when they go down (-), but revenue/profit is "good" when it goes up (+)
    const isGood = isCost ? !isPositive : isPositive;
    
    if (pct === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-500">
          0% Stabil
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {Math.abs(pct).toFixed(1)}% {isPositive ? 'Kenaikan' : 'Penurunan'}
      </span>
    );
  };

  return (
    <div key={refreshKey} className="space-y-6 animate-fadeIn">
      {/* Control Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Analisis & Perbandingan Penjualan</h1>
          <p className="text-xs text-gray-500 mt-0.5">Analisis tren performa omzet dan keuntungan antar periode waktu akuntansi.</p>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          {(['today', 'week', 'month', 'year'] as ComparePeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setActiveCompare(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${activeCompare === p ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:bg-slate-100'}`}
            >
              {p === 'today' && 'Hari Ini'}
              {p === 'week' && '7 Hari Ini'}
              {p === 'month' && 'Bulan Ini'}
              {p === 'year' && 'Tahun Ini'}
            </button>
          ))}
        </div>
      </div>

      {/* Date Span Tags */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-500 bg-slate-100 p-3 rounded-xl border border-slate-200/50">
        <span className="px-3 py-1 bg-white border border-gray-200 text-slate-800 rounded-lg">
          Periode Kini: <span className="font-mono text-emerald-700 font-bold">{comp.range.current}</span>
        </span>
        <span className="px-3 py-1 bg-white border border-gray-200 text-slate-500 rounded-lg">
          Periode Pembanding: <span className="font-mono text-slate-600 font-bold">{comp.range.previous}</span>
        </span>
      </div>

      {/* COMPARATIVE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Volume */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Volume Terjual (Butir)</p>
          <div className="flex items-baseline justify-between mt-2.5">
            <h3 className="text-2xl font-bold font-mono text-slate-800">{comp.current.qty.toLocaleString('id-ID')}</h3>
            <span className="text-xs text-gray-400 font-mono">lalu: {comp.previous.qty.toLocaleString('id-ID')}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            {renderTrendBadge(comp.qtyChange)}
          </div>
        </div>

        {/* Card 2: Omzet */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Omzet Kotor Penjualan</p>
          <div className="flex items-baseline justify-between mt-2.5">
            <h3 className="text-xl font-bold font-mono text-emerald-600">{Utils.formatCurrency(comp.current.revenue)}</h3>
            <span className="text-[10px] text-gray-400 font-mono">lalu: {Utils.formatCurrency(comp.previous.revenue)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            {renderTrendBadge(comp.revChange)}
          </div>
        </div>

        {/* Card 3: COGS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Harga Pokok Penjualan (HPP)</p>
          <div className="flex items-baseline justify-between mt-2.5">
            <h3 className="text-xl font-bold font-mono text-rose-600">{Utils.formatCurrency(comp.current.cogs)}</h3>
            <span className="text-[10px] text-gray-400 font-mono">lalu: {Utils.formatCurrency(comp.previous.cogs)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            {renderTrendBadge(comp.cogsChange, true)}
          </div>
        </div>

        {/* Card 4: Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Laba Kotor Transaksi</p>
          <div className="flex items-baseline justify-between mt-2.5">
            <h3 className="text-xl font-bold font-mono text-slate-900">{Utils.formatCurrency(comp.current.profit)}</h3>
            <span className="text-[10px] text-gray-400 font-mono">lalu: {Utils.formatCurrency(comp.previous.profit)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            {renderTrendBadge(comp.profitChange)}
          </div>
        </div>
      </div>

      {/* GRAPH CHART SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Perbandingan Kinerja Finansial Samping-ke-Samping</h2>
            <p className="text-xs text-gray-400 mt-0.5">Analisis side-by-side volume penjualan (butir) dan besaran nilai uang (Ribu Rupiah).</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
              <Bar name="Periode Pembanding" dataKey="Periode Lalu" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar name="Periode Berjalan" dataKey="Periode Kini" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
