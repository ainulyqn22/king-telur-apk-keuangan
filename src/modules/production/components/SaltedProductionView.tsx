import React, { useEffect, useState } from 'react';
import {
  Plus,
  Flame,
  Clock,
  CheckCircle,
  TrendingUp,
  RotateCw,
  HelpCircle,
  AlertTriangle,
  Compass
} from 'lucide-react';
import { BatchManager, Utils } from '../../../utils/managers';
import { BatchStatus } from '../../../types';
import { useProductionBatchController } from '../controllers/useProductionBatchController';

interface SaltedProductionViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
  refreshKey: number;
}

export default function SaltedProductionView({ showToast, onRefresh, refreshKey }: SaltedProductionViewProps) {
  const { batches, rawStock, loading, saving, error, reload, create, transition } = useProductionBatchController();
  useEffect(()=>{if(refreshKey>0)void reload();},[refreshKey,reload]);
  useEffect(()=>{if(error)showToast(error,'error');},[error,showToast]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [qtyInput, setQtyInput] = useState<number | ''>('');
  const [saltCost, setSaltCost] = useState<number | ''>(0);
  const [ashCost, setAshCost] = useState<number | ''>(0);
  const [plasticCost, setPlasticCost] = useState<number | ''>(0);
  const [packagingCost, setPackagingCost] = useState<number | ''>(0);
  const [laborCost, setLaborCost] = useState<number | ''>(0);
  const [otherCost, setOtherCost] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter list
  const filteredBatches = batches.filter(b => {
    return b.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) || b.date.includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const currentBatches = filteredBatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const rawEggCost = qtyInput !== '' ? Number(qtyInput) * rawStock.avgCost : 0;
  const materialsCost = (Number(saltCost) || 0) + (Number(ashCost) || 0) + (Number(plasticCost) || 0) + (Number(packagingCost) || 0);
  const totalProductionCost = rawEggCost + materialsCost + (Number(laborCost) || 0) + (Number(otherCost) || 0);
  const unitCost = qtyInput ? totalProductionCost / Number(qtyInput) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      showToast('Tanggal wajib diisi!', 'error');
      return;
    }
    if (!qtyInput || qtyInput <= 0) {
      showToast('Kuantitas produksi harus bernilai positif!', 'error');
      return;
    }
    if (qtyInput > rawStock.qty) {
      showToast(`Stok telur segar tidak mencukupi! Tersedia: ${rawStock.qty} butir, diminta: ${qtyInput} butir.`, 'error');
      return;
    }

    try {
      await create({
        date,
        qtyInput: Number(qtyInput),
        saltCost: Number(saltCost) || 0,
        ashCost: Number(ashCost) || 0,
        plasticCost: Number(plasticCost) || 0,
        packagingCost: Number(packagingCost) || 0,
        laborCost: Number(laborCost) || 0,
        otherCost: Number(otherCost) || 0,
        notes: notes || 'Batch pemeraman telur asin baru'
      });

      showToast('Batch produksi baru berhasil dibuat & stok telur segar berkurang!', 'success');
      
      // Reset
      setQtyInput('');
      setSaltCost(0);
      setAshCost(0);
      setPlasticCost(0);
      setPackagingCost(0);
      setLaborCost(0);
      setOtherCost(0);
      setNotes('');
      onRefresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan batch produksi', 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: BatchStatus) => {
    try {
      await transition(id, newStatus);
      showToast(`Status batch berhasil diubah ke "${newStatus}"!`, 'success');
      onRefresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah status', 'error');
    }
  };

  return (
    <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Production Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Flame className="text-amber-500 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">Mulai Batch Produksi</h2>
        </div>

        {/* Info panel of raw stock moving average */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
          <div>
            <p className="text-gray-500">Stok Telur Segar Tersedia:</p>
            <p className="font-bold text-gray-800 text-sm mt-0.5">{rawStock.qty.toLocaleString('id-ID')} butir</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">HPP Rata-rata Saat Ini:</p>
            <p className="font-bold text-amber-700 text-sm mt-0.5">{Utils.formatCurrency(rawStock.avgCost)}</p>
          </div>
        </div>

        <form onSubmit={(event)=>{void handleSubmit(event);}} className="space-y-4 text-xs font-medium text-gray-700">
          <div>
            <label className="block text-gray-500 mb-1">Tanggal Mulai Curing *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-semibold font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Jumlah Telur yang Diproduksi *</label>
            <input
              type="number"
              min="1"
              placeholder={`Maks: ${rawStock.qty} butir`}
              value={qtyInput}
              onChange={e => setQtyInput(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
              required
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Komponen Biaya Tambahan</span>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-gray-400 mb-0.5">Biaya Garam (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={saltCost}
                  onChange={e => setSaltCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5">Biaya Abu Gosok (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={ashCost}
                  onChange={e => setAshCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-gray-400 mb-0.5">Mika/Plastik (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={plasticCost}
                  onChange={e => setPlasticCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5">Kemasan/Stiker (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={packagingCost}
                  onChange={e => setPackagingCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-gray-400 mb-0.5">Upah Tenaga Kerja (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={laborCost}
                  onChange={e => setLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5">Biaya Lain-lain (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={otherCost}
                  onChange={e => setOtherCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {qtyInput !== '' && (
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-2">
              <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Kalkulasi HPP Batch Telur Asin</p>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Bahan Baku Telur Segar:</span>
                <span className="font-mono">{Utils.formatCurrency(rawEggCost)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Total Tambahan Bahan & Upah:</span>
                <span className="font-mono">{Utils.formatCurrency(totalProductionCost - rawEggCost)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-900 font-bold border-t border-dashed border-amber-200 pt-1.5">
                <span>Nilai Batch Total:</span>
                <span className="font-mono text-amber-700">{Utils.formatCurrency(totalProductionCost)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-800 font-bold">
                <span>Estimasi HPP per butir:</span>
                <span className="font-mono text-emerald-700">{Utils.formatCurrency(unitCost)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-500 mb-1">Catatan</label>
            <textarea
              rows={2}
              placeholder="Sebutkan catatan pengerjaan..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> {saving?'Menyimpan...':'Mulai Proses Pemeraman (Curing)'}
          </button>
        </form>
      </div>

      {/* Production Batch List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Daftar Batch & Monitoring Pemeraman</h2>
            <p className="text-xs text-gray-400 mt-0.5">Lacak usia pemeraman, estimasi tanggal panen, dan perbarui status panen batch.</p>
          </div>
          <input
            type="text"
            placeholder="Cari Batch No..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-60"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Batch No / Tgl</th>
                <th className="py-3 px-2 text-right">Volume</th>
                <th className="py-3 px-2 text-right">Total Biaya</th>
                <th className="py-3 px-2 text-right">HPP Satuan</th>
                <th className="py-3 px-2 text-center">Usia & Estimasi</th>
                <th className="py-3 px-2 text-center">Status Batch</th>
                <th className="py-3 px-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700 font-medium font-sans">
              {loading ? (<tr><td colSpan={7} className="text-center py-8 text-gray-400">Memuat data PostgreSQL...</td></tr>) : currentBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Tidak ditemukan data batch produksi.
                  </td>
                </tr>
              ) : (
                currentBatches.map((batch) => {
                  const age = BatchManager.getBatchAge(batch);
                  const isReadyForHarvest = batch.status === 'Pemeraman' && age >= 12;
                  const badge = BatchManager.getBatchStatusBadge(batch.status);

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-2">
                        <span className="font-mono font-bold text-gray-900">{batch.batchNo}</span>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{Utils.formatDate(batch.date)}</p>
                      </td>
                      <td className="py-3 px-2 text-right font-bold font-mono text-gray-900">{batch.qtyInput.toLocaleString('id-ID')} btr</td>
                      <td className="py-3 px-2 text-right font-mono text-gray-600">{Utils.formatCurrency(batch.totalCost)}</td>
                      <td className="py-3 px-2 text-right font-mono text-amber-700 font-bold">{Utils.formatCurrency(batch.costPerUnit)}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-bold text-xs ${isReadyForHarvest ? 'text-amber-600 animate-bounce' : 'text-gray-700'}`}>
                            {age} Hari Peram
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5">Estimasi Panen: {Utils.formatDate(batch.harvestDate)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${badge.bg} ${badge.text}`}>
                            {badge.text}
                          </span>
                          
                          {/* Status changer buttons */}
                          <div className="flex gap-1 mt-1">
                            {batch.status === 'Pemeraman' && (
                              <button
                                onClick={() => {void handleStatusChange(batch.id, 'Siap Panen');}}
                                className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[9px] font-bold hover:bg-amber-700"
                              >
                                Siap Panen
                              </button>
                            )}
                            {batch.status === 'Siap Panen' && (
                              <button onClick={() => {void handleStatusChange(batch.id,'Siap Dijual');}} className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold hover:bg-emerald-700">Masuk Stok</button>
                            )}
                            {batch.status === 'Siap Dijual' && (
                              <button
                                onClick={() => {void handleStatusChange(batch.id, 'Selesai');}}
                                className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold hover:bg-emerald-700"
                              >
                                Selesaikan
                              </button>
                            )}
                          </div>
                        </div>
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
            <span className="text-gray-500">Menampilkan {(currentPage-1)*itemsPerPage+1}-{Math.min(currentPage*itemsPerPage, filteredBatches.length)} dari {filteredBatches.length} data</span>
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
                  className={`px-3 py-1 rounded-lg font-bold text-xs ${currentPage === idx + 1 ? 'bg-amber-500 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
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
