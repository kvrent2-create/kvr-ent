import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Database, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { StockAuditLog } from '../../types/stock';

interface ExcelExportViewProps {
  auditLogs: StockAuditLog[];
}

export const ExcelExportView: React.FC<ExcelExportViewProps> = ({ auditLogs }) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleExport = (type: 'all' | 'products' | 'low-stock' | 'sales' | 'purchases' | 'returns') => {
    try {
      StorageService.exportToExcel(type);
      setSuccessMsg(`Excel workbook for "${type.toUpperCase()}" exported successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg('Failed to generate Excel file.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleBackupDownload = () => {
    const jsonStr = StorageService.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StockMaster_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Local database JSON backup created and downloaded.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        const res = StorageService.restoreDatabaseJson(content);
        if (res.success) {
          setSuccessMsg(res.message);
        } else {
          setErrorMsg(res.message);
        }
        setTimeout(() => {
          setSuccessMsg(null);
          setErrorMsg(null);
        }, 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    StorageService.resetToDefaults();
    setIsResetConfirmOpen(false);
    setSuccessMsg('Database reset to clean sample inventory dataset.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const exportCards = [
    {
      id: 'all' as const,
      title: 'Consolidated Complete Master Workbook',
      desc: 'All 5 sheets (Inventory, Low Stock, Sales, Purchases, Returns) combined in one multi-tab Excel file.',
      badge: 'Recommended',
    },
    {
      id: 'products' as const,
      title: 'Inventory Master Sheet',
      desc: 'Complete catalog: Item codes, barcodes, categories, cost & selling prices, rack locations, and current stock valuation.',
    },
    {
      id: 'low-stock' as const,
      title: 'Low Stock & Reorder PO Sheet',
      desc: 'Items below minimum thresholds with suggested reorder quantities and cost forecasts for distributors.',
    },
    {
      id: 'sales' as const,
      title: 'Sales Register / Invoices',
      desc: 'Full tax invoice ledger with customer names, payment modes (UPI/Cash/Card), item counts, and totals.',
    },
    {
      id: 'purchases' as const,
      title: 'Purchase Inward Register',
      desc: 'Supplier inward invoices, supplier contact details, line items, and purchase totals.',
    },
    {
      id: 'returns' as const,
      title: 'Customer & Supplier Returns Log',
      desc: 'Credit notes, debit notes, defect reports, and restocked item quantities.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Excel Export Center */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Excel (.xlsx) Export Center</h3>
            <p className="text-xs text-slate-500">
              Generate native Microsoft Excel workbooks for accounting, tax auditing, and distributor reordering
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {exportCards.map(card => (
            <div
              key={card.id}
              className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl flex flex-col justify-between transition-colors group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{card.title}</span>
                  {card.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{card.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => handleExport(card.id)}
                className="mt-4 w-full py-2 bg-white hover:bg-emerald-600 hover:text-white border border-slate-300 hover:border-emerald-600 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .xlsx</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Database Backup & Local Storage Management */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Persistent Local Storage & Backup</h3>
            <p className="text-xs text-slate-500">
              All inventory, sales, and purchase records persist securely in your browser without paid cloud fees
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          {/* Download JSON Backup */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Save Full JSON Backup</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Download a complete snapshot of all products, sales invoices, purchases, returns, and audit trails.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackupDownload}
              className="py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Restore from JSON File</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload a previously saved StockMaster JSON backup to restore your catalog on any computer.
              </p>
            </div>
            <label className="py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Select File to Restore</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset to Clean Defaults */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                <span>Reset to Sample Data</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Reload the 26 preloaded Hardware, Electrical, Plumbing, and Sanitary products and transactions.
              </p>
            </div>
            {isResetConfirmOpen ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-xs"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-medium text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="py-2 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Inventory</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Stock Audit Trail / Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h4 className="font-bold text-sm text-slate-900">Automatic Stock Calculation Audit Trail</h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {auditLogs.length} verified stock movement events
          </span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Product & Item Code</th>
                <th className="py-2.5 px-4">Reference No</th>
                <th className="py-2.5 px-4 text-right">Qty Change</th>
                <th className="py-2.5 px-4 text-right">New Balance</th>
                <th className="py-2.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 50).map(log => {
                const isPositive = log.qtyChange > 0;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-4 text-slate-500 font-mono text-[11px]">
                      {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : ''}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.type === 'PURCHASE'
                          ? 'bg-emerald-50 text-emerald-800'
                          : log.type === 'SALE'
                          ? 'bg-blue-50 text-blue-800'
                          : log.type === 'CUSTOMER_RETURN'
                          ? 'bg-purple-50 text-purple-800'
                          : log.type === 'SUPPLIER_RETURN'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className="font-semibold text-slate-800">{log.productName}</span>
                      <span className="font-mono text-[10px] text-slate-500 ml-1.5">[{log.itemCode}]</span>
                    </td>
                    <td className="py-2 px-4 font-mono font-medium text-slate-700">
                      {log.referenceNo}
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold tabular-nums">
                      <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                        {isPositive ? `+${log.qtyChange}` : log.qtyChange}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {log.newBalance}
                    </td>
                    <td className="py-2 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {log.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
