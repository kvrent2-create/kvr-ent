import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, ArrowLeft, Building2, Calendar, FileText, Scan, Download } from 'lucide-react';
import { Product, PurchaseEntry, PurchaseItem } from '../../types/stock';
import { StorageService } from '../../services/storageService';
import { playSuccessChime, playBarcodeBeep } from '../../utils/audio';
import { BarcodeScannerModal } from '../barcode/BarcodeScannerModal';

interface PurchaseEntryViewProps {
  products: Product[];
  purchases: PurchaseEntry[];
  preselectedProduct?: Product | null;
}

export const PurchaseEntryView: React.FC<PurchaseEntryViewProps> = ({
  products,
  purchases,
  preselectedProduct,
}) => {
  const [isCreating, setIsCreating] = useState(Boolean(preselectedProduct));
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form State
  const [supplierName, setSupplierName] = useState('Standard Hardware & Pipes Wholesale');
  const [supplierContact, setSupplierContact] = useState('');
  const [invoiceNo, setInvoiceNo] = useState(`PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Pending'>('Paid');
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState<PurchaseItem[]>(() => {
    if (preselectedProduct) {
      return [
        {
          productId: preselectedProduct.id,
          itemCode: preselectedProduct.itemCode,
          productName: preselectedProduct.name,
          unit: preselectedProduct.unit,
          quantity: Math.max(1, preselectedProduct.minStockLevel * 2 - preselectedProduct.currentStock),
          unitCost: preselectedProduct.costPrice,
          taxRate: preselectedProduct.taxRate,
          totalAmount: Math.round(
            Math.max(1, preselectedProduct.minStockLevel * 2 - preselectedProduct.currentStock) *
            preselectedProduct.costPrice *
            (1 + preselectedProduct.taxRate / 100)
          ),
        },
      ];
    }
    const first = products[0];
    if (first) {
      return [
        {
          productId: first.id,
          itemCode: first.itemCode,
          productName: first.name,
          unit: first.unit,
          quantity: 10,
          unitCost: first.costPrice,
          taxRate: first.taxRate,
          totalAmount: Math.round(10 * first.costPrice * (1 + first.taxRate / 100)),
        },
      ];
    }
    return [];
  });

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const calculateRowTotal = (qty: number, cost: number, taxRate: number) => {
    const base = qty * cost;
    const tax = (base * taxRate) / 100;
    return Math.round((base + tax) * 100) / 100;
  };

  const handleAddItem = (prodId?: string) => {
    const targetId = prodId || selectedProductId;
    const prod = products.find(p => p.id === targetId);
    if (!prod) return;

    // Check if already in list
    const existingIndex = items.findIndex(it => it.productId === prod.id);
    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 5;
      updated[existingIndex].totalAmount = calculateRowTotal(
        updated[existingIndex].quantity,
        updated[existingIndex].unitCost,
        updated[existingIndex].taxRate
      );
      setItems(updated);
      return;
    }

    const qty = 10;
    const newItem: PurchaseItem = {
      productId: prod.id,
      itemCode: prod.itemCode,
      productName: prod.name,
      unit: prod.unit,
      quantity: qty,
      unitCost: prod.costPrice,
      taxRate: prod.taxRate,
      totalAmount: calculateRowTotal(qty, prod.costPrice, prod.taxRate),
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'unitCost' | 'taxRate', val: number) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: Math.max(0, val) };
    item.totalAmount = calculateRowTotal(item.quantity, item.unitCost, item.taxRate);
    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);
  const taxTotal = items.reduce((acc, it) => acc + (it.quantity * it.unitCost * it.taxRate) / 100, 0);
  const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one line item to purchase.');
      return;
    }
    if (!supplierName.trim()) {
      alert('Supplier name is required.');
      return;
    }

    StorageService.addPurchase({
      invoiceNo: invoiceNo.trim(),
      supplierName: supplierName.trim(),
      supplierContact: supplierContact.trim(),
      date: new Date(invoiceDate).toISOString(),
      items,
      subtotal,
      taxTotal,
      grandTotal,
      paymentStatus,
      notes: notes.trim(),
    });

    playSuccessChime();
    setSuccessBanner(`Purchase ${invoiceNo} recorded successfully! Inventory stock increased.`);
    setTimeout(() => setSuccessBanner(null), 5000);

    // Reset Form
    setIsCreating(false);
    setInvoiceNo(`PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <div className="space-y-4">
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* View Toggle */}
      {!isCreating ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Purchase Inward History</h3>
              <p className="text-xs text-slate-500">
                Track supplier invoices, incoming shipments, and automated stock increases
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => StorageService.exportToExcel('purchases')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export Purchases</span>
              </button>

              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Purchase Entry</span>
              </button>
            </div>
          </div>

          {/* Purchases List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier & Contact</th>
                    <th className="py-3 px-4">Items Received</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        No purchase entries yet. Click "New Purchase Entry" to receive stock.
                      </td>
                    </tr>
                  ) : (
                    purchases.map(pur => (
                      <tr key={pur.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {pur.invoiceNo}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {pur.date ? pur.date.split('T')[0] : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{pur.supplierName}</div>
                          {pur.supplierContact && (
                            <div className="text-[11px] text-slate-500">{pur.supplierContact}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{pur.items.length} items</span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-slate-500 text-[11px]">
                            {pur.items.map(it => `${it.productName.slice(0, 20)}.. (${it.quantity})`).join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                          ₹{pur.subtotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          ₹{pur.grandTotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                            pur.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {pur.paymentStatus}
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
        /* Create New Purchase Form */
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
                <h3 className="font-bold text-base">New Purchase Inward Entry</h3>
                <p className="text-xs text-slate-300">
                  Stock will be automatically added to inventory upon saving
                </p>
              </div>
            </div>
            <div className="font-mono text-xs bg-slate-800 px-3 py-1 rounded text-amber-300 border border-slate-700">
              {invoiceNo}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
            {/* Supplier Details */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Supplier / Vendor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="e.g. National Electrical Distributors"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-medium focus:border-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Supplier Contact Phone</label>
                <input
                  type="text"
                  value={supplierContact}
                  onChange={e => setSupplierContact(e.target.value)}
                  placeholder="+91 98220 00000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Invoice / Bill No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={e => setInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono focus:border-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Inward Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Add Item Fast Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
              <div className="flex-1 w-full">
                <label className="block text-slate-700 font-semibold mb-1">
                  Select Product to Add to Inward List
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-medium text-xs focus:border-amber-500 focus:outline-hidden"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.category}] [{p.itemCode}] {p.name} (Current Stock: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-md flex items-center gap-1 text-xs"
                >
                  <Scan className="w-3.5 h-3.5 text-slate-500" />
                  <span>Scan Barcode</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md flex items-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Item Details</th>
                    <th className="py-2.5 px-3 w-28">Quantity</th>
                    <th className="py-2.5 px-3 w-28">Unit Cost (₹)</th>
                    <th className="py-2.5 px-3 w-24">Tax Rate %</th>
                    <th className="py-2.5 px-3 text-right w-32">Total (₹)</th>
                    <th className="py-2.5 px-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No items added yet. Select a product above or scan a barcode.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.productName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{item.itemCode} · Unit: {item.unit}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-semibold text-slate-900 focus:outline-hidden focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            step="any"
                            value={item.unitCost}
                            onChange={e => handleUpdateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-hidden focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={item.taxRate}
                            onChange={e => handleUpdateItem(idx, 'taxRate', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-800 focus:outline-hidden"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ₹{item.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Status</label>
                  <div className="flex gap-2">
                    {(['Paid', 'Partial', 'Pending'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPaymentStatus(st)}
                        className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                          paymentStatus === st
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Purchase Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Received via transport bill #554, inspected good condition..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Summary calculations */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax Total:</span>
                  <span className="font-mono tabular-nums font-semibold">₹{Math.round(taxTotal).toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono tabular-nums text-base text-amber-700">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-md font-bold text-xs shadow-xs transition-colors"
              >
                Save Purchase & Inward Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barcode Scanner Modal for Inward */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProductForPurchase={prod => {
          handleAddItem(prod.id);
          playBarcodeBeep();
        }}
      />
    </div>
  );
};
