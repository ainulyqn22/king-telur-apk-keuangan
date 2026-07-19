import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Table,
  Filter
} from 'lucide-react';
import { Utils, ExportManager } from '@/shared/utils';
import { useReportController } from '../controllers/useReportController';

interface ReportsViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  refreshKey: number;
}

type ReportType = 'stock_raw' | 'stock_salted' | 'production' | 'purchases' | 'sales' | 'inventory' | 'income_statement';

export default function ReportsView({ showToast, refreshKey }: ReportsViewProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('income_statement');
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // first of month
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // today
  
  // Custom filters
  const [supplierId, setSupplierId] = useState('all');
  const [customerId, setCustomerId] = useState('all');

  const query=useMemo(()=>({period,customRange:period==='custom'?{start:startDate,end:endDate}:undefined,supplierId,customerId}),[period,startDate,endDate,supplierId,customerId]);
  const{report,loading,error}=useReportController(query,refreshKey);
  useEffect(()=>{if(error)showToast(error,'error');},[error,showToast]);
  if(loading||!report)return <div className="p-8 text-center text-sm text-gray-400">Memuat laporan dari PostgreSQL...</div>;
  const{settings,suppliers,customers,rawStockCard,saltedStockCard,productionReport,purchaseReport,salesReport,inventoryValuation,incomeStatement}=report;

  const getReportTitle = (): string => {
    switch (activeReport) {
      case 'stock_raw': return 'Kartu Stok Telur Segar';
      case 'stock_salted': return 'Kartu Stok Telur Asin';
      case 'production': return 'Laporan Hasil Produksi';
      case 'purchases': return 'Laporan Pembelian Telur';
      case 'sales': return 'Laporan Jurnal Penjualan';
      case 'inventory': return 'Laporan Nilai Persediaan';
      case 'income_statement': return 'Laporan Laba Rugi Bersih';
    }
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    const filename = `${activeReport}_report_${period}`;

    if (activeReport === 'stock_raw' || activeReport === 'stock_salted') {
      headers = ['Tanggal', 'Jenis Transaksi', 'Kuantitas (Butir)', 'Harga Satuan', 'Jumlah Cost', 'Kuantitas Akhir', 'HPP Rata-rata Akhir'];
      const dataList = activeReport === 'stock_raw' ? rawStockCard : saltedStockCard;
      rows = dataList.map(tx => [
        tx.date,
        tx.type,
        tx.qty,
        tx.pricePerUnit,
        tx.totalCost,
        tx.afterQty,
        tx.afterAvgCost
      ]);
    } else if (activeReport === 'production') {
      headers = ['Tanggal', 'Sumber Produksi', 'Kuantitas Hasil (Butir)', 'HPP Satuan', 'Catatan'];
      const farmRows = productionReport.farmProductions.map(p => [p.date, 'Kandang (Raw)', p.qty, p.transferPrice, p.notes]);
      const batchRows = productionReport.saltedBatches.map(b => [b.date, `Salted Batch ${b.batchNo}`, b.qtyInput, b.costPerUnit, b.notes]);
      rows = [...farmRows, ...batchRows];
    } else if (activeReport === 'purchases') {
      headers = ['Tanggal', 'Supplier', 'Kuantitas (Butir)', 'Harga Satuan', 'Ongkos Kirim', 'Total Pengadaan'];
      rows = purchaseReport.map(tx => {
        const sup = suppliers.find(s => s.id === tx.refId);
        return [
          tx.date,
          sup ? sup.name : 'Eksternal',
          tx.qty,
          tx.pricePerUnit,
          tx.notes.includes('Ongkir:') ? tx.notes.split('Ongkir:')[1].trim() : 0,
          tx.totalCost
        ];
      });
    } else if (activeReport === 'sales') {
      headers = ['Tanggal', 'Customer', 'Tipe', 'Kuantitas', 'Harga Jual', 'Diskon', 'Ongkir', 'Total Penerimaan', 'HPP Terjual', 'Laba Kotor'];
      rows = salesReport.sales.map(s => {
        const cust = customers.find(c => c.id === s.customerId);
        return [
          s.date,
          cust ? cust.name : 'Umum',
          s.eggType,
          s.qty,
          s.pricePerUnit,
          s.discount,
          s.shippingCost,
          s.totalRevenue,
          s.cogs,
          s.grossProfit
        ];
      });
    } else if (activeReport === 'inventory') {
      headers = ['Jenis Produk', 'Jumlah Stok (Butir)', 'HPP Rata-rata', 'Nilai Persediaan'];
      rows = [
        ['Telur Bebek Segar', inventoryValuation.rawQty, inventoryValuation.rawAvgCost, inventoryValuation.rawValue],
        ['Telur Bebek Asin', inventoryValuation.saltedQty, inventoryValuation.saltedAvgCost, inventoryValuation.saltedValue],
        ['Total Nilai', '', '', inventoryValuation.totalValue]
      ];
    } else if (activeReport === 'income_statement') {
      headers = ['Kategori Keuangan', 'Nominal Rupiah'];
      rows = [
        ['Pendapatan Penjualan', incomeStatement.totalRevenue],
        ['Harga Pokok Penjualan (HPP)', -incomeStatement.totalCOGS],
        ['Laba Kotor Usaha', incomeStatement.grossProfit],
        ...Object.keys(incomeStatement.expensesByCategory).map(cat => [`Biaya Operasional - ${cat}`, -incomeStatement.expensesByCategory[cat]]),
        ['Total Biaya Operasional', -incomeStatement.totalOpCosts],
        ['Laba Bersih Operasional', incomeStatement.netProfit]
      ];
    }

    ExportManager.exportToCSV(headers, rows, filename);
    showToast('Laporan berhasil diekspor ke CSV!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJournal=()=>{
    const headers=['Tanggal','Modul','Tipe','Referensi','Kuantitas/Nominal','Nilai'];
    const rows=[...report.rawTransactions.map(row=>[row.date,'RAW_INVENTORY',row.type,row.refId,row.qty,row.totalCost]),...report.saltedTransactions.map(row=>[row.date,'SALTED_INVENTORY',row.type,row.refId,row.qty,row.totalCost]),...report.sales.map(row=>[row.date,'SALES',row.eggType,row.id,row.qty,row.totalRevenue]),...report.expenses.map(row=>[row.date,'EXPENSE',row.category,row.id,'',row.amount])];
    ExportManager.exportToCSV(headers,rows,'postgres_transaction_journal');showToast('Jurnal transaksi PostgreSQL berhasil diekspor!','success');
  };

  return (
    <div key={refreshKey} className="space-y-6">
      {/* Selection & Preset Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Report Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full xl:w-auto">
          {(['income_statement', 'inventory', 'sales', 'production', 'purchases', 'stock_raw', 'stock_salted'] as ReportType[]).map(r => (
            <button
              key={r}
              onClick={() => setActiveReport(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeReport === r ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-slate-100'}`}
            >
              {r === 'income_statement' && 'Laba Rugi'}
              {r === 'inventory' && 'Persediaan'}
              {r === 'sales' && 'Penjualan'}
              {r === 'production' && 'Produksi'}
              {r === 'purchases' && 'Pembelian'}
              {r === 'stock_raw' && 'Stok Segar'}
              {r === 'stock_salted' && 'Stok Asin'}
            </button>
          ))}
        </div>

        {/* Global Preset Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={period}
              onChange={e => setPeriod(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold bg-white focus:outline-none"
            >
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="custom">Pilih Rentang</option>
            </select>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono"
              />
              <span className="text-gray-400 text-xs">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono"
              />
            </div>
          )}

          {activeReport === 'purchases' && (
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold bg-white"
            >
              <option value="all">Semua Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}

          {activeReport === 'sales' && (
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold bg-white"
            >
              <option value="all">Semua Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {/* Action Export Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleExportJournal}
              className="p-1.5 text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg flex items-center gap-1 transition"
              title="Ekspor seluruh riwayat transaksi untuk audit"
            >
              <Download className="w-3.5 h-3.5" /> Jurnal Audit (CSV)
            </button>
            <button
              onClick={handleExportCSV}
              className="p-1.5 text-xs font-bold bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg flex items-center gap-1 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak PDF
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-FRIENDLY CENTRAL DOCUMENT SHEET */}
      <div id="print-sheet" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-6">
        
        {/* Header Invoice/Report */}
        <div className="flex justify-between items-start pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-extrabold text-indigo-900 tracking-tight uppercase">{settings.shopName}</h1>
            <p className="text-xs text-gray-500 mt-1">Sistem ERP Manajemen Peternakan Bebek & Salted Eggs</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900">{getReportTitle()}</h2>
            <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 font-mono">
              Periode: {period === 'custom' ? `${Utils.formatDate(startDate)} - ${Utils.formatDate(endDate)}` : period.toUpperCase()}
            </p>
          </div>
        </div>

        {/* 1. REPORT CONTENT: INCOME STATEMENT */}
        {activeReport === 'income_statement' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Total Pendapatan</p>
                <p className="text-xl font-bold font-mono text-emerald-900 mt-1">{Utils.formatCurrency(incomeStatement.totalRevenue)}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Total HPP Penjualan</p>
                <p className="text-xl font-bold font-mono text-amber-900 mt-1">{Utils.formatCurrency(incomeStatement.totalCOGS)}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Laba Kotor Usaha</p>
                <p className="text-xl font-bold font-mono text-indigo-900 mt-1">{Utils.formatCurrency(incomeStatement.grossProfit)}</p>
              </div>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-gray-100 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Keterangan Akun Pengeluaran</th>
                    <th className="py-3.5 px-4 text-right">Nominal Pengeluaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium font-sans">
                  {Object.keys(incomeStatement.expensesByCategory).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 px-4 text-center text-gray-400">
                        Tidak ada catatan pengeluaran operasional pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    Object.keys(incomeStatement.expensesByCategory).map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-gray-800">Biaya Operasional - {cat}</td>
                        <td className="py-3 px-4 text-right font-bold font-mono text-rose-600">
                          -{Utils.formatCurrency(incomeStatement.expensesByCategory[cat])}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-rose-50/30 border-t border-gray-100 font-bold">
                    <td className="py-3 px-4 text-rose-900">TOTAL BIAYA OPERASIONAL OVERHEAD</td>
                    <td className="py-3 px-4 text-right font-mono text-rose-700">
                      -{Utils.formatCurrency(incomeStatement.totalOpCosts)}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-extrabold text-sm border-t-2 border-slate-200">
                    <td className="py-4 px-4 text-slate-800">LABA BERSIH BERJALAN (NET INCOME)</td>
                    <td className={`py-4 px-4 text-right font-mono ${incomeStatement.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {incomeStatement.netProfit >= 0 ? '+' : ''}{Utils.formatCurrency(incomeStatement.netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. REPORT CONTENT: INVENTORY VALUATION */}
        {activeReport === 'inventory' && (
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-gray-100 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Komoditas / Jenis Produk</th>
                    <th className="py-3.5 px-4 text-right">Volume Persediaan</th>
                    <th className="py-3.5 px-4 text-right">Moving Average Cost (HPP)</th>
                    <th className="py-3.5 px-4 text-right">Total Nilai Persediaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium font-sans">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-gray-800">Telur Bebek Segar (Raw Duck Eggs)</td>
                    <td className="py-3.5 px-4 text-right font-mono">{inventoryValuation.rawQty.toLocaleString('id-ID')} butir</td>
                    <td className="py-3.5 px-4 text-right font-mono">{Utils.formatCurrency(inventoryValuation.rawAvgCost)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-indigo-600 font-bold">{Utils.formatCurrency(inventoryValuation.rawValue)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-gray-800">Telur Bebek Asin (Salted Cured Eggs)</td>
                    <td className="py-3.5 px-4 text-right font-mono">{inventoryValuation.saltedQty.toLocaleString('id-ID')} butir</td>
                    <td className="py-3.5 px-4 text-right font-mono">{Utils.formatCurrency(inventoryValuation.saltedAvgCost)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-indigo-600 font-bold">{Utils.formatCurrency(inventoryValuation.saltedValue)}</td>
                  </tr>
                  <tr className="bg-indigo-50 font-extrabold text-sm border-t-2 border-indigo-100">
                    <td colSpan={3} className="py-4 px-4 text-indigo-900 uppercase">Total Aset Lancar Persediaan</td>
                    <td className="py-4 px-4 text-right font-mono text-indigo-800">
                      {Utils.formatCurrency(inventoryValuation.totalValue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. REPORT CONTENT: SALES LOG */}
        {activeReport === 'sales' && (
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-gray-100 uppercase tracking-wider">
                    <th className="py-3 px-2">Tanggal</th>
                    <th className="py-3 px-2">Customer / Produk</th>
                    <th className="py-3 px-2 text-right">Volume</th>
                    <th className="py-3 px-2 text-right">Harga Jual</th>
                    <th className="py-3 px-2 text-right">Omzet Bersih</th>
                    <th className="py-3 px-2 text-right">COGS (HPP)</th>
                    <th className="py-3 px-2 text-right">Laba Kotor</th>
                    <th className="py-3 px-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium font-sans">
                  {salesReport.sales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-400">
                        Tidak ada penjualan dalam periode ini.
                      </td>
                    </tr>
                  ) : (
                    salesReport.sales.map((s, idx) => {
                      const cust = customers.find(c => c.id === s.customerId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-2 font-mono whitespace-nowrap">{s.date}</td>
                          <td className="py-2.5 px-2">
                            <span className="font-bold text-slate-800">{cust ? cust.name : 'Umum'}</span>
                            <span className="text-[10px] text-gray-400 block font-mono">{s.eggType === 'RAW' ? 'Telur Segar' : 'Telur Asin'}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold">{s.qty.toLocaleString('id-ID')}</td>
                          <td className="py-2.5 px-2 text-right font-mono">{Utils.formatCurrency(s.pricePerUnit)}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-bold">{Utils.formatCurrency(s.totalRevenue)}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-rose-600">-{Utils.formatCurrency(s.cogs)}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-900 font-bold">{Utils.formatCurrency(s.grossProfit)}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-indigo-600">
                            {(s.totalRevenue > 0 ? (s.grossProfit / s.totalRevenue) * 100 : 0).toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-slate-50 font-bold border-t border-gray-100 text-[11px]">
                    <td colSpan={2} className="py-3 px-2 text-slate-800">TOTAL AKUMULASI PENJUALAN</td>
                    <td className="py-3 px-2 text-right font-mono">{salesReport.totalQty.toLocaleString('id-ID')} btr</td>
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-right font-mono text-emerald-700">{Utils.formatCurrency(salesReport.totalRevenue)}</td>
                    <td className="py-3 px-2 text-right font-mono text-rose-600">-{Utils.formatCurrency(salesReport.totalCOGS)}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-900">{Utils.formatCurrency(salesReport.totalGrossProfit)}</td>
                    <td className="py-3 px-2 text-right font-mono text-indigo-700">
                      {(salesReport.totalRevenue > 0 ? (salesReport.totalGrossProfit / salesReport.totalRevenue) * 100 : 0).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. REPORT CONTENT: STOCK CARDS */}
        {(activeReport === 'stock_raw' || activeReport === 'stock_salted') && (
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-gray-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Jenis Kegiatan</th>
                    <th className="py-3 px-4 text-right">Kuantitas Masuk / Keluar</th>
                    <th className="py-3 px-4 text-right">Harga Per Butir</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                    <th className="py-3 px-4 text-right">Saldo Stok Akhir</th>
                    <th className="py-3 px-4 text-right">HPP Moving Average Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium font-sans">
                  {((activeReport === 'stock_raw' ? rawStockCard : saltedStockCard)).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400">
                        Tidak ada mutasi persediaan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    ((activeReport === 'stock_raw' ? rawStockCard : saltedStockCard)).map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono whitespace-nowrap">{tx.date}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.qty > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-2.5 px-4 text-right font-bold font-mono ${tx.qty > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.qty > 0 ? `+${tx.qty}` : tx.qty}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">{Utils.formatCurrency(tx.pricePerUnit)}</td>
                        <td className="py-2.5 px-4 text-right font-mono">{Utils.formatCurrency(tx.totalCost)}</td>
                        <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-800">{tx.afterQty} btr</td>
                        <td className="py-2.5 px-4 text-right font-mono text-indigo-600 font-bold">{Utils.formatCurrency(tx.afterAvgCost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. REPORT CONTENT: PRODUCTION LOG */}
        {activeReport === 'production' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Produksi Telur Segar Kandang</p>
                <p className="text-xl font-bold font-mono text-slate-800 mt-1">{productionReport.totalFarmEggs.toLocaleString('id-ID')} butir</p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Pemrosesan Telur Asin (Batches)</p>
                <p className="text-xl font-bold font-mono text-slate-800 mt-1">{productionReport.totalSaltedEggs.toLocaleString('id-ID')} butir</p>
              </div>
            </div>

            {/* Farm yields */}
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Log Panen Kandang Bebek</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-gray-100">
                      <th className="py-2.5 px-4">Tanggal</th>
                      <th className="py-2.5 px-4 text-right">Hasil Panen (Butir)</th>
                      <th className="py-2.5 px-4 text-right">Harga Transfer</th>
                      <th className="py-2.5 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans font-medium">
                    {productionReport.farmProductions.length === 0 ? (
                      <tr><td colSpan={4} className="py-4 text-center text-gray-400">Tidak ada panen kandang pada periode ini.</td></tr>
                    ) : (
                      productionReport.farmProductions.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-mono">{p.date}</td>
                          <td className="py-2 px-4 text-right font-bold font-mono">{p.qty}</td>
                          <td className="py-2 px-4 text-right font-mono">{Utils.formatCurrency(p.transferPrice)}</td>
                          <td className="py-2 px-4 text-gray-400 truncate max-w-xs">{p.notes}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Salted batches */}
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Log Pemrosesan Batch Telur Asin</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-gray-100">
                      <th className="py-2.5 px-4">Batch No</th>
                      <th className="py-2.5 px-4">Tanggal Mulai</th>
                      <th className="py-2.5 px-4 text-right">Volume Input</th>
                      <th className="py-2.5 px-4 text-right">Total Biaya Produksi</th>
                      <th className="py-2.5 px-4 text-right">HPP / Butir</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans font-medium">
                    {productionReport.saltedBatches.length === 0 ? (
                      <tr><td colSpan={6} className="py-4 text-center text-gray-400">Tidak ada batch pengerjaan pada periode ini.</td></tr>
                    ) : (
                      productionReport.saltedBatches.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-mono font-bold text-gray-900">{b.batchNo}</td>
                          <td className="py-2 px-4 font-mono">{b.date}</td>
                          <td className="py-2 px-4 text-right font-bold font-mono">{b.qtyInput}</td>
                          <td className="py-2 px-4 text-right font-mono">{Utils.formatCurrency(b.totalCost)}</td>
                          <td className="py-2 px-4 text-right font-mono text-amber-700 font-bold">{Utils.formatCurrency(b.costPerUnit)}</td>
                          <td className="py-2 px-4 font-bold">{b.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. REPORT CONTENT: PURCHASES LOG */}
        {activeReport === 'purchases' && (
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-gray-100 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Supplier Pengadaan</th>
                    <th className="py-3.5 px-4 text-right">Jumlah (Butir)</th>
                    <th className="py-3.5 px-4 text-right">Harga Satuan</th>
                    <th className="py-3.5 px-4 text-right">Total Pembelian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium font-sans">
                  {purchaseReport.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        Tidak ada pengadaan telur bebek eksternal pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    purchaseReport.map((p, idx) => {
                      const sup = suppliers.find(s => s.id === p.refId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono whitespace-nowrap">{p.date}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">{sup ? sup.name : 'Supplier'}</span>
                            <span className="text-[10px] text-gray-400 block">{p.notes}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-mono">{p.qty.toLocaleString('id-ID')} btr</td>
                          <td className="py-3 px-4 text-right font-mono">{Utils.formatCurrency(p.totalCost / p.qty)}</td>
                          <td className="py-3 px-4 text-right font-mono text-sky-600 font-bold">{Utils.formatCurrency(p.totalCost)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Author sign block at bottom of printed report */}
        <div className="pt-12 flex justify-between text-[11px] text-gray-400 font-medium">
          <div>
            <p>HouseERP System Automation</p>
            <p className="mt-0.5">Tanggal Cetak: {new Date().toLocaleString('id-ID')}</p>
          </div>
          <div className="text-right">
            <p>Penanggung Jawab Keuangan</p>
            <div className="h-10"></div>
            <p className="font-bold text-gray-600">( ________________________ )</p>
          </div>
        </div>

      </div>
    </div>
  );
}
