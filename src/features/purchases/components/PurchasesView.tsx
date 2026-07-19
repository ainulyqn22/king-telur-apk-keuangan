import React, { useEffect, useState } from 'react';
import {
  Plus,
  Truck,
  ShoppingCart,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Utils } from '@/shared/utils';
import { usePurchaseController } from '../controllers/usePurchaseController';

interface PurchasesViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
  refreshKey: number;
}

export default function PurchasesView({ showToast, onRefresh, refreshKey }: PurchasesViewProps) {
  const { suppliers, purchases: rawTxs, loading, saving, error, record, reload } = usePurchaseController();

  useEffect(() => { if (refreshKey > 0) void reload(); }, [refreshKey, reload]);
  useEffect(() => { if (error) showToast(error, 'error'); }, [error, showToast]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState('');
  const [qty, setQty] = useState<number | ''>('');
  const [pricePerUnit, setPricePerUnit] = useState<number | ''>('');
  const [shippingCost, setShippingCost] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter list
  const filteredPurchases = rawTxs.filter(tx => {
    return tx.notes.toLowerCase().includes(searchTerm.toLowerCase()) || tx.date.includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const currentPurchases = filteredPurchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const calculatedTotal = qty && pricePerUnit ? (Number(qty) * Number(pricePerUnit)) + (Number(shippingCost) || 0) : 0;
  const calculatedAvgCost = qty ? (calculatedTotal / Number(qty)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      showToast('Tanggal wajib diisi!', 'error');
      return;
    }
    if (!supplierId) {
      showToast('Silakan pilih supplier!', 'error');
      return;
    }
    if (!qty || qty <= 0) {
      showToast('Kuantitas telur harus bernilai positif!', 'error');
      return;
    }
    if (!pricePerUnit || pricePerUnit <= 0) {
      showToast('Harga per unit harus bernilai positif!', 'error');
      return;
    }

    try {
      await record({
        date,
        supplierId,
        qty: Number(qty),
        pricePerUnit: Number(pricePerUnit),
        shippingCost: Number(shippingCost) || 0,
        notes,
      });

      showToast('Pembelian berhasil dicatat dan moving average terupdate!', 'success');
      
      // Reset
      setQty('');
      setPricePerUnit('');
      setShippingCost(0);
      setNotes('');
      onRefresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan transaksi pembelian', 'error');
    }
  };

  return (
    <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Purchase Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <ShoppingCart className="text-sky-500 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">Catat Pembelian Telur</h2>
        </div>

        {suppliers.length === 0 ? (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 flex items-start gap-2 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Belum ada Supplier!</p>
              <p className="mt-1">Anda harus mendaftarkan supplier terlebih dahulu di halaman <strong>Master Data</strong> sebelum mencatat pembelian telur.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => { void handleSubmit(event); }} className="space-y-4 text-xs font-medium text-gray-700">
            <div>
              <label className="block text-gray-500 mb-1">Tanggal Transaksi *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm font-semibold font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-1">Supplier *</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm"
                required
              >
                <option value="">-- Pilih Supplier --</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name} ({sup.address})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Jumlah (Butir) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="misal: 1000"
                  value={qty}
                  onChange={e => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Harga Beli / Butir *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="misal: 1800"
                  value={pricePerUnit}
                  onChange={e => setPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 mb-1">Biaya Ongkos Kirim (Rp)</label>
              <input
                type="number"
                min="0"
                placeholder="misal: 50000"
                value={shippingCost}
                onChange={e => setShippingCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm font-mono"
              />
            </div>

            {/* Live Financial Cost Estimate Panel */}
            {qty !== '' && pricePerUnit !== '' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Estimasi Pembebanan Persediaan</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal Barang:</span>
                  <span className="font-mono font-semibold">{Utils.formatCurrency(Number(qty) * Number(pricePerUnit))}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 border-b border-gray-100 pb-1.5">
                  <span>Ongkos Kirim:</span>
                  <span className="font-mono font-semibold">{Utils.formatCurrency(Number(shippingCost) || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-900 font-bold">
                  <span>Total Pengadaan (HPP):</span>
                  <span className="font-mono text-sky-700">{Utils.formatCurrency(calculatedTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 pt-1 border-t border-dashed border-gray-200">
                  <span>Beban HPP Masuk per butir:</span>
                  <span className="font-mono font-bold text-slate-800">{Utils.formatCurrency(calculatedAvgCost)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-500 mb-1">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="misal: Telur bebek asin berkualitas tinggi..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Pembelian & Tambah Stok'}
            </button>
          </form>
        )}
      </div>

      {/* Purchases List Column */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Riwayat Pembelian Telur Segar</h2>
            <p className="text-xs text-gray-400 mt-0.5">Menampilkan pengadaan telur dari pihak eksternal.</p>
          </div>
          <input
            type="text"
            placeholder="Cari tanggal atau catatan..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-60"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Tanggal</th>
                <th className="py-3 px-2">Supplier/Log</th>
                <th className="py-3 px-2 text-right">Volume</th>
                <th className="py-3 px-2 text-right">Harga Satuan</th>
                <th className="py-3 px-2 text-right">Beban Total HPP</th>
                <th className="py-3 px-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700 font-medium font-sans">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Memuat data PostgreSQL...</td></tr>
              ) : currentPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Tidak ditemukan data transaksi pembelian.
                  </td>
                </tr>
              ) : (
                currentPurchases.map((tx) => {
                  // Find supplier
                  const sup = suppliers.find(s => s.id === tx.refId);
                  
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-2 font-mono whitespace-nowrap">{Utils.formatDate(tx.date)}</td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-800">{sup ? sup.name : 'Supplier'}</span>
                        <p className="text-[10px] text-gray-400 max-w-xs truncate">{tx.notes}</p>
                      </td>
                      <td className="py-3 px-2 text-right font-bold font-mono text-gray-900">{tx.qty.toLocaleString('id-ID')} btr</td>
                      <td className="py-3 px-2 text-right font-mono text-gray-600">
                        {Utils.formatCurrency(tx.totalCost / tx.qty)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sky-600 font-bold">
                        {Utils.formatCurrency(tx.totalCost)}
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
            <span className="text-gray-500">Menampilkan {(currentPage-1)*itemsPerPage+1}-{Math.min(currentPage*itemsPerPage, filteredPurchases.length)} dari {filteredPurchases.length} data</span>
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
                  className={`px-3 py-1 rounded-lg font-bold text-xs ${currentPage === idx + 1 ? 'bg-sky-500 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
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
