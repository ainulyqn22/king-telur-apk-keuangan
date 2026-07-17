import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  Info,
  ShieldAlert,
  Save,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { StorageManager, Utils, ExportManager } from '../../../utils/managers';
import { Settings as AppSettings } from '../../../types';

interface SettingsViewProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
  refreshKey: number;
}

export default function SettingsView({ showToast, onRefresh, refreshKey }: SettingsViewProps) {
  const currentSettings = StorageManager.getData<AppSettings>('settings') || {
    shopName: 'HouseERP Duck Farm',
    logo: '',
    currency: 'Rp',
    defaultTransferPrice: 2000
  };

  const [shopName, setShopName] = useState(currentSettings.shopName);
  const [currency, setCurrency] = useState(currentSettings.currency);
  const [defaultTransferPrice, setDefaultTransferPrice] = useState(currentSettings.defaultTransferPrice);
  const [backupJson, setBackupJson] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      showToast('Nama usaha tidak boleh kosong!', 'error');
      return;
    }

    try {
      const updated: AppSettings = {
        shopName: shopName.trim(),
        logo: '',
        currency,
        defaultTransferPrice: Number(defaultTransferPrice) || 2000
      };

      StorageManager.setData('settings', updated);
      StorageManager.logActivity('SETTINGS_UPDATE', `Mengupdate konfigurasi profil usaha: ${updated.shopName}`);
      showToast('Konfigurasi pengaturan berhasil disimpan!', 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan', 'error');
    }
  };

  const handleDownloadBackup = () => {
    try {
      const backupStr = StorageManager.backupData();
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `house_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      StorageManager.logActivity('DATABASE_BACKUP', 'Mendownload salinan database cadangan (.json).');
      showToast('Database berhasil diekspor & diunduh!', 'success');
    } catch {
      showToast('Gagal membuat backup berkas JSON', 'error');
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const success = StorageManager.restoreData(text);
          if (success) {
            showToast('Database berhasil direstore dari file cadangan!', 'success');
            onRefresh();
          } else {
            showToast('Format berkas backup tidak cocok atau tidak valid!', 'error');
          }
        } catch {
          showToast('Gagal membaca berkas JSON. Format rusak!', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetSystem = () => {
    if (confirm('PERINGATAN KRITIS: Tindakan ini akan menghapus SELURUH data transaksi, stok, pelanggan, dan pengaturan secara permanen. Pastikan Anda telah mengunduh backup sebelum melanjutkan!')) {
      if (confirm('Apakah Anda benar-benar yakin ingin mengosongkan seluruh HouseERP?')) {
        StorageManager.resetSystem();
        showToast('Seluruh database HouseERP dikosongkan!', 'success');
        onRefresh();
        // Redirect to homepage
        window.location.reload();
      }
    }
  };

  return (
    <div key={refreshKey} className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
      {/* LEFT COLUMN: Shop Settings & Change Password */}
      <div className="space-y-6">
        {/* 1. Shop Settings Profile */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Settings className="text-gray-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">Pengaturan Profil Usaha</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-medium text-gray-700">
            <div>
              <label className="block text-gray-500 mb-1">Nama Usaha / Peternakan *</label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Mata Uang</label>
                <input
                  type="text"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Harga Transfer Default (Rp) *</label>
                <input
                  type="number"
                  min="100"
                  value={defaultTransferPrice}
                  onChange={e => setDefaultTransferPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] text-gray-500 leading-relaxed space-y-1.5">
              <div className="flex items-start gap-1 text-slate-800 font-bold">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
                <span>Mengapa Harga Transfer itu penting?</span>
              </div>
              <p>
                Unit Peternakan (Hulu) memproduksi telur bebek harian. Ketika telur tersebut dipindahkan untuk pengerjaan telur asin (Hilir), pemindahan ini dicatat sebagai <strong>Transfer Internal</strong> senilai Harga Transfer Pasar.
              </p>
              <p>
                Hal ini memastikan Unit Peternakan memperoleh keuntungan biologis internal, sedangkan Unit Produksi Telur Asin membebankan telur segar sebagai biaya bahan baku awal secara adil dan akurat.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-1.5 shadow-sm text-sm"
            >
              <Save className="w-4 h-4" /> Simpan Pengaturan Profil
            </button>
          </form>
        </div>
      </div>

      {/* 2. Database Backup, Restore, and Reset */}
      <div className="space-y-6">
        
        {/* Backup & Restore Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <RefreshCw className="text-indigo-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">Salinan Database (Cadangan)</h2>
          </div>

          <div className="space-y-4 text-xs font-medium text-gray-700">
            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2.5">
              <Info className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
              <p className="leading-relaxed text-indigo-900">
                Aplikasi ERP HouseERP beroperasi sepenuhnya di dalam browser Anda menggunakan penyimpanan <strong>localStorage</strong>.
                Untuk mengamankan data Anda agar terhindar dari pembersihan cache browser otomatis, buatlah salinan database berkala ke dalam berkas JSON komputer Anda.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Backup Trigger */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <p className="font-bold text-slate-800 text-xs">Ekspor Backup Data</p>
                <p className="text-[10px] text-gray-400">Unduh seluruh berkas transaksi, stok, dan master data.</p>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Ekspor ke JSON
                </button>
              </div>

              {/* Restore Trigger */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <p className="font-bold text-slate-800 text-xs">Impor Restore Data</p>
                <p className="text-[10px] text-gray-400">Unggah berkas JSON cadangan yang telah diekspor sebelumnya.</p>
                <label className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Impor Berkas
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Audit CSV Export Trigger */}
            <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 space-y-2">
              <p className="font-bold text-orange-950 text-xs">Ekspor Jurnal Transaksi untuk Audit (CSV)</p>
              <p className="text-[10px] text-orange-700 leading-relaxed">
                Ekspor seluruh data mutasi bahan baku hulu, produksi batch telur asin, pengadaan supplier, penjualan, dan seluruh biaya pengeluaran operasional ke dalam satu file lembar sebar (CSV) lengkap untuk keperluan auditing, rekapitulasi pembukuan, atau perpajakan.
              </p>
              <button
                type="button"
                onClick={() => {
                  try {
                    ExportManager.exportAllTransactionsToCSV();
                    showToast('Seluruh jurnal audit transaksi berhasil diekspor ke CSV!', 'success');
                  } catch (err: any) {
                    showToast(err.message || 'Gagal mengekspor data audit CSV', 'error');
                  }
                }}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" /> Ekspor Jurnal Audit Lengkap (.csv)
              </button>
            </div>
          </div>
        </div>

        {/* Safety Reset Area */}
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-rose-200">
            <ShieldAlert className="text-rose-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-rose-950">Zona Bahaya (Sistem Reset)</h2>
          </div>

          <div className="space-y-3.5 text-xs font-medium text-rose-900">
            <p className="leading-relaxed">
              Tindakan di bawah ini bersifat merusak dan **tidak dapat dibatalkan**. Melakukan reset sistem akan menghapus seluruh data produksi kandang, pembelian, batch telur asin, invoice penjualan, pengeluaran, daftar pelanggan, pemasok, dan semua histori mutasi persediaan.
            </p>
            <button
              type="button"
              onClick={handleResetSystem}
              className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 border border-rose-700"
            >
              Reset Total Sistem ERP
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
