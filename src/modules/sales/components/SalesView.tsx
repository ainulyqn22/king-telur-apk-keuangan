import React, { useEffect, useState } from 'react';
import {
  Plus,
  ShoppingBag,
  TrendingUp,
  Coins,
  ShieldAlert,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Utils } from '../../../utils/managers';
import { useSalesController } from '../controllers/useSalesController';

interface SalesViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
  refreshKey: number;
}

export default function SalesView({ showToast, onRefresh, refreshKey }: SalesViewProps) {
  const {customers,sales,rawStock,saltedStock,loading,saving,error,reload,record}=useSalesController();
  useEffect(()=>{if(refreshKey>0)void reload();},[refreshKey,reload]);
  useEffect(()=>{if(error)showToast(error,'error');},[error,showToast]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState('');
  const [eggType, setEggType] = useState<'RAW' | 'SALTED'>('SALTED');
  const [qty, setQty] = useState<number | ''>('');
  const [pricePerUnit, setPricePerUnit] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [shippingCost, setShippingCost] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter list
  const filteredSales = sales.filter(s => {
    const cust = customers.find(c => c.id === s.customerId);
    const custName = cust ? cust.name : 'Umum';
    return custName.toLowerCase().includes(searchTerm.toLowerCase()) || s.notes.toLowerCase().includes(searchTerm.toLowerCase()) || s.date.includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const currentSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedStock = eggType === 'RAW' ? rawStock : saltedStock;
  const itemCogs = selectedStock.avgCost;
  const calculatedCogs = qty !== '' ? Number(qty) * itemCogs : 0;
  const subtotalRevenue = qty !== '' && pricePerUnit !== '' ? Number(qty) * Number(pricePerUnit) : 0;
  const netRevenue = subtotalRevenue - (Number(discount) || 0) + (Number(shippingCost) || 0);
  const calculatedProfit = netRevenue - calculatedCogs;
  const marginPct = netRevenue > 0 ? (calculatedProfit / netRevenue) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      showToast('Tanggal transaksi wajib diisi!', 'error');
      return;
    }
    if (!customerId) {
      showToast('Silakan pilih customer!', 'error');
      return;
    }
    if (!qty || qty <= 0) {
      showToast('Kuantitas telur harus bernilai positif!', 'error');
      return;
    }
    if (!pricePerUnit || pricePerUnit <= 0) {
      showToast('Harga jual harus bernilai positif!', 'error');
      return;
    }

    // Verify stock availability
    if (eggType === 'RAW' && qty > rawStock.qty) {
      showToast(`Stok telur segar tidak mencukupi! Tersedia: ${rawStock.qty} butir, diminta: ${qty} butir.`, 'error');
      return;
    }
    if (eggType === 'SALTED' && qty > saltedStock.qty) {
      showToast(`Stok telur asin tidak mencukupi! Tersedia: ${saltedStock.qty} butir, diminta: ${qty} butir.`, 'error');
      return;
    }

    try {
      await record({
        date,
        customerId,
        eggType,
        qty: Number(qty),
        pricePerUnit: Number(pricePerUnit),
        discount: Number(discount) || 0,
        shippingCost: Number(shippingCost) || 0,
        notes: notes || 'Penjualan produk telur'
      });

      showToast('Penjualan berhasil dicatat! Persediaan produk berkurang.', 'success');
      
      // Reset
      setQty('');
      setPricePerUnit('');
      setDiscount(0);
      setShippingCost(0);
      setNotes('');
      onRefresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan transaksi penjualan', 'error');
    }
  };

  return (
    <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Sale Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <ShoppingBag className="text-emerald-500 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">Catat Penjualan Baru</h2>
        </div>

        {/* Stock warning status */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
            <span className="text-gray-500 block">Stok Segar:</span>
            <span className="font-bold text-slate-800 font-mono">{rawStock.qty.toLocaleString('id-ID')} butir</span>
          </div>
          <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
            <span className="text-gray-500 block">Stok Asin:</span>
            <span className="font-bold text-slate-800 font-mono">{saltedStock.qty.toLocaleString('id-ID')} butir</span>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 flex items-start gap-2 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Belum ada Pelanggan!</p>
              <p className="mt-1">Silakan daftarkan pelanggan baru di halaman <strong>Master Data</strong> terlebih dahulu sebelum melakukan transaksi penjualan.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={(event)=>{void handleSubmit(event);}} className="space-y-4 text-xs font-medium text-gray-700">
            <div>
              <label className="block text-gray-500 mb-1">Tanggal Transaksi *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-semibold font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Jenis Telur *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEggType('SALTED'); setPricePerUnit(3500); }}
                    className={`flex-1 py-2 rounded-xl font-bold transition border ${eggType === 'SALTED' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                  >
                    Asin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEggType('RAW'); setPricePerUnit(2300); }}
                    className={`flex-1 py-2 rounded-xl font-bold transition border ${eggType === 'RAW' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                  >
                    Segar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Pelanggan *</label>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  required
                >
                  <option value="">-- Pilih Customer --</option>
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>{cust.name} ({cust.type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Jumlah (Butir) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder={`Maks: ${selectedStock.qty} btr`}
                  value={qty}
                  onChange={e => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Harga Jual / Butir *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="misal: 3500"
                  value={pricePerUnit}
                  onChange={e => setPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Diskon Total (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Biaya Ongkir Kirim (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={shippingCost}
                  onChange={e => setShippingCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-mono"
                />
              </div>
            </div>

            {/* Real-time Profit Estimator Card */}
            {qty !== '' && pricePerUnit !== '' && (
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> Analisis Profitabilitas Transaksi
                </span>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal Omzet:</span>
                  <span className="font-mono font-semibold">{Utils.formatCurrency(subtotalRevenue)}</span>
                </div>
                {discount !== '' && Number(discount) > 0 && (
                  <div className="flex justify-between text-xs text-rose-600">
                    <span>Diskon Pelanggan:</span>
                    <span className="font-mono font-semibold">-{Utils.formatCurrency(Number(discount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-600 border-b border-gray-100 pb-1.5">
                  <span>Ongkos Kirim:</span>
                  <span className="font-mono font-semibold">+{Utils.formatCurrency(Number(shippingCost) || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-900 font-bold">
                  <span>Pendapatan Bersih:</span>
                  <span className="font-mono text-emerald-700">{Utils.formatCurrency(netRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>HPP Persediaan Terjual:</span>
                  <span className="font-mono font-semibold text-rose-600">-{Utils.formatCurrency(calculatedCogs)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-dashed border-emerald-200 text-emerald-900">
                  <span>Estimasi Laba Kotor:</span>
                  <span className="font-mono">+{Utils.formatCurrency(calculatedProfit)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Margin Profit:</span>
                  <span className="font-mono font-bold text-emerald-700">{marginPct.toFixed(1)}%</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-500 mb-1">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="misal: Ambil sendiri, pembayaran lunas di tempat..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" /> {saving?'Menyimpan...':'Simpan Invoice Penjualan'}
            </button>
          </form>
        )}
      </div>

      {/* Sales Transactions List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Riwayat Transaksi Penjualan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Menampilkan detail invoice penjualan, HPP actual, laba kotor, dan margin.</p>
          </div>
          <input
            type="text"
            placeholder="Cari customer atau catatan..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-60"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Tanggal</th>
                <th className="py-3 px-2">Pelanggan / Produk</th>
                <th className="py-3 px-2 text-right">Volume</th>
                <th className="py-3 px-2 text-right">Harga Jual</th>
                <th className="py-3 px-2 text-right">Omzet Bersih</th>
                <th className="py-3 px-2 text-right">Laba Kotor</th>
                <th className="py-3 px-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700 font-medium font-sans">
              {loading ? (<tr><td colSpan={7} className="text-center py-8 text-gray-400">Memuat data PostgreSQL...</td></tr>) : currentSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Belum ada transaksi penjualan yang tercatat.
                  </td>
                </tr>
              ) : (
                currentSales.map((sale) => {
                  const cust = customers.find(c => c.id === sale.customerId);
                  const margin = sale.totalRevenue > 0 ? (sale.grossProfit / sale.totalRevenue) * 100 : 0;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-2 font-mono whitespace-nowrap">{Utils.formatDate(sale.date)}</td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-800">{cust ? cust.name : 'Customer Umum'}</span>
                        <div className="flex gap-1.5 items-center mt-0.5">
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${sale.eggType === 'RAW' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                            {sale.eggType === 'RAW' ? 'Segar' : 'Asin'}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate max-w-xs">{sale.notes}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold font-mono text-gray-900">{sale.qty.toLocaleString('id-ID')} btr</td>
                      <td className="py-3 px-2 text-right font-mono text-gray-600">
                        {Utils.formatCurrency(sale.pricePerUnit)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-600 font-bold">
                        {Utils.formatCurrency(sale.totalRevenue)}
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <span className="font-mono text-slate-800 font-bold">{Utils.formatCurrency(sale.grossProfit)}</span>
                        <p className="text-[9px] text-gray-400 font-semibold font-sans mt-0.5">Margin: {margin.toFixed(0)}%</p>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-[10px] text-gray-400" title="Gunakan transaksi reversal, jangan menghapus jurnal">Terkunci</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
            <span className="text-gray-500">Menampilkan {(currentPage-1)*itemsPerPage+1}-{Math.min(currentPage*itemsPerPage, filteredSales.length)} dari {filteredSales.length} data</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-xs transition"
              >
                Kembali
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs ${currentPage === idx + 1 ? 'bg-emerald-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-xs transition"
              >
                Lanjut
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
