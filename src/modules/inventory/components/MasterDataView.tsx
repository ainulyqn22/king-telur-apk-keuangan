import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Users,
  Briefcase,
  Layers,
  MapPin,
  Phone,
  Tag,
  Search,
  CheckCircle
} from 'lucide-react';
import { StorageManager, Utils } from '../../../utils/managers';
import { Supplier, Customer, CustomerType } from '../../../types';

interface MasterDataViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
  refreshKey: number;
}

type MasterTab = 'suppliers' | 'customers' | 'categories';

export default function MasterDataView({ showToast, onRefresh, refreshKey }: MasterDataViewProps) {
  const [activeTab, setActiveTab] = useState<MasterTab>('customers');

  const suppliers = StorageManager.getData<Supplier[]>('suppliers') || [];
  const customers = StorageManager.getData<Customer[]>('customers') || [];
  const categories = StorageManager.getData<string[]>('categories') || [];

  // Form State: Supplier
  const [supName, setSupName] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supNotes, setSupNotes] = useState('');

  // Form State: Customer
  const [custName, setCustName] = useState('');
  const [custType, setCustType] = useState<CustomerType>('Reseller');
  const [custAddress, setCustAddress] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // Form State: Cost Category
  const [catName, setCatName] = useState('');

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      showToast('Nama supplier wajib diisi!', 'error');
      return;
    }

    try {
      const list = StorageManager.getData<Supplier[]>('suppliers') || [];
      const newSup: Supplier = {
        id: 'sup-' + Utils.generateId(),
        name: supName.trim(),
        address: supAddress.trim(),
        phone: supPhone.trim(),
        notes: supNotes.trim()
      };

      list.push(newSup);
      StorageManager.setData('suppliers', list);
      StorageManager.logActivity('SUPPLIER_ADD', `Menambahkan supplier baru: ${newSup.name}`);
      showToast('Supplier baru berhasil ditambahkan!', 'success');

      // Reset
      setSupName('');
      setSupAddress('');
      setSupPhone('');
      setSupNotes('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan supplier', 'error');
    }
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
      try {
        let list = StorageManager.getData<Supplier[]>('suppliers') || [];
        const record = list.find(s => s.id === id);
        list = list.filter(s => s.id !== id);
        StorageManager.setData('suppliers', list);

        StorageManager.logActivity('SUPPLIER_DEL', `Menghapus supplier: ${record ? record.name : id}`);
        showToast('Supplier berhasil dihapus!', 'success');
        onRefresh();
      } catch (err: any) {
        showToast(err.message || 'Gagal menghapus supplier', 'error');
      }
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      showToast('Nama customer wajib diisi!', 'error');
      return;
    }

    try {
      const list = StorageManager.getData<Customer[]>('customers') || [];
      const newCust: Customer = {
        id: 'cust-' + Utils.generateId(),
        name: custName.trim(),
        type: custType,
        address: custAddress.trim(),
        phone: custPhone.trim(),
        notes: custNotes.trim()
      };

      list.push(newCust);
      StorageManager.setData('customers', list);
      StorageManager.logActivity('CUSTOMER_ADD', `Menambahkan customer baru: ${newCust.name} (${newCust.type})`);
      showToast('Pelanggan baru berhasil ditambahkan!', 'success');

      // Reset
      setCustName('');
      setCustAddress('');
      setCustPhone('');
      setCustNotes('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan customer', 'error');
    }
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus customer ini?')) {
      try {
        let list = StorageManager.getData<Customer[]>('customers') || [];
        const record = list.find(c => c.id === id);
        list = list.filter(c => c.id !== id);
        StorageManager.setData('customers', list);

        StorageManager.logActivity('CUSTOMER_DEL', `Menghapus customer: ${record ? record.name : id}`);
        showToast('Pelanggan berhasil dihapus!', 'success');
        onRefresh();
      } catch (err: any) {
        showToast(err.message || 'Gagal menghapus customer', 'error');
      }
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Nama kategori tidak boleh kosong!', 'error');
      return;
    }

    const trimmed = catName.trim();
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      showToast('Kategori ini sudah ada!', 'error');
      return;
    }

    try {
      const updated = [...categories, trimmed];
      StorageManager.setData('categories', updated);
      StorageManager.logActivity('CATEGORY_ADD', `Menambahkan kategori biaya baru: ${trimmed}`);
      showToast('Kategori biaya berhasil ditambahkan!', 'success');
      setCatName('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambah kategori', 'error');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori biaya "${cat}"?`)) {
      try {
        let list = StorageManager.getData<string[]>('categories') || [];
        list = list.filter(c => c !== cat);
        StorageManager.setData('categories', list);

        StorageManager.logActivity('CATEGORY_DEL', `Menghapus kategori biaya: ${cat}`);
        showToast('Kategori biaya berhasil dihapus!', 'success');
        onRefresh();
      } catch (err: any) {
        showToast(err.message || 'Gagal menghapus kategori', 'error');
      }
    }
  };

  return (
    <div key={refreshKey} className="space-y-6">
      {/* Tab Switcher Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Manajemen Master Data</h1>
          <p className="text-xs text-gray-500 mt-0.5">Kelola database entitas eksternal: pelanggan, pemasok bahan, dan akun biaya.</p>
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
          {(['customers', 'suppliers', 'categories'] as MasterTab[]).map(t => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); setSearchTerm(''); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeTab === t ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-slate-100'}`}
            >
              {t === 'customers' && <Users className="w-3.5 h-3.5" />}
              {t === 'suppliers' && <Briefcase className="w-3.5 h-3.5" />}
              {t === 'categories' && <Layers className="w-3.5 h-3.5" />}
              {t === 'customers' && 'Customer'}
              {t === 'suppliers' && 'Supplier'}
              {t === 'categories' && 'Kategori Biaya'}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW PANEL SPLITTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Column */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs h-fit space-y-4">
          
          {/* A. CUSTOMER FORM */}
          {activeTab === 'customers' && (
            <>
              <div className="pb-3 border-b border-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Daftarkan Customer</h3>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-4 text-xs font-medium text-gray-700">
                <div>
                  <label className="block text-gray-500 mb-1">Nama Customer *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap / Toko..."
                    value={custName}
                    onChange={e => setCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Jenis Pelanggan *</label>
                  <select
                    value={custType}
                    onChange={e => setCustType(e.target.value as CustomerType)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Tengkulak">Tengkulak (Beli besar curah)</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Reseller">Reseller</option>
                    <option value="Retail">Retail</option>
                    <option value="Customer Langsung">Customer Langsung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="misal: 0812xxxxxxxx"
                    value={custPhone}
                    onChange={e => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    placeholder="Alamat domisili..."
                    value={custAddress}
                    onChange={e => setCustAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Catatan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan kebiasaan transaksi..."
                    value={custNotes}
                    onChange={e => setCustNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-sm text-sm">
                  <Plus className="w-4 h-4" /> Simpan Customer
                </button>
              </form>
            </>
          )}

          {/* B. SUPPLIER FORM */}
          {activeTab === 'suppliers' && (
            <>
              <div className="pb-3 border-b border-gray-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-600" />
                <h3 className="text-base font-bold text-gray-900">Daftarkan Supplier</h3>
              </div>
              <form onSubmit={handleAddSupplier} className="space-y-4 text-xs font-medium text-gray-700">
                <div>
                  <label className="block text-gray-500 mb-1">Nama Supplier *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Perusahaan / Agen..."
                    value={supName}
                    onChange={e => setSupName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Nomor Kontak (HP)</label>
                  <input
                    type="text"
                    placeholder="misal: 0857xxxxxxxx"
                    value={supPhone}
                    onChange={e => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Alamat Supplier</label>
                  <input
                    type="text"
                    placeholder="Alamat gudang supplier..."
                    value={supAddress}
                    onChange={e => setSupAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Keterangan Produk</label>
                  <textarea
                    rows={2}
                    placeholder="Bahan yang ditawarkan (telur segar, abu, garam, dll)..."
                    value={supNotes}
                    onChange={e => setSupNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition flex items-center justify-center gap-1.5 shadow-sm text-sm">
                  <Plus className="w-4 h-4" /> Simpan Supplier
                </button>
              </form>
            </>
          )}

          {/* C. COST CATEGORY FORM */}
          {activeTab === 'categories' && (
            <>
              <div className="pb-3 border-b border-gray-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">Kategori Biaya Operasional</h3>
              </div>
              <form onSubmit={handleAddCategory} className="space-y-4 text-xs font-medium text-gray-700">
                <div>
                  <label className="block text-gray-500 mb-1">Nama Akun Kategori Biaya *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Kemasan Kotak Kardus..."
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition flex items-center justify-center gap-1.5 shadow-sm text-sm">
                  <Plus className="w-4 h-4" /> Tambah Kategori Biaya
                </button>
              </form>
            </>
          )}

        </div>

        {/* List Data Column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">
              Daftar Database {activeTab.toUpperCase()}
            </h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3.5 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* A. DISPLAY CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-2">Nama Pelanggan</th>
                    <th className="py-2.5 px-2">Klasifikasi</th>
                    <th className="py-2.5 px-2"><Phone className="w-3.5 h-3.5 inline mr-1" /> WhatsApp</th>
                    <th className="py-2.5 px-2"><MapPin className="w-3.5 h-3.5 inline mr-1" /> Alamat</th>
                    <th className="py-2.5 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-400">Tidak ada data customer terdaftar.</td></tr>
                  ) : (
                    customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-2 font-bold text-gray-900">{c.name}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px] uppercase">
                            {c.type}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono">{c.phone || '-'}</td>
                        <td className="py-3 px-2 text-gray-500 truncate max-w-[150px]">{c.address || '-'}</td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => handleDeleteCustomer(c.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* B. DISPLAY SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-2">Nama Supplier</th>
                    <th className="py-2.5 px-2"><Phone className="w-3.5 h-3.5 inline mr-1" /> Kontak HP</th>
                    <th className="py-2.5 px-2"><MapPin className="w-3.5 h-3.5 inline mr-1" /> Alamat Domisili</th>
                    <th className="py-2.5 px-2">Keterangan Produk</th>
                    <th className="py-2.5 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-400">Tidak ada data supplier terdaftar.</td></tr>
                  ) : (
                    suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-2 font-bold text-gray-900">{s.name}</td>
                        <td className="py-3 px-2 font-mono">{s.phone || '-'}</td>
                        <td className="py-3 px-2 text-gray-500 truncate max-w-[150px]">{s.address || '-'}</td>
                        <td className="py-3 px-2 text-gray-400 text-[11px] italic">{s.notes || '-'}</td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => handleDeleteSupplier(s.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* C. DISPLAY CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Nama Akun Kategori Biaya</th>
                    <th className="py-2.5 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {categories.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <tr><td colSpan={2} className="text-center py-6 text-gray-400">Tidak ada kategori terdaftar.</td></tr>
                  ) : (
                    categories.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())).map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="font-bold text-gray-800">{cat}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
