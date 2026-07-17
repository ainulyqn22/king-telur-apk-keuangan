import React, { useState } from 'react';
import {
  Plus,
  Trash,
  ClipboardList,
  Flame,
  Activity,
  HeartCrack,
  Dribbble,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { ProductionManager, StorageManager, Utils } from '../../../utils/managers';
import { FarmProduction, Settings } from '../../../types';

interface FarmProductionViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
  refreshKey: number;
}

export default function FarmProductionView({ showToast, onRefresh, refreshKey }: FarmProductionViewProps) {
  const productions = ProductionManager.getProductions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const settings = StorageManager.getData<Settings>('settings') || { shopName: '', logo: '', currency: 'Rp', defaultTransferPrice: 2000 };

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [qty, setQty] = useState<number | ''>('');
  const [transferPrice, setTransferPrice] = useState<number>(settings.defaultTransferPrice || 2000);
  const [population, setPopulation] = useState<number | ''>(500);
  const [productiveCount, setProductiveCount] = useState<number | ''>(420);
  const [culledCount, setCulledCount] = useState<number | ''>(0);
  const [mortality, setMortality] = useState<number | ''>(0);
  const [feedQty, setFeedQty] = useState<number | ''>(50);
  const [feedCost, setFeedCost] = useState<number | ''>(350000);
  const [notes, setNotes] = useState('');

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter list
  const filteredProds = productions.filter(p => {
    return p.notes.toLowerCase().includes(searchTerm.toLowerCase()) || p.date.includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredProds.length / itemsPerPage);
  const currentProds = filteredProds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      showToast('Tanggal wajib diisi!', 'error');
      return;
    }
    if (!qty || qty <= 0) {
      showToast('Jumlah telur harus bernilai positif!', 'error');
      return;
    }
    if (!transferPrice || transferPrice <= 0) {
      showToast('Harga transfer harus bernilai positif!', 'error');
      return;
    }
    if (!population || population <= 0) {
      showToast('Jumlah populasi bebek wajib diisi!', 'error');
      return;
    }
    if (!productiveCount || productiveCount < 0) {
      showToast('Jumlah bebek produktif tidak boleh negatif!', 'error');
      return;
    }

    try {
      ProductionManager.addProduction({
        date,
        qty: Number(qty),
        transferPrice: Number(transferPrice),
        population: Number(population),
        productiveCount: Number(productiveCount),
        culledCount: Number(culledCount) || 0,
        mortality: Number(mortality) || 0,
        feedQty: Number(feedQty) || 0,
        feedCost: Number(feedCost) || 0,
        notes: notes || 'Pencatatan produksi harian otomatis'
      });

      showToast('Hasil produksi kandang berhasil dicatat dan stok telur segar terupdate!', 'success');
      
      // Reset some fields
      setQty('');
      setNotes('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data produksi', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan produksi ini? Tindakan ini akan mengurangi stok telur segar dan memperbarui Moving Average.')) {
      try {
        ProductionManager.deleteProduction(id);
        showToast('Catatan produksi berhasil dihapus!', 'success');
        onRefresh();
      } catch (err: any) {
        showToast(err.message || 'Gagal menghapus data', 'error');
      }
    }
  };

  return (
    <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Form Column */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <ClipboardList className="text-amber-500 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">Input Produksi Kandang</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-gray-700">
          <div>
            <label className="block text-gray-500 mb-1">Tanggal Panen *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-semibold font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-500 mb-1">Hasil Telur (Butir) *</label>
              <input
                type="number"
                min="1"
                placeholder="misal: 150"
                value={qty}
                onChange={e => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Harga Transfer (Rp) *</label>
              <input
                type="number"
                min="100"
                value={transferPrice}
                onChange={e => setTransferPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                required
              />
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 space-y-3.5">
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Biometrik & Monitoring Bebek
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-0.5">Total Bebek *</label>
                <input
                  type="number"
                  placeholder="Ekor"
                  value={population}
                  onChange={e => setPopulation(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-0.5">Bebek Produktif *</label>
                <input
                  type="number"
                  placeholder="Ekor"
                  value={productiveCount}
                  onChange={e => setProductiveCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-0.5">Bebek Afkir</label>
                <input
                  type="number"
                  placeholder="Ekor"
                  value={culledCount}
                  onChange={e => setCulledCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-0.5">Mortalitas (Mati)</label>
                <input
                  type="number"
                  placeholder="Ekor"
                  value={mortality}
                  onChange={e => setMortality(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-0.5">Konsumsi Pakan (Kg)</label>
                <input
                  type="number"
                  placeholder="Kg"
                  value={feedQty}
                  onChange={e => setFeedQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-0.5">Biaya Pakan (Rp)</label>
                <input
                  type="number"
                  placeholder="Rupiah"
                  value={feedCost}
                  onChange={e => setFeedCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Catatan</label>
            <textarea
              rows={2}
              placeholder="misal: Panen melimpah, cuaca cerah..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition flex items-center justify-center gap-1.5 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> Simpan Produksi & Tambah Stok
          </button>
        </form>
      </div>

      {/* Grid List Columns */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Riwayat Produksi & Analisis Produktivitas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Menampilkan log panen bebek dan efisiensi biological asset.</p>
          </div>
          <input
            type="text"
            placeholder="Cari tanggal atau catatan..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-60"
          />
        </div>

        {/* Flock Metrics Quick Look */}
        {productions.length > 0 && (
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-400">Total Populasi</p>
              <p className="text-sm font-bold font-mono text-slate-800">{productions[0].population} ekor</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-400">Produktif</p>
              <p className="text-sm font-bold font-mono text-emerald-600">{productions[0].productiveCount} ekor</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-400">Rasio Bertelur</p>
              <p className="text-sm font-bold font-mono text-sky-600">
                {productions[0].productiveCount > 0 ? ((productions[0].qty / productions[0].productiveCount) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-400">Rasio Pakan/Butir</p>
              <p className="text-sm font-bold font-mono text-indigo-600">
                {productions[0].qty > 0 ? (productions[0].feedQty / productions[0].qty).toFixed(2) : 0} kg
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Tanggal</th>
                <th className="py-3 px-2 text-right">Hasil Panen</th>
                <th className="py-3 px-2 text-right">Harga Transfer</th>
                <th className="py-3 px-2 text-right">Produktivitas</th>
                <th className="py-3 px-2 text-right">Mortalitas</th>
                <th className="py-3 px-2 text-right">HPP Estimasi</th>
                <th className="py-3 px-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700 font-medium font-sans">
              {currentProds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Tidak ditemukan data produksi kandang.
                  </td>
                </tr>
              ) : (
                currentProds.map((prod) => {
                  const productivity = prod.productiveCount > 0 ? (prod.qty / prod.productiveCount) * 100 : 0;
                  const perDuck = prod.productiveCount > 0 ? (prod.qty / prod.productiveCount) : 0;
                  const estimatedHpp = prod.qty > 0 && prod.feedCost ? (prod.feedCost / prod.qty) : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-2 font-mono whitespace-nowrap">{Utils.formatDate(prod.date)}</td>
                      <td className="py-3 px-2 text-right font-bold font-mono text-gray-900">{prod.qty.toLocaleString('id-ID')} btr</td>
                      <td className="py-3 px-2 text-right font-mono text-gray-600">{Utils.formatCurrency(prod.transferPrice)}</td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <span className="font-mono text-emerald-600 font-bold">{productivity.toFixed(1)}%</span>
                        <p className="text-[10px] text-gray-400 font-sans mt-0.5">({perDuck.toFixed(2)} btr/ekor)</p>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {prod.mortality > 0 ? (
                          <span className="text-rose-600 font-bold font-mono flex items-center justify-end gap-0.5">
                            <HeartCrack className="w-3 h-3" /> {prod.mortality} ekor
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-indigo-600">
                        {estimatedHpp > 0 ? Utils.formatCurrency(estimatedHpp) : '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition rounded-lg"
                          title="Hapus catatan"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
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
            <span className="text-gray-500">Menampilkan {(currentPage-1)*itemsPerPage+1}-{Math.min(currentPage*itemsPerPage, filteredProds.length)} dari {filteredProds.length} data</span>
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
