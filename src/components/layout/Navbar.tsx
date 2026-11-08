import React from 'react';
import { Scan, Plus, Search, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
  onOpenQuickSale: () => void;
  lowStockCount: number;
  onNavigateAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScanner,
  onOpenAddProduct,
  onOpenQuickSale,
  lowStockCount,
  onNavigateAlerts,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="#" className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          StockMaster Pro
        </a>
        <span className="hidden sm:inline-block text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          Hardware · Electrical · Plumbing · Sanitary
        </span>
      </div>

      {/* Zone 2: Fast Quick Affordances */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenScanner}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search barcode or item code...</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            Scan [F2]
          </span>
        </button>
      </div>

      {/* Zone 3: Primary actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {lowStockCount > 0 && (
          <button
            onClick={onNavigateAlerts}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title={`${lowStockCount} items below minimum threshold`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="tabular-nums font-mono">{lowStockCount}</span>
            <span className="hidden sm:inline">Alerts</span>
          </button>
        )}

        <button
          onClick={onOpenScanner}
          className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap border border-slate-200"
          title="Scan barcode"
        >
          <Scan className="w-4 h-4 text-slate-600" />
          <span className="hidden sm:inline">Scan Barcode</span>
        </button>

        <button
          onClick={onOpenQuickSale}
          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Sale (POS)</span>
        </button>
      </div>
    </header>
  );
};
