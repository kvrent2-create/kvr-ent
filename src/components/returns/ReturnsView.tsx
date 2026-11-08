import React, { useState } from 'react';
import { 
  RotateCcw, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  User, 
  Trash2, 
  Download, 
  FileCheck
} from 'lucide-react';
import { Product, StockReturnEntry, ReturnItem, ReturnType } from '../../types/stock';
import { StorageService } from '../../services/storageService';
import { playSuccessChime } from '../../utils/audio';

interface ReturnsViewProps {
  products: Product[];
  returns: StockReturnEntry[];
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({ products, returns }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [returnType, setReturnType] = useState<ReturnType>('CUSTOMER_RETURN');

  // Form Fields
  const [partyName, setPartyName] = useState('Kailash Electricals');
  const [originalRef, setOriginalRef] = useState('INV-2026-1089');
  const [returnNo, setReturnNo] = useState(`CR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [actionTaken, setActionTaken] = useState<'Refund Paid' | 'Store Credit' | 'Supplier Debit Note' | 'Replacement Issued'>('Store Credit');
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState<ReturnItem[]>([
    {
      productId: products[0]?.id || '',
      itemCode: products[0]?.itemCode || '',
      productName: products[0]?.name || '',
      unit: products[0]?.unit || 'Pcs',
      quantity: 2,
      unitPrice: products[0]?.sellingPrice || 100,
      totalAmount: (products[0]?.sellingPrice || 100) * 2,
      reason: 'Excess Stock',
      condition: 'Good (Restockable)',
    },
  ]);

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleTypeChange = (newType: ReturnType) => {
    setReturnType(newType);
    const prefix = newType === 'CUSTOMER_RETURN' ? 'CR' : 'SR';
    setReturnNo(`${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    if (newType === 'CUSTOMER_RETURN') {
      setPartyName('Kailash Contractor');
      setActionTaken('Store Credit');
      setOriginalRef('INV-2026-1089');
    } else {
      setPartyName('National Electrical Distributors Ltd');
      setActionTaken('Supplier Debit Note');
      setOriginalRef('PUR-2026-0042');
    }
  };

  const handleAddItem = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const price = returnType === 'CUSTOMER_RETURN' ? prod.sellingPrice : prod.costPrice;
    const qty = 1;
    const newItem: ReturnItem = {
      productId: prod.id,
      itemCode: prod.itemCode,
      productName: prod.name,
      unit: prod.unit,
      quantity: qty,
      unitPrice: price,
      totalAmount: price * qty,
      reason: returnType === 'CUSTOMER_RETURN' ? 'Excess Stock' : 'Defective/Damaged',
      condition: returnType === 'CUSTOMER_RETURN' ? 'Good (Restockable)' : 'Damaged (Scrap/RTV)',
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof ReturnItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalAmount = (parseFloat(item.quantity as any) || 0) * (parseFloat(item.unitPrice as any) || 0);
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((acc, it) => acc + it.totalAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item to return.');
      return;
    }
    if (!partyName.trim()) {
      alert('Party name is required.');
      return;
    }

    StorageService.addReturn({
      returnNo: returnNo.trim(),
      type: returnType,
      partyName: partyName.trim(),
      originalInvoiceOrBillRef: originalRef.trim(),
      date: new Date().toISOString(),
      items,
      grandTotal,
      actionTaken,
      notes: notes.trim(),
    });

    playSuccessChime();
    setSuccessBanner(
      `${returnType === 'CUSTOMER_RETURN' ? 'Customer Return' : 'Supplier Return'} (${returnNo}) processed. Stock updated automatically.`
    );
    setTimeout(() => setSuccessBanner(null), 5000);

    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {!isCreating ? (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Customer & Supplier Returns</h3>
              <p className="text-xs text-slate-500">
                Manage contractor excess returns and vendor damage returns with automatic stock adjustments
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => StorageService.exportToExcel('returns')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export Returns</span>
              </button>

              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Process Return</span>
              </button>
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Return No & Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer / Supplier</th>
                    <th className="py-3 px-4">Original Ref</th>
                    <th className="py-3 px-4">Items & Reason</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                    <th className="py-3 px-4 text-center">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        No returns processed yet.
                      </td>
                    </tr>
                  ) : (
                    returns.map(ret => (
                      <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">{ret.returnNo}</div>
                          <div className="text-[11px] text-slate-500">
                            {ret.date ? ret.date.split('T')[0] : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            ret.type === 'CUSTOMER_RETURN'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {ret.type === 'CUSTOMER_RETURN' ? 'Customer Return' : 'Supplier Return'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {ret.partyName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {ret.originalInvoiceOrBillRef || '—'}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {ret.items.map((it, i) => (
                            <div key={i} className="text-[11px]">
                              <span className="font-medium text-slate-800">{it.productName}</span>
                              <span className="text-slate-400 mx-1">·</span>
                              <span className="text-slate-600">Qty: {it.quantity}</span>
                              <span className="text-slate-400 mx-1">·</span>
                              <span className="text-slate-500 italic">({it.reason})</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ₹{ret.grandTotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                            {ret.actionTaken}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Create Return Wizard */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 hover:bg-slate-800 rounded-md transition-colors text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="font-bold text-base">Process Stock Return</h3>
                <p className="text-xs text-slate-300">
                  Customer returns restock inventory; Supplier returns debit damaged items
                </p>
              </div>
            </div>
            <div className="font-mono text-xs bg-slate-800 px-3 py-1 rounded text-amber-300 border border-slate-700">
              {returnNo}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
            {/* Return Type Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="block font-bold text-slate-800">Return Classification</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange('CUSTOMER_RETURN')}
                  className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    returnType === 'CUSTOMER_RETURN'
                      ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw className={`w-5 h-5 shrink-0 mt-0.5 ${returnType === 'CUSTOMER_RETURN' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-slate-900">Customer / Contractor Return</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Customer returns leftover or defective goods. If restockable, stock balance is increased back.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('SUPPLIER_RETURN')}
                  className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    returnType === 'SUPPLIER_RETURN'
                      ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Building2 className={`w-5 h-5 shrink-0 mt-0.5 ${returnType === 'SUPPLIER_RETURN' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-slate-900">Return to Supplier (Vendor RTV)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Returning defective or broken stock to manufacturer/distributor. Stock balance is decreased.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Details Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                  {returnType === 'CUSTOMER_RETURN' ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                  {returnType === 'CUSTOMER_RETURN' ? 'Customer / Contractor Name' : 'Supplier Name'} *
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Original Invoice / Bill Reference
                </label>
                <input
                  type="text"
                  value={originalRef}
                  onChange={e => setOriginalRef(e.target.value)}
                  placeholder="e.g. INV-2026-1089 or PUR-2026-0042"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Action / Settlement</label>
                <select
                  value={actionTaken}
                  onChange={e => setActionTaken(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium focus:outline-hidden focus:border-amber-500"
                >
                  <option value="Store Credit">Store Credit (Customer Ledger)</option>
                  <option value="Refund Paid">Cash / UPI Refund Paid</option>
                  <option value="Supplier Debit Note">Supplier Debit Note</option>
                  <option value="Replacement Issued">Replacement Issued</option>
                </select>
              </div>
            </div>

            {/* Items to Return */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Return Items</span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-hidden"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.itemCode}] {p.name} (Stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded font-semibold text-xs hover:bg-slate-800 transition-colors"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-2 w-20">Qty</th>
                      <th className="py-2.5 px-2 w-28">Rate (₹)</th>
                      <th className="py-2.5 px-2 w-36">Return Reason</th>
                      <th className="py-2.5 px-2 w-40">Condition</th>
                      <th className="py-2.5 px-3 text-right w-28">Total (₹)</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.productName}</div>
                          <div className="font-mono text-[10px] text-slate-500">{item.itemCode}</div>
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 text-xs focus:border-amber-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice}
                            onChange={e => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded font-mono text-slate-900 text-xs focus:border-amber-500 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <select
                            value={item.reason}
                            onChange={e => handleUpdateItem(idx, 'reason', e.target.value)}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-900 text-[11px] focus:outline-hidden"
                          >
                            <option value="Excess Stock">Excess Stock</option>
                            <option value="Defective/Damaged">Defective/Damaged</option>
                            <option value="Wrong Size/Spec">Wrong Size/Spec</option>
                            <option value="Quality Issue">Quality Issue</option>
                            <option value="Customer Cancelled">Customer Cancelled</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-2">
                          <select
                            value={item.condition}
                            onChange={e => handleUpdateItem(idx, 'condition', e.target.value)}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-900 text-[11px] focus:outline-hidden font-medium"
                          >
                            <option value="Good (Restockable)">Good (Restockable)</option>
                            <option value="Damaged (Scrap/RTV)">Damaged (Scrap/RTV)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ₹{item.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total and Notes */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2">
              <div className="w-full sm:max-w-md">
                <label className="block font-medium text-slate-700 mb-1">Return Notes / Reason</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional inspection remarks or credit voucher details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full sm:w-64 space-y-1 text-right">
                <div className="text-xs text-slate-500">Total Return Value</div>
                <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  ₹{grandTotal.toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-700 font-medium">
                  {returnType === 'CUSTOMER_RETURN'
                    ? 'Stock will be re-credited to inventory'
                    : 'Stock will be debited from inventory'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={items.length === 0}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-xs shadow-xs transition-colors"
              >
                Confirm Return & Adjust Stock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
