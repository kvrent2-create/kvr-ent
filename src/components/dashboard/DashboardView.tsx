import React from 'react';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Scan, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Droplet, 
  Sparkles, 
  Wrench,
  Download
} from 'lucide-react';
import { Product, PurchaseEntry, SalesEntry, StockSummaryStats } from '../../types/stock';
import { StorageService } from '../../services/storageService';

interface DashboardViewProps {
  stats: StockSummaryStats;
  products: Product[];
  recentSales: SalesEntry[];
  recentPurchases: PurchaseEntry[];
  onNavigate: (view: string) => void;
  onOpenSaleModal: () => void;
  onOpenPurchaseModal: () => void;
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
  onReorderProduct: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  products,
  recentSales,
  recentPurchases,
  onNavigate,
  onOpenSaleModal,
  onOpenPurchaseModal,
  onOpenScanner,
  onOpenAddProduct,
  onReorderProduct,
}) => {
  // Category breakdown calculation
  const categorySummary = React.useMemo(() => {
    const cats = ['Electrical', 'Plumbing', 'Sanitary', 'Hardware'] as const;
    return cats.map(cat => {
      const items = products.filter(p => p.category === cat);
      const units = items.reduce((acc, p) => acc + p.currentStock, 0);
      const value = items.reduce((acc, p) => acc + p.currentStock * p.sellingPrice, 0);
      const lowCount = items.filter(p => p.currentStock <= p.minStockLevel).length;

      let icon = Zap;
      let colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
      if (cat === 'Plumbing') {
        icon = Droplet;
        colorClass = 'text-blue-600 bg-blue-50 border-blue-200';
      } else if (cat === 'Sanitary') {
        icon = Sparkles;
        colorClass = 'text-teal-600 bg-teal-50 border-teal-200';
      } else if (cat === 'Hardware') {
        icon = Wrench;
        colorClass = 'text-slate-700 bg-slate-100 border-slate-300';
      }

      return {
        category: cat,
        productCount: items.length,
        stockUnits: units,
        totalValue: value,
        lowStockCount: lowCount,
        icon,
        colorClass,
      };
    });
  }, [products]);

  const topLowStockItems = React.useMemo(() => {
    return products
      .filter(p => p.currentStock <= p.minStockLevel)
      .slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-semibold">
              StockMaster Enterprise Hub
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-300">Hardware, Electrical, Plumbing & Sanitary</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Store Inventory & Operations Dashboard
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time stock valuation, point of sale, automatic calculations and low-stock alerts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenScanner}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Scan className="w-4 h-4 text-amber-400" />
            <span>Barcode Scanner</span>
          </button>

          <button
            onClick={onOpenPurchaseModal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            <span>Inward Purchase</span>
          </button>

          <button
            onClick={onOpenSaleModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>POS Billing (Sale)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Stock Valuation
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              ₹{stats.totalStockValueSelling.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
              <span>Cost Basis: ₹{stats.totalStockValueCost.toLocaleString()}</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold">{stats.grossMarginEstimate}% margin</span>
            </div>
          </div>
        </div>

        {/* Total Catalog & Units */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Warehouse Stock Units
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.totalStockUnits.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">units</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across {stats.totalProducts} active product SKUs
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => onNavigate('ALERTS')}
          className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              stats.lowStockItemsCount > 0 ? 'bg-amber-50 text-amber-700 group-hover:bg-amber-100' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold font-mono tabular-nums ${stats.lowStockItemsCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {stats.lowStockItemsCount} <span className="text-xs font-sans text-slate-500 font-normal">items critical</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
              <span>{stats.outOfStockItemsCount} out of stock</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Sales & Purchases Turnover */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sales Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              ₹{stats.totalSalesAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Purchases Inward: ₹{stats.totalPurchasesAmount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 4-Domain Category Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Category Stock Breakdown</h3>
            <p className="text-xs text-slate-500">Live inventory distribution across HEPS departments</p>
          </div>
          <button
            onClick={() => onNavigate('PRODUCTS')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>View All Products</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categorySummary.map(cat => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.category}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${cat.colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-900">{cat.category}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{cat.productCount} SKUs</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
                    ₹{cat.totalValue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                    <span>{cat.stockUnits} units on shelf</span>
                    {cat.lowStockCount > 0 && (
                      <span className="text-amber-700 font-semibold">{cat.lowStockCount} low</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Grids: Low Stock Urgency & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Urgency List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-xs text-slate-900">Urgent Low Stock Items</h4>
            </div>
            <button
              onClick={() => onNavigate('ALERTS')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Reorder Center →
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-72 flex-1">
            {topLowStockItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No low stock alerts at this time.
              </div>
            ) : (
              topLowStockItems.map(item => (
                <div key={item.id} className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                  <div className="space-y-0.5 max-w-xs">
                    <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.itemCode} · Rack: {item.rackLocation}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-700 tabular-nums">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">Min: {item.minStockLevel}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onReorderProduct(item)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-xs shadow-xs transition-colors"
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales Register Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-xs text-slate-900">Recent Customer Invoices</h4>
            </div>
            <button
              onClick={() => onNavigate('SALES')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              POS & Ledger →
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-72 flex-1">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No recent sales.
              </div>
            ) : (
              recentSales.slice(0, 5).map(sale => (
                <div key={sale.id} className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900">{sale.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {sale.billNo} · {sale.items.length} items · {sale.paymentMode}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                      ₹{sale.grandTotal.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{sale.paymentStatus}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
