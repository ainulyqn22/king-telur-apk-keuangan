import React, { useEffect, useState } from 'react';
import {
  Plus,
  DollarSign,
  Briefcase,
  Layers,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Utils } from '../../../shared/utils';
import { useExpenseController } from '../controllers/useExpenseController';

interface ExpensesViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
  refreshKey: number;
}

export default function ExpensesView({ showToast, onRefresh, refreshKey }: ExpensesViewProps) {
  const{categories,costs,loading,saving,error,reload,record,createCategory}=useExpenseController();
  useEffect(()=>{if(refreshKey>0)void reload();},[refreshKey,reload]);
  useEffect(()=>{if(error)showToast(error,'error');},[error,showToast]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  // Category addition state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter list
  const filteredCosts = costs.filter(c => {
    return c.category.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase()) || c.date.includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredCosts.length / itemsPerPage);
  const currentCosts = filteredCosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      showToast('Tanggal wajib diisi!', 'error');
      return;
    }
    if (!category) {
      showToast('Kategori biaya wajib dipilih!', 'error');
      return;
    }
    if (!amount || amount <= 0) {
      showToast('Nominal biaya harus bernilai positif!', 'error');
      return;
    }

    try {
      await record({
        date,
        category,
        amount: Number(amount),
        description: description || `Biaya ${category}`
      });

      showToast('Biaya operasional berhasil dicatat!', 'success');
      
      // Reset
      setAmount('');
      setDescription('');
      onRefresh();
    } catch (err: unknown) {
      showToast(err instanceof Error?err.message:'Gagal menyimpan pengeluaran', 'error');
    }
  };
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showToast('Nama kategori tidak boleh kosong!', 'error');
      return;
    }

    const trimmed = newCategoryName.trim();
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      showToast('Kategori ini sudah terdaftar!', 'error');
      return;
    }

    try{const created=await createCategory(trimmed);showToast('Kategori baru berhasil ditambahkan!','success');setCategory(created);setNewCategoryName('');setIsAddingCategory(false);onRefresh();}catch(err:unknown){showToast(err instanceof Error?err.message:'Gagal menambah kategori','error');}
  };

  return (
    <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Expense Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <DollarSign className="text-rose-500 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">Catat Pengeluaran Baru</h2>
        </div>

        <form onSubmit={(event)=>{void handleSubmit(event);}} className="space-y-4 text-xs font-medium text-gray-700">
          <div>
            <label className="block text-gray-500 mb-1">Tanggal Pengeluaran *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm font-semibold font-mono"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-gray-500">Kategori Biaya *</label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-[10px] text-rose-600 font-bold hover:underline"
              >
                {isAddingCategory ? 'Batal' : '+ Kategori Baru'}
              </button>
            </div>

            {isAddingCategory ? (
              <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Nama Kategori..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                />
                <button
                  type="button"
                  onClick={(event)=>{void handleAddCategory(event);}}
                  className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600"
                >
                  Tambah
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Nominal Biaya (Rp) *</label>
            <input
              type="number"
              min="1"
              placeholder="misal: 150000"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-gray-500 mb-1">Deskripsi Tambahan</label>
            <textarea
              rows={3}
              placeholder="Sebutkan deskripsi penggunaan dana..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> {saving?'Menyimpan...':'Simpan Pengeluaran'}
          </button>
        </form>
      </div>

      {/* Expenses History List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Riwayat Pengeluaran Operasional</h2>
            <p className="text-xs text-gray-400 mt-0.5">Menampilkan pengeluaran overhead harian yang mengurangi Laba Kotor.</p>
          </div>
          <input
            type="text"
            placeholder="Cari kategori atau keterangan..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 w-full sm:w-60"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Tanggal</th>
                <th className="py-3 px-2">Kategori Biaya</th>
                <th className="py-3 px-2">Deskripsi / Kegunaan</th>
                <th className="py-3 px-2 text-right">Nominal</th>
                <th className="py-3 px-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700 font-medium font-sans">
              {loading?(<tr><td colSpan={5} className="text-center py-8 text-gray-400">Memuat data PostgreSQL...</td></tr>):currentCosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Tidak ditemukan catatan pengeluaran biaya.
                  </td>
                </tr>
              ) : (
                currentCosts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-2 font-mono whitespace-nowrap">{Utils.formatDate(c.date)}</td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg text-[10px]">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 font-sans max-w-xs truncate">{c.description}</td>
                    <td className="py-3 px-2 text-right font-bold font-mono text-rose-600">
                      -{Utils.formatCurrency(c.amount)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-[10px] text-gray-400" title="Gunakan jurnal koreksi, jangan menghapus biaya">Terkunci</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
            <span className="text-gray-500">Menampilkan {(currentPage-1)*itemsPerPage+1}-{Math.min(currentPage*itemsPerPage, filteredCosts.length)} dari {filteredCosts.length} data</span>
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
                  className={`px-3 py-1 rounded-lg font-bold text-xs ${currentPage === idx + 1 ? 'bg-rose-500 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
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
