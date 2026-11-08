import React, { useState, useEffect, useRef } from 'react';
import { Scan, Search, AlertCircle, CheckCircle2, ArrowRight, CornerDownLeft, X, Layers, MapPin, Tag } from 'lucide-react';
import { Product } from '../../types/stock';
import { StorageService } from '../../services/storageService';
import { playBarcodeBeep, playWarningBeep } from '../../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProductForSale?: (product: Product) => void;
  onSelectProductForPurchase?: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProductForSale,
  onSelectProductForPurchase,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentScans, setRecentScans] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setInputVal('');
      setMatchedProduct(null);
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleScanOrSearch = (codeToSearch?: string) => {
    const code = (codeToSearch || inputVal).trim();
    if (!code) return;

    setHasSearched(true);
    const prod = StorageService.getProductByCodeOrBarcode(code);
    if (prod) {
      playBarcodeBeep();
      setMatchedProduct(prod);
      setRecentScans(prev => {
        const without = prev.filter(p => p.id !== prod.id);
        return [prod, ...without].slice(0, 5);
      });
    } else {
      playWarningBeep();
      setMatchedProduct(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanOrSearch();
    }
  };

  if (!isOpen) return null;

  const quickSamples = [
    { label: 'Havells 2.5mm Wire', code: '8901234001015' },
    { label: 'Astral 1" CPVC Pipe', code: '8901234002012' },
    { label: 'Jaquar Basin Mixer', code: '8901234003019' },
    { label: 'Bosch Impact Drill', code: '8901234004016' },
    { label: 'Zoloto Ball Valve (Low)', code: '8901234002043' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Instant Barcode & Item Code Scanner</h3>
              <p className="text-xs text-slate-300">Point USB handheld scanner or type barcode / item code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Input field simulating USB scanner input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Scan Barcode or Type Code
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan with handheld scanner or enter e.g. 8901234001015 / ELEC-WIR-001..."
                className="w-full pl-11 pr-24 py-3 bg-slate-50 border-2 border-slate-300 focus:border-amber-500 focus:bg-white rounded-lg text-slate-900 font-mono text-sm tracking-wide focus:outline-hidden transition-all shadow-inner"
              />
              <Scan className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => handleScanOrSearch()}
                className="absolute right-2 top-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md flex items-center gap-1 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3 text-slate-400" />
                Press Enter to simulate USB hardware scanner
              </span>
              <span>Audio beep feedback enabled</span>
            </div>
          </div>

          {/* Quick simulator tags */}
          <div>
            <div className="text-xs text-slate-500 font-medium mb-1.5">Simulate scanning shelf item barcodes:</div>
            <div className="flex flex-wrap gap-2">
              {quickSamples.map(sample => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => {
                    setInputVal(sample.code);
                    handleScanOrSearch(sample.code);
                  }}
                  className="px-2.5 py-1 text-xs font-mono bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 rounded-md transition-colors text-slate-700"
                >
                  {sample.label} ({sample.code.slice(-4)})
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          {matchedProduct ? (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4.5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-emerald-800">Barcode Matched</span>
                    <span className="text-xs font-mono text-slate-500">·</span>
                    <span className="text-xs font-mono font-medium text-slate-700">{matchedProduct.itemCode}</span>
                    <span className="text-xs font-mono text-slate-500">·</span>
                    <span className="text-xs font-mono text-slate-600">{matchedProduct.barcode}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{matchedProduct.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {matchedProduct.category} / {matchedProduct.subCategory}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Rack: {matchedProduct.rackLocation}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      Brand: {matchedProduct.brand}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500">Selling Price</div>
                  <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                    ₹{matchedProduct.sellingPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    MRP: ₹{matchedProduct.mrp.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stock Status Bar */}
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Current Stock:</span>
                  <span className={`font-mono font-bold text-sm tabular-nums ${
                    matchedProduct.currentStock <= matchedProduct.minStockLevel ? 'text-amber-700' : 'text-slate-900'
                  }`}>
                    {matchedProduct.currentStock} {matchedProduct.unit}
                  </span>
                  {matchedProduct.currentStock <= matchedProduct.minStockLevel && (
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] font-medium">
                      Low Stock (Min: {matchedProduct.minStockLevel})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onSelectProductForSale && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProductForSale(matchedProduct);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Add to Sale / Bill</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onSelectProductForPurchase && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProductForPurchase(matchedProduct);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>Inward Stock</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : hasSearched ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold">No product found for code "{inputVal}"</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Verify the barcode number or add this product to your Inventory Master.
                </p>
              </div>
            </div>
          ) : null}

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Recent Scans in this session ({recentScans.length})
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                {recentScans.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setMatchedProduct(item);
                      setInputVal(item.barcode);
                    }}
                    className="p-2.5 px-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <span className="text-slate-400 mx-2">·</span>
                      <span className="font-mono text-slate-500">{item.barcode}</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-800 tabular-nums">
                      {item.currentStock} {item.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Supported: 1D EAN-13, UPC-A, Code-128, QR Codes</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
