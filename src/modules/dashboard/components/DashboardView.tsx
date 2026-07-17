import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Activity,
  ShoppingBag,
  DollarSign,
  Users,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  DashboardManager,
  ChartManager,
  BatchManager,
  Utils,
  StorageManager
} from '../../../utils/managers';
import { ProductionBatch, ActivityLog } from '../../../types';

interface DashboardViewProps {
  onNavigate: (page: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
  refreshKey: number;
}

export default function DashboardView({ onNavigate, showToast, onRefresh, refreshKey }: DashboardViewProps) {
  const kpis = DashboardManager.getKPIs();
  const trends30Days = ChartManager.get30DaysTrends();
  const costComp = ChartManager.getCostComposition();
  const batches = BatchManager.getBatches();
  const logs = StorageManager.getData<ActivityLog[]>('activity_logs') || [];

  // Find curing batches reaching 12-14+ days
  const activeCuringBatches = batches.filter(b => b.status === 'Pemeraman');
  const alertBatches = activeCuringBatches.map(b => {
    const age = BatchManager.getBatchAge(b);
    return { batch: b, age };
  }).filter(item => item.age >= 12);

  const handleQuickHarvest = (batchId: string) => {
    try {
      BatchManager.updateBatchStatus(batchId, 'Siap Dijual');
      showToast('Batch berhasil dipanen & dimasukkan ke stok siap jual!', 'success');
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Gagal panen batch', 'error');
    }
  };

  // Stock trend calculations
  const stockTrendData = trends30Days.map(item => {
    // Cumulative stock calculations for charting
    return {
      label: item.label,
      "Produksi": item.production,
      "Penjualan (Qty)": item.salesQty
    };
  });

  return (
    <div key={refreshKey} className="space-y-6">
      {/* Top Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kinerja Operasional & Keuangan</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau produksi, stok, HPP, laba, dan penjualan bebek secara real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              StorageManager.seedSampleData();
              showToast('Data demo berhasil di-seed!', 'success');
              onRefresh();
            }}
            className="px-4 py-2 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition rounded-xl flex items-center gap-1.5 border border-sky-100"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Seed Demo Data
          </button>
          <span className="px-3.5 py-1.5 text-xs font-mono bg-gray-50 border border-gray-100 text-gray-600 rounded-xl">
            Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Curing Batches Alerts */}
      {alertBatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 animate-pulse">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-800">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 text-sm">Pengingat Panen Telur Asin!</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Terdapat <strong>{alertBatches.length} batch</strong> pemeraman telur asin yang telah mencapai target masa peram (12-14+ hari) dan siap dipanen.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {alertBatches.map(item => (
                <div key={item.batch.id} className="flex items-center bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs gap-2 shadow-xs">
                  <span className="font-mono font-bold text-amber-900">{item.batch.batchNo}</span>
                  <span className="text-gray-500">({item.age} hari peram)</span>
                  <button
                    onClick={() => handleQuickHarvest(item.batch.id)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                  >
                    Panen Sekarang
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI GRID STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Produksi Telur */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Produksi Hari Ini</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Activity className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">{kpis.productionToday.qty.toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-500">butir</span></h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${kpis.productionToday.trend.color}`}>
                {kpis.productionToday.trend.label}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">vs kemarin</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Penjualan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Omzet Hari Ini</span>
            <span className="p-2 bg-sky-50 text-sky-600 rounded-xl"><ShoppingBag className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900 font-sans tracking-tight">{Utils.formatCurrency(kpis.salesToday.revenue)}</h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">{kpis.salesToday.qty.toLocaleString('id-ID')} butir terjual</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${kpis.salesToday.trend.color}`}>
                {kpis.salesToday.trend.label}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">vs kemarin</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Stok Telur Segar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Stok Telur Segar</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Package className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">{kpis.rawStock.qty.toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-500">butir</span></h3>
            <p className="text-xs text-gray-400 mt-1.5">HPP Rata-rata: <span className="font-mono text-gray-600 font-semibold">{Utils.formatCurrency(kpis.rawStock.qty > 0 ? kpis.rawStock.value / kpis.rawStock.qty : 0)}</span></p>
            <p className="text-xs text-gray-500 mt-1">Nilai Persediaan: <span className="font-semibold font-mono text-gray-700">{Utils.formatCurrency(kpis.rawStock.value)}</span></p>
          </div>
        </div>

        {/* KPI 4: Stok Telur Asin */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Stok Telur Asin</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">{kpis.saltedStock.qty.toLocaleString('id-ID')} <span className="text-xs font-normal text-gray-500">butir</span></h3>
            <p className="text-xs text-gray-400 mt-1.5">HPP Rata-rata: <span className="font-mono text-gray-600 font-semibold">{Utils.formatCurrency(kpis.saltedStock.qty > 0 ? kpis.saltedStock.value / kpis.saltedStock.qty : 0)}</span></p>
            <p className="text-xs text-gray-500 mt-1">Nilai Persediaan: <span className="font-semibold font-mono text-gray-700">{Utils.formatCurrency(kpis.saltedStock.value)}</span></p>
          </div>
        </div>
      </div>

      {/* SUB STATS: FINANCE COMPASS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/60">
        <div className="border-r border-gray-200/60 last:border-0 pr-2">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">HPP Terjual Hari Ini</p>
          <p className="text-sm font-semibold font-mono text-gray-700 mt-0.5">{Utils.formatCurrency(kpis.cogsToday)}</p>
        </div>
        <div className="border-r border-gray-200/60 last:border-0 px-2">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Laba Kotor Hari Ini</p>
          <p className="text-sm font-semibold font-mono text-emerald-600 mt-0.5">+{Utils.formatCurrency(kpis.grossProfitToday)}</p>
        </div>
        <div className="border-r border-gray-200/60 last:border-0 px-2">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Biaya Operasional Hari Ini</p>
          <p className="text-sm font-semibold font-mono text-rose-600 mt-0.5">-{Utils.formatCurrency(kpis.expensesToday)}</p>
        </div>
        <div className="last:border-0 pl-2">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Laba Bersih Hari Ini</p>
          <div className="flex items-center gap-1">
            <span className={`text-sm font-bold font-mono ${kpis.netProfitToday.val >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {kpis.netProfitToday.val >= 0 ? '+' : ''}{Utils.formatCurrency(kpis.netProfitToday.val)}
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS GRAPH SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Penjualan & Profit */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Tren Penjualan & Laba Bersih (30 Hari)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ringkasan harian laba bersih setelah dikurangi HPP dan Biaya Operasional.</p>
            </div>
            <span className="px-2.5 py-1 text-[10px] bg-sky-50 text-sky-700 font-bold uppercase tracking-wider rounded-lg">Keuangan</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends30Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [Utils.formatCurrency(Number(value)), '']}
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                <Area type="monotone" name="Penjualan" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" name="Laba Bersih" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Composition Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Komposisi Biaya Operasional</h2>
              <p className="text-xs text-gray-400 mt-0.5">Persentase pengeluaran berdasarkan kategori operasional.</p>
            </div>
          </div>
          {costComp.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl p-6">
              <span className="p-3 bg-gray-50 rounded-full text-gray-400"><Clock className="w-5 h-5" /></span>
              <p className="text-xs mt-2 font-medium">Belum ada pengeluaran biaya operasional.</p>
            </div>
          ) : (
            <div className="h-56 flex flex-col justify-between">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costComp}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {costComp.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [Utils.formatCurrency(Number(value)), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-24 overflow-y-auto pr-1">
                {costComp.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 truncate font-medium">{item.name}</span>
                    <span className="font-mono text-gray-400 font-semibold text-right ml-auto">{((item.value / costComp.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECOND CHART GRID: Production Yield & Stock Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production volume yield */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Grafik Produksi & Penjualan (30 Hari)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Perbandingan volume panen telur segar harian vs kuantitas penjualan.</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '5px' }} />
                <Bar name="Hasil Panen Kandang" dataKey="Produksi" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar name="Jumlah Terjual" dataKey="Penjualan (Qty)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Logs & Quick Stats */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <h2 className="text-base font-bold text-gray-900">Aktivitas Sistem Terakhir</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Log riwayat aksi operator gudang & keuangan.</p>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Belum ada aktivitas yang tercatat.
            </div>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex gap-2.5 items-start border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                  <div className="mt-0.5 p-1 bg-gray-100 rounded text-gray-500 font-mono text-[9px] font-bold">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{log.action}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
