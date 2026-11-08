import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Scan, 
  Printer, 
  Download, 
  User, 
  Phone, 
  CreditCard, 
  Banknote, 
  QrCode, 
  AlertCircle
} from 'lucide-react';
import { Product, SalesEntry, SaleItem } from '../../types/stock';
import { StorageService } from '../../services/storageService';
import { playSuccessChime, playBarcodeBeep, playWarningBeep } from '../../utils/audio';
import { BarcodeScannerModal } from '../barcode/BarcodeScannerModal';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

interface SalesEntryViewProps {
  products: Product[];
  sales: SalesEntry[];
  preselectedProduct?: Product | null;
}

export const SalesEntryView: React.FC<SalesEntryViewProps> = ({
  products,
  sales,
  preselectedProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORY'>(preselectedProduct ? 'POS' : 'POS');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<SalesEntry | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Billing State
  const [billNo, setBillNo] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerType, setCustomerType] = useState<'Contractor' | 'Plumber/Electrician' | 'Retail' | 'Wholesale'>('Retail');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Credit/Ledger'>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [notes, setNotes] = useState('');

  // Cart / Items
  const [items, setItems] = useState<SaleItem[]>(() => {
    if (preselectedProduct) {
      const qty = 1;
      const base = qty * preselectedProduct.sellingPrice;
      const tax = (base * preselectedProduct.taxRate) / 100;
      return [
        {
          productId: preselectedProduct.id,
          itemCode: preselectedProduct.itemCode,
          productName: preselectedProduct.name,
          unit: preselectedProduct.unit,
          quantity: qty,
          unitPrice: preselectedProduct.sellingPrice,
          discountPercent: 0,
          taxRate: preselectedProduct.taxRate,
          totalAmount: Math.round((base + tax) * 100) / 100,
        },
      ];
    }
    return [];
  });

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quickSearch, setQuickSearch] = useState('');

  const calculateRowTotal = (qty: number, price: number, discPct: number, taxRate: number) => {
    const discountedPrice = price * (1 - discPct / 100);
    const base = qty * discountedPrice;
    const tax = (base * taxRate) / 100;
    return Math.round((base + tax) * 100) / 100;
  };

  const handleAddItem = (prodId?: string) => {
    const targetId = prodId || selectedProductId;
    const prod = products.find(p => p.id === targetId);
    if (!prod) return;

    if (prod.currentStock <= 0) {
      playWarningBeep();
      const proceed = confirm(`Warning: "${prod.name}" has 0 stock recorded. Proceed with sale anyway?`);
      if (!proceed) return;
    }

    const existingIndex = items.findIndex(it => it.productId === prod.id);
    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalAmount = calculateRowTotal(
        updated[existingIndex].quantity,
        updated[existingIndex].unitPrice,
        updated[existingIndex].discountPercent,
        updated[existingIndex].taxRate
      );
      setItems(updated);
      playBarcodeBeep();
      return;
    }

    const qty = 1;
    const newItem: SaleItem = {
      productId: prod.id,
      itemCode: prod.itemCode,
      productName: prod.name,
      unit: prod.unit,
      quantity: qty,
      unitPrice: prod.sellingPrice,
      discountPercent: customerType === 'Contractor' ? 5 : 0,
      taxRate: prod.taxRate,
      totalAmount: calculateRowTotal(
        qty,
        prod.sellingPrice,
        customerType === 'Contractor' ? 5 : 0,
        prod.taxRate
      ),
    };
    setItems([...items, newItem]);
    playBarcodeBeep();
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'unitPrice' | 'discountPercent', val: number) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: Math.max(0, val) };
    item.totalAmount = calculateRowTotal(
      item.quantity,
      item.unitPrice,
      item.discountPercent,
      item.taxRate
    );
    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const discountTotal = items.reduce(
    (acc, it) => acc + (it.quantity * it.unitPrice * it.discountPercent) / 100,
    0
  );
  const taxableAmount = subtotal - discountTotal;
  const taxTotal = items.reduce((acc, it) => {
    const rowBase = it.quantity * it.unitPrice * (1 - it.discountPercent / 100);
    return acc + (rowBase * it.taxRate) / 100;
  }, 0);
  const grandTotal = Math.round((taxableAmount + taxTotal) * 100) / 100;

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Cart is empty. Please add products to complete sale.');
      return;
    }

    const newSale = StorageService.addSale({
      billNo: billNo.trim(),
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      customerType,
      date: new Date().toISOString(),
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal,
      paymentMode,
      paymentStatus,
      notes: notes.trim(),
    });

    playSuccessChime();
    setReceiptSale(newSale);
    setIsReceiptOpen(true);

    // Reset POS for next sale
    setBillNo(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setItems([]);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setNotes('');
  };

  const handleQuickCustomer = (name: string, type: 'Contractor' | 'Plumber/Electrician' | 'Retail' | 'Wholesale') => {
    setCustomerName(name);
    setCustomerType(type);
  };

  return (
    <div className="space-y-4">
      {/* Top Segmented Navigation */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('POS')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'POS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            POS Billing Counter
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Register / Invoices ({sales.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan Barcode</span>
          </button>
          <button
            onClick={() => StorageService.exportToExcel('sales')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Sales</span>
          </button>
        </div>
      </div>

      {activeTab === 'POS' ? (
        /* POS Split Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Product Selection & Cart Items (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Product Search / Scanner Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Add Item to Cart / Bill</span>
                <span className="text-slate-500 font-mono">Invoice: {billNo}</span>
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:border-amber-500 focus:outline-hidden"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.category}] {p.name} · Stock: {p.currentStock} {p.unit} · ₹{p.sellingPrice}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {/* Fast Category Filter Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Havells 2.5mm', 'Astral 1" CPVC', 'Zoloto Ball Valve', 'Jaquar Mixer', 'Bosch Drill'].map(name => {
                  const found = products.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
                  if (!found) return null;
                  return (
                    <button
                      key={found.id}
                      type="button"
                      onClick={() => handleAddItem(found.id)}
                      className="px-2 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      + {name} (₹{found.sellingPrice})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">
                  Bill Line Items ({items.length} {items.length === 1 ? 'item' : 'items'})
                </span>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-rose-600 hover:text-rose-700 font-medium text-[11px]"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-2 w-24">Qty</th>
                      <th className="py-2.5 px-2 w-24">Rate (₹)</th>
                      <th className="py-2.5 px-2 w-20">Disc %</th>
                      <th className="py-2.5 px-3 text-right w-28">Total (₹)</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <p className="font-semibold text-slate-700">Bill Cart is empty</p>
                          <p className="text-xs mt-0.5">Scan a barcode or select an item above to begin</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => {
                        const originalProd = products.find(p => p.id === item.productId);
                        const isStockLow = originalProd && originalProd.currentStock < item.quantity;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 leading-tight">
                                {item.productName}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span className="font-mono">{item.itemCode}</span>
                                <span>·</span>
                                <span>Unit: {item.unit}</span>
                                {isStockLow && (
                                  <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                    <AlertCircle className="w-3 h-3" />
                                    Stock: {originalProd.currentStock}
                                  </span>
                                )}
                              </div>
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
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discountPercent}
                                onChange={e => handleUpdateItem(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                                className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded font-mono text-slate-900 text-xs focus:border-amber-500 focus:outline-hidden"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Info, Payment & Checkout (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleCompleteSale} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                Customer & Payment Details
              </div>

              {/* Quick Customer Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleQuickCustomer('Kailash Contractor', 'Contractor')}
                      className="text-amber-700 hover:underline"
                    >
                      + Kailash (Contr.)
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleQuickCustomer('Walk-in Customer', 'Retail')}
                      className="text-slate-500 hover:underline"
                    >
                      Walk-in
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Electrical Contractor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium focus:border-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Customer Category</label>
                  <select
                    value={customerType}
                    onChange={e => setCustomerType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Retail">Retail Walk-in</option>
                    <option value="Contractor">Contractor (Builder)</option>
                    <option value="Plumber/Electrician">Plumber / Electrician</option>
                    <option value="Wholesale">Wholesale Trader</option>
                  </select>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { mode: 'UPI', icon: QrCode },
                    { mode: 'Cash', icon: Banknote },
                    { mode: 'Card', icon: CreditCard },
                    { mode: 'Credit/Ledger', icon: User },
                  ].map(({ mode, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode as any)}
                      className={`py-2 px-1 rounded-lg border text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-colors ${
                        paymentMode === mode
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill Financial Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono tabular-nums font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Total:</span>
                    <span className="font-mono tabular-nums font-semibold">-₹{discountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax Total:</span>
                  <span className="font-mono tabular-nums font-semibold">+₹{Math.round(taxTotal).toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Grand Total (Net):</span>
                  <span className="font-mono tabular-nums text-xl font-extrabold text-amber-700">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Order notes / delivery address / project site..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-[11px] focus:outline-hidden"
                />
              </div>

              {/* Checkout CTA */}
              <button
                type="submit"
                disabled={items.length === 0}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Complete Sale & Print Receipt</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Sales History Register Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No sales recorded yet. Use the POS Billing Counter to bill your first customer.
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.billNo}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sale.date ? sale.date.split('T')[0] : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{sale.customerName}</div>
                        {sale.customerPhone && (
                          <div className="text-[11px] text-slate-500">{sale.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {sale.customerType}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{sale.items.length} items</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="text-[11px] text-slate-500">
                          {sale.items.map(it => it.productName.slice(0, 18)).join(', ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {sale.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ₹{sale.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptSale(sale);
                            setIsReceiptOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProductForSale={prod => {
          handleAddItem(prod.id);
        }}
      />

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={receiptSale}
      />
    </div>
  );
};
