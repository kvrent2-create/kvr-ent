import React, { useState } from 'react';
import { Printer, X, Tag } from 'lucide-react';
import { Product } from '../../types/stock';

interface BarcodeLabelSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct?: Product | null;
}

export const BarcodeLabelSheetModal: React.FC<BarcodeLabelSheetModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
}) => {
  const [activeProductId, setActiveProductId] = useState<string>(
    selectedProduct?.id || products[0]?.id || ''
  );
  const [labelCopies, setLabelCopies] = useState<number>(8);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showRack, setShowRack] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentProd = products.find(p => p.id === activeProductId) || products[0];

  const handlePrint = () => {
    window.print();
  };

  // Generate simulated barcode bars using alternating pattern based on barcode string
  const renderBarcodeBars = (code: string) => {
    const bars: boolean[] = [];
    for (let i = 0; i < code.length; i++) {
      const num = parseInt(code[i], 10) || 5;
      bars.push(true, false, num % 2 === 0, true, num > 5, false, true, false);
    }
    return (
      <div className="flex items-end justify-center h-10 w-full gap-[1.5px] px-2 py-1 bg-white">
        {bars.slice(0, 68).map((isBar, idx) => (
          <div
            key={idx}
            className={`h-full ${isBar ? 'bg-slate-900' : 'bg-transparent'} ${idx % 7 === 0 ? 'w-[2px]' : 'w-[1.2px]'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-base">Barcode Shelf Label Generator</h3>
              <p className="text-xs text-slate-300">Generate printable bin tags & sticker labels for retail shelves</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Select Product</label>
            <select
              value={activeProductId}
              onChange={e => setActiveProductId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-xs focus:outline-hidden focus:border-amber-500 font-medium"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.itemCode}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Number of Labels</label>
            <input
              type="number"
              min="1"
              max="60"
              value={labelCopies}
              onChange={e => setLabelCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-xs focus:outline-hidden focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={e => setShowPrice(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-0"
              />
              <span>Show Price & MRP</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={showRack}
                onChange={e => setShowRack(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-0"
              />
              <span>Show Rack Location</span>
            </label>
          </div>

          <div className="flex items-center justify-end pt-3">
            <button
              onClick={handlePrint}
              className="w-full md:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label Sheet</span>
            </button>
          </div>
        </div>

        {/* Printable Grid Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
          <div className="bg-white p-6 shadow-sm border border-slate-300 max-w-3xl mx-auto rounded-lg">
            <div className="text-center pb-4 mb-4 border-b border-dashed border-slate-300 text-slate-500 text-xs">
              Preview of Standard 50mm x 35mm Thermal / A4 Sticker Sheet
            </div>

            {currentProd ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-4">
                {Array.from({ length: labelCopies }).map((_, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-400 bg-white p-2.5 rounded flex flex-col justify-between text-center select-none shadow-xs hover:border-amber-500 transition-colors"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight mb-1">
                        {currentProd.name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-600 font-semibold">
                        {currentProd.itemCode}
                      </div>
                    </div>

                    <div className="my-1.5">
                      {renderBarcodeBars(currentProd.barcode)}
                      <div className="font-mono text-[10px] tracking-widest text-slate-800 font-bold">
                        {currentProd.barcode}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-1 text-[10px] flex items-center justify-between">
                      {showPrice && (
                        <span className="font-bold font-mono text-slate-900 tabular-nums">
                          ₹{currentProd.sellingPrice}
                        </span>
                      )}
                      {showRack && (
                        <span className="text-[9px] text-slate-600 truncate max-w-[80px]">
                          {currentProd.rackLocation}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <span>Standard A4 / 24-up label compatible</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-md font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
