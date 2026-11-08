import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  ShoppingCart, 
  Download, 
  MapPin, 
  ArrowRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { Product } from '../../types/stock';
import { StorageService } from '../../services/storageService';

interface LowStockAlertsViewProps {
  products: Product[];
  onReorderProduct: (product: Product) => void;
}

export const LowStockAlertsView: React.FC<LowStockAlertsViewProps> = ({
  products,
  onReorderProduct,
}) => {
  const lowStockItems = useMemo(() => {
    return products
      .filter(p => p.currentStock <= p.minStockLevel)
      .sort((a, b) => {
        // Out of stock first, then by deficit ratio
        const deficitA = a.minStockLevel - a.currentStock;
        const deficitB = b.minStockLevel - b.currentStock;
        return deficitB - deficitA;
      });
  }, [products]);

  const totalReorderEstCost = useMemo(() => {
    return lowStockItems.reduce((acc, p) => {
      const suggestedQty = Math.max(1, p.minStockLevel * 2 - p.currentStock);
      return acc + suggestedQty * p.costPrice;
    }, 0);
  }, [lowStockItems]);

  const outOfStockCount = lowStockItems.filter(p => p.currentStock <= 0).length;

  const handleExportLowStock = () => {
    StorageService.exportToExcel('low-stock');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Alert & Action */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Low Stock & Reorder Intelligence
              </h3>
              <p className="text-xs text-slate-500">
                {lowStockItems.length} products require restocking from distributors
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLowStock}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download Reorder Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Reordering */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Items to Reorder
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            {lowStockItems.length} <span className="text-xs font-sans text-slate-500 font-normal">items below min limit</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {outOfStockCount > 0 ? `⚠️ ${outOfStockCount} items completely OUT OF STOCK` : 'All items have partial units'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Estimated Reorder Capital
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            ₹{totalReorderEstCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Based on target 2x buffer above threshold
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick 1-Click Action
          </div>
          <div className="text-sm font-semibold text-slate-800 mt-1">
            Distributor Purchase PO
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Click "Reorder" on any line below to launch Purchase Inward with pre-calculated quantity.
          </p>
        </div>
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">Rack & Brand</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">Min Threshold</th>
                <th className="py-3 px-3 text-right">Deficit</th>
                <th className="py-3 px-3 text-right">Suggested Qty</th>
                <th className="py-3 px-3 text-right">Est Cost (₹)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <PackageCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">All Stock Levels are Healthy!</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No products are currently at or below their minimum reorder thresholds.
                    </p>
                  </td>
                </tr>
              ) : (
                lowStockItems.map(prod => {
                  const isOutOfStock = prod.currentStock <= 0;
                  const suggestedQty = Math.max(1, prod.minStockLevel * 2 - prod.currentStock);
                  const estCost = suggestedQty * prod.costPrice;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{prod.itemCode}</span>
                          <span>·</span>
                          <span>{prod.barcode}</span>
                          <span>·</span>
                          <span className="font-sans text-slate-700">{prod.category}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{prod.brand}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{prod.rackLocation}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className={`font-bold text-sm ${isOutOfStock ? 'text-rose-600' : 'text-amber-700'}`}>
                          {prod.currentStock}
                        </span>{' '}
                        <span className="text-[11px] text-slate-500">{prod.unit}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {prod.minStockLevel} {prod.unit}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600 font-semibold">
                        -{Math.max(0, prod.minStockLevel - prod.currentStock)} {prod.unit}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 bg-amber-50/40">
                        +{suggestedQty} {prod.unit}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        ₹{estCost.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onReorderProduct(prod)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold text-xs flex items-center gap-1 ml-auto transition-colors shadow-xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
