import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { SalesEntry } from '../../types/stock';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SalesEntry | null;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Tax Invoice / Bill Generated</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-800 text-xs">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">STOCKMASTER</h1>
                <p className="text-xs font-semibold text-slate-700">
                  Hardware, Electrical, Plumbing & Sanitary Supplies
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Plot 14-B, Industrial Estate Main Road · GSTIN: 27AABCS1429B1Z8
                </p>
                <p className="text-[11px] text-slate-500">
                  Tel: +91 98220 55432 · support@stockmaster-supply.com
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
                  TAX INVOICE
                </div>
                <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                  {sale.billNo}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Date: {sale.date ? sale.date.split('T')[0] : 'N/A'}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Payment: {sale.paymentMode} ({sale.paymentStatus})
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Billed To:</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{sale.customerName}</div>
              {sale.customerPhone && (
                <div className="text-slate-600 text-[11px]">Ph: {sale.customerPhone}</div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Customer Category:</span>
              <div className="font-semibold text-slate-800 mt-0.5">{sale.customerType}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse mb-4">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2 px-1 w-8">#</th>
                <th className="py-2 px-2">Item Description</th>
                <th className="py-2 px-2 font-mono text-center">Unit</th>
                <th className="py-2 px-2 text-right font-mono">Qty</th>
                <th className="py-2 px-2 text-right font-mono">Rate (₹)</th>
                <th className="py-2 px-2 text-right font-mono">Disc %</th>
                <th className="py-2 px-2 text-right font-mono">Tax %</th>
                <th className="py-2 px-2 text-right font-mono">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-1 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <div className="font-semibold text-slate-900">{item.productName}</div>
                    <div className="font-mono text-[10px] text-slate-500">{item.itemCode}</div>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-600 font-mono">{item.unit}</td>
                  <td className="py-2 px-2 text-right font-mono font-semibold tabular-nums">{item.quantity}</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">₹{item.unitPrice}</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">{item.discountPercent}%</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">{item.taxRate}%</td>
                  <td className="py-2 px-2 text-right font-mono font-bold tabular-nums text-slate-900">
                    ₹{item.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Box */}
          <div className="border-t border-slate-300 pt-3 flex justify-between items-start">
            <div className="max-w-xs text-[11px] text-slate-500 space-y-1">
              <div>Thank you for your business!</div>
              <div>Terms: Goods once sold cannot be returned after 7 days. Returns subject to inspection.</div>
              {sale.notes && <div className="text-slate-700 italic">Notes: {sale.notes}</div>}
            </div>

            <div className="w-56 space-y-1 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">₹{sale.subtotal.toLocaleString()}</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono tabular-nums">-₹{sale.discountTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST / Tax:</span>
                <span className="font-mono tabular-nums">+₹{Math.round(sale.taxTotal).toLocaleString()}</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="font-mono tabular-nums text-base text-amber-700">
                  ₹{sale.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 print:hidden">
          <span>Official System Receipt</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
