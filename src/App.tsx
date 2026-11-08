import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { Product, PurchaseEntry, SalesEntry, StockReturnEntry, StockAuditLog, StockSummaryStats } from './types/stock';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveNavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductListView } from './components/products/ProductListView';
import { PurchaseEntryView } from './components/purchases/PurchaseEntryView';
import { SalesEntryView } from './components/sales/SalesEntryView';
import { ReturnsView } from './components/returns/ReturnsView';
import { LowStockAlertsView } from './components/alerts/LowStockAlertsView';
import { ExcelExportView } from './components/reports/ExcelExportView';
import { BarcodeScannerModal } from './components/barcode/BarcodeScannerModal';
import { ProductFormModal } from './components/products/ProductFormModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('DASHBOARD');

  // Core Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [returns, setReturns] = useState<StockReturnEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<StockAuditLog[]>([]);
  const [stats, setStats] = useState<StockSummaryStats>({
    totalProducts: 0,
    totalStockUnits: 0,
    totalStockValueCost: 0,
    totalStockValueSelling: 0,
    lowStockItemsCount: 0,
    outOfStockItemsCount: 0,
    totalPurchasesAmount: 0,
    totalSalesAmount: 0,
    totalReturnsAmount: 0,
    grossMarginEstimate: 0,
  });

  // Modals & Cross-component Actions
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [preselectedProductForSale, setPreselectedProductForSale] = useState<Product | null>(null);
  const [preselectedProductForPurchase, setPreselectedProductForPurchase] = useState<Product | null>(null);

  // Sync state from StorageService
  const loadData = () => {
    setProducts(StorageService.getProducts());
    setPurchases(StorageService.getPurchases());
    setSales(StorageService.getSales());
    setReturns(StorageService.getReturns());
    setAuditLogs(StorageService.getAuditLogs());
    setStats(StorageService.getSummaryStats());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = StorageService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Global F2 shortcut for instant barcode scanning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsScannerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Workflow triggers
  const handleLaunchSaleWithProduct = (product: Product) => {
    setPreselectedProductForSale(product);
    setCurrentTab('SALES');
  };

  const handleLaunchPurchaseWithProduct = (product: Product) => {
    setPreselectedProductForPurchase(product);
    setCurrentTab('PURCHASES');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      {/* Top Bar */}
      <Navbar
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        onOpenQuickSale={() => {
          setPreselectedProductForSale(null);
          setCurrentTab('SALES');
        }}
        lowStockCount={stats.lowStockItemsCount}
        onNavigateAlerts={() => setCurrentTab('ALERTS')}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            if (tab !== 'SALES') setPreselectedProductForSale(null);
            if (tab !== 'PURCHASES') setPreselectedProductForPurchase(null);
            setCurrentTab(tab);
          }}
          lowStockCount={stats.lowStockItemsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentTab === 'DASHBOARD' && (
            <DashboardView
              stats={stats}
              products={products}
              recentSales={sales}
              recentPurchases={purchases}
              onNavigate={tab => setCurrentTab(tab as ActiveNavTab)}
              onOpenSaleModal={() => {
                setPreselectedProductForSale(null);
                setCurrentTab('SALES');
              }}
              onOpenPurchaseModal={() => {
                setPreselectedProductForPurchase(null);
                setCurrentTab('PURCHASES');
              }}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onReorderProduct={handleLaunchPurchaseWithProduct}
            />
          )}

          {currentTab === 'PRODUCTS' && (
            <ProductListView
              products={products}
              onOpenSaleWithProduct={handleLaunchSaleWithProduct}
              onOpenPurchaseWithProduct={handleLaunchPurchaseWithProduct}
            />
          )}

          {currentTab === 'SALES' && (
            <SalesEntryView
              products={products}
              sales={sales}
              preselectedProduct={preselectedProductForSale}
            />
          )}

          {currentTab === 'PURCHASES' && (
            <PurchaseEntryView
              products={products}
              purchases={purchases}
              preselectedProduct={preselectedProductForPurchase}
            />
          )}

          {currentTab === 'RETURNS' && (
            <ReturnsView
              products={products}
              returns={returns}
            />
          )}

          {currentTab === 'ALERTS' && (
            <LowStockAlertsView
              products={products}
              onReorderProduct={handleLaunchPurchaseWithProduct}
            />
          )}

          {currentTab === 'REPORTS' && (
            <ExcelExportView
              auditLogs={auditLogs}
            />
          )}
        </main>
      </div>

      {/* Global Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProductForSale={handleLaunchSaleWithProduct}
        onSelectProductForPurchase={handleLaunchPurchaseWithProduct}
      />

      {/* Global Add Product Modal */}
      <ProductFormModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
