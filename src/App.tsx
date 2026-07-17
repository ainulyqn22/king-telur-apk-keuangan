import React, { lazy, Suspense, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Egg,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  FileText,
  TrendingUp,
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  Clock,
  Database,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAppHeaderController } from './shared/controllers/useAppHeaderController';
import { ViewErrorBoundary, ViewLoadingFallback } from './shared/components/ViewBoundary';

const DashboardView = lazy(() => import('./modules/dashboard/components/DashboardView'));
const FarmProductionView = lazy(() => import('./modules/production/components/FarmProductionView'));
const PurchasesView = lazy(() => import('./modules/purchase/components/PurchasesView'));
const SaltedProductionView = lazy(() => import('./modules/production/components/SaltedProductionView'));
const SalesView = lazy(() => import('./modules/sales/components/SalesView'));
const ExpensesView = lazy(() => import('./modules/finance/components/ExpensesView'));
const ReportsView = lazy(() => import('./modules/report/components/ReportsView'));
const AnalyticsView = lazy(() => import('./modules/report/components/AnalyticsView'));
const MasterDataView = lazy(() => import('./modules/inventory/components/MasterDataView'));
const SettingsView = lazy(() => import('./modules/setting/components/SettingsView'));

type AppView =
  | 'dashboard'
  | 'farm_production'
  | 'salted_production'
  | 'purchases'
  | 'sales'
  | 'expenses'
  | 'reports'
  | 'analytics'
  | 'master_data'
  | 'settings';

function AppContent() {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Live clock update
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Quick info metrics
  const {settings,rawStock,saltedStock}=useAppHeaderController(refreshKey);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'farm_production', label: 'Produksi Kandang Bebek', icon: Egg },
    { id: 'purchases', label: 'Pengadaan Telur Segar', icon: TrendingDown },
    { id: 'salted_production', label: 'Pemrosesan Telur Asin', icon: Layers },
    { id: 'sales', label: 'Catat Penjualan', icon: ShoppingBag },
    { id: 'expenses', label: 'Biaya Operasional', icon: DollarSign },
    { id: 'reports', label: 'Laporan Keuangan & Stok', icon: FileText },
    { id: 'analytics', label: 'Analisis Tren Penjualan', icon: TrendingUp },
    { id: 'master_data', label: 'Database Master Data', icon: Database },
    { id: 'settings', label: 'Pengaturan Profil & Backup', icon: SettingsIcon }
  ] as const;

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView onNavigate={(view) => setActiveView(view as any)} showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />
        );
      case 'farm_production':
        return (
          <FarmProductionView showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />
        );
      case 'salted_production':
        return (
          <SaltedProductionView showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />
        );
      case 'purchases':
        return (
          <PurchasesView showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />
        );
      case 'sales':
        return (
          <SalesView showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />
        );
      case 'expenses':
        return (
          <ExpensesView showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />
        );
      case 'reports':
        return (
          <ReportsView showToast={showToast} refreshKey={refreshKey} />
        );
      case 'analytics':
        return (
          <AnalyticsView refreshKey={refreshKey} />
        );
      case 'master_data':
        return (
          <MasterDataView showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />
        );
      case 'settings':
        return (
          <SettingsView showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />
        );
      default:
        return <DashboardView onNavigate={(view) => setActiveView(view as any)} showToast={showToast} onRefresh={triggerRefresh} refreshKey={refreshKey} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex text-slate-800 font-sans antialiased dark:bg-slate-950 dark:text-slate-200">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-850 shrink-0 select-none">
        {/* Brand Banner */}
        <div className="p-4 border-b border-slate-850 bg-slate-950 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white italic shadow-sm">
            H
          </div>
          <div>
            <h1 className="font-extrabold text-slate-100 tracking-tight text-sm uppercase">{settings.shopName || 'HouseERP'}</h1>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-sky-400 block mt-0.5">ERP Peternakan Bebek</span>
          </div>
        </div>

        {/* Scrollable Nav Item List */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 border-l-4 text-xs font-bold transition duration-150 group ${
                  isActive
                    ? 'bg-slate-800/50 border-indigo-600 text-indigo-400'
                    : 'border-transparent hover:bg-slate-800/30 hover:text-slate-100 text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-450' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info block */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/40 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
          <span>v1.2 Stable</span>
          <span className="flex items-center gap-1 font-mono text-sky-400 font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            SYS OK
          </span>
        </div>
      </aside>

      {/* 2. MOBILE MENU SIDEBAR (DRAWER OVERLAY) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/60 backdrop-blur-xs transition">
          <div className="w-64 bg-slate-900 text-slate-300 flex flex-col p-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs italic shadow-xs">
                  H
                </div>
                <span className="font-extrabold text-white text-sm uppercase">{settings.shopName || 'HouseERP'}</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-0.5 overflow-y-auto mb-4">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 border-l-4 text-xs font-bold transition ${
                      isActive
                        ? 'bg-slate-800/50 border-indigo-600 text-indigo-400'
                        : 'border-transparent hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-850 px-6 py-4 flex items-center justify-between shrink-0 select-none transition-colors">
          
          {/* Burger Trigger & Title Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                {navigationItems.find(n => n.id === activeView)?.label}
              </h1>
            </div>
          </div>

          {/* Quick-Glance Realtime Stocks */}
          <div className="flex items-center gap-3">
            {/* Raw Stock Indicator */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
              <span className="text-gray-500 dark:text-slate-400">Stok Segar:</span>
              <span className="font-bold text-gray-800 dark:text-slate-200 font-mono">{rawStock.qty.toLocaleString('id-ID')} btr</span>
            </div>

            {/* Salted Stock Indicator */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></div>
              <span className="text-gray-500 dark:text-slate-400">Stok Asin:</span>
              <span className="font-bold text-gray-800 dark:text-slate-200 font-mono">{saltedStock.qty.toLocaleString('id-ID')} btr</span>
            </div>

            {/* Digital Calendar Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-800 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
              <span>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>

        </header>

        {/* CENTRAL VIEW AREA */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <ViewErrorBoundary key={activeView} viewName={navigationItems.find(item => item.id === activeView)?.label ?? activeView}>
            <Suspense fallback={<ViewLoadingFallback />}>
              {renderActiveView()}
            </Suspense>
          </ViewErrorBoundary>
        </main>

      </div>

      {/* 4. FLOATING SYSTEM CUSTOM TOAST NOTIFICATION */}
      {toast && (
        <div
          id="system-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
