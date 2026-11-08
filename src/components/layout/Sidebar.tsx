import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ArrowDownRight, 
  RotateCcw, 
  AlertTriangle, 
  FileSpreadsheet, 
  Scan,
  Database
} from 'lucide-react';

export type ActiveNavTab = 'DASHBOARD' | 'PRODUCTS' | 'PURCHASES' | 'SALES' | 'RETURNS' | 'ALERTS' | 'REPORTS';

interface SidebarProps {
  currentTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
}) => {
  const navItems = [
    {
      id: 'DASHBOARD' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'PRODUCTS' as const,
      label: 'Inventory Master',
      icon: Package,
    },
    {
      id: 'SALES' as const,
      label: 'Sales Entry (POS)',
      icon: ShoppingCart,
    },
    {
      id: 'PURCHASES' as const,
      label: 'Purchase Inward',
      icon: ArrowDownRight,
    },
    {
      id: 'RETURNS' as const,
      label: 'Stock Returns',
      icon: RotateCcw,
    },
    {
      id: 'ALERTS' as const,
      label: 'Low Stock Alerts',
      icon: AlertTriangle,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'REPORTS' as const,
      label: 'Excel & Backup',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-[calc(100vh-57px)] sticky top-[57px]">
      {/* Navigation links */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-amber-500 text-slate-900' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer store quick health */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Local Storage Active</span>
          </span>
          <span className="text-emerald-700 text-[10px] uppercase font-mono">Synced</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Zero-cost offline persistence with automatic calculation engine.
        </p>
      </div>
    </aside>
  );
};
