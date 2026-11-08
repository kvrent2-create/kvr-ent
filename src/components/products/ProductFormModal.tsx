import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { Product, ProductCategory, UnitOfMeasure } from '../../types/stock';
import { StorageService } from '../../services/storageService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: (saved: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Electrical');
  const [subCategory, setSubCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState<UnitOfMeasure>('Pcs');
  const [rackLocation, setRackLocation] = useState('');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [mrp, setMrp] = useState<string>('0');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [currentStock, setCurrentStock] = useState<string>('0');
  const [minStockLevel, setMinStockLevel] = useState<string>('5');
  const [maxStockLevel, setMaxStockLevel] = useState<string>('100');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setItemCode(productToEdit.itemCode);
      setBarcode(productToEdit.barcode);
      setCategory(productToEdit.category);
      setSubCategory(productToEdit.subCategory);
      setBrand(productToEdit.brand);
      setUnit(productToEdit.unit);
      setRackLocation(productToEdit.rackLocation);
      setCostPrice(productToEdit.costPrice.toString());
      setSellingPrice(productToEdit.sellingPrice.toString());
      setMrp(productToEdit.mrp.toString());
      setTaxRate(productToEdit.taxRate);
      setCurrentStock(productToEdit.currentStock.toString());
      setMinStockLevel(productToEdit.minStockLevel.toString());
      setMaxStockLevel(productToEdit.maxStockLevel.toString());
      setDescription(productToEdit.description || '');
      setErrorMsg('');
    } else {
      // Default new product values
      resetForm();
    }
  }, [productToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setItemCode(`ELEC-ITM-${randomSuffix}`);
    setBarcode(`8901234${Math.floor(100000 + Math.random() * 900000)}`);
    setCategory('Electrical');
    setSubCategory('General Electrical');
    setBrand('');
    setUnit('Pcs');
    setRackLocation('Shelf-A1');
    setCostPrice('');
    setSellingPrice('');
    setMrp('');
    setTaxRate(18);
    setCurrentStock('0');
    setMinStockLevel('5');
    setMaxStockLevel('100');
    setDescription('');
    setErrorMsg('');
  };

  const handleGenerateBarcode = () => {
    const randomEan = `8901234${Math.floor(100000 + Math.random() * 900000)}`;
    setBarcode(randomEan);
  };

  const handleCategoryChange = (newCat: ProductCategory) => {
    setCategory(newCat);
    const prefix = newCat === 'Electrical' ? 'ELEC' : newCat === 'Plumbing' ? 'PLUM' : newCat === 'Sanitary' ? 'SANI' : 'HDW';
    const num = Math.floor(100 + Math.random() * 900);
    setItemCode(`${prefix}-ITM-${num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }
    if (!itemCode.trim()) {
      setErrorMsg('Item Code is required.');
      return;
    }
    if (!barcode.trim()) {
      setErrorMsg('Barcode is required.');
      return;
    }

    const cPrice = parseFloat(costPrice) || 0;
    const sPrice = parseFloat(sellingPrice) || 0;
    const mPrice = parseFloat(mrp) || sPrice;

    if (sPrice < 0 || cPrice < 0) {
      setErrorMsg('Prices cannot be negative.');
      return;
    }

    try {
      const saved = StorageService.saveProduct({
        id: productToEdit?.id,
        name: name.trim(),
        itemCode: itemCode.trim().toUpperCase(),
        barcode: barcode.trim(),
        category,
        subCategory: subCategory.trim() || 'General',
        brand: brand.trim() || 'Generic',
        unit,
        rackLocation: rackLocation.trim() || 'Central Bin',
        costPrice: cPrice,
        sellingPrice: sPrice,
        mrp: mPrice,
        taxRate,
        currentStock: parseFloat(currentStock) || 0,
        minStockLevel: Math.max(1, parseFloat(minStockLevel) || 5),
        maxStockLevel: Math.max(10, parseFloat(maxStockLevel) || 100),
        description: description.trim(),
      });

      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to save product.');
    }
  };

  if (!isOpen) return null;

  const costNum = parseFloat(costPrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const marginPct = sellNum > 0 ? Math.round(((sellNum - costNum) / sellNum) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div>
            <h3 className="font-semibold text-base">
              {productToEdit ? 'Edit Product Details' : 'Add New Hardware / Electrical / Plumbing Product'}
            </h3>
            <p className="text-xs text-slate-300">
              {productToEdit ? `Updating: ${productToEdit.name}` : 'Create an inventory item with barcode and reorder threshold'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => handleCategoryChange(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium focus:border-amber-500 focus:outline-hidden"
              >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Sanitary">Sanitary</option>
                <option value="Hardware">Hardware</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Subcategory</label>
              <input
                type="text"
                value={subCategory}
                onChange={e => setSubCategory(e.target.value)}
                placeholder="e.g. Wires, CPVC, Faucets, Tools"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Brand / Manufacturer</label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Havells, Astral, Jaquar, Bosch"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Product Title / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Finolex 1.5 sq mm FR PVC Insulated Wire Blue (90m Coil)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium focus:border-amber-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Item Code & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Item Code / SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={itemCode}
                onChange={e => setItemCode(e.target.value.toUpperCase())}
                placeholder="e.g. ELEC-WIR-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono font-medium focus:border-amber-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-slate-700">
                  Barcode (EAN-13 / Code-128) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="Scan or enter 13-digit barcode"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono focus:border-amber-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Unit & Rack Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit of Measure (UoM)</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as UnitOfMeasure)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Mtr">Mtr (Meters)</option>
                <option value="Coil">Coil (90m / 100m)</option>
                <option value="Box">Box</option>
                <option value="Bundle">Bundle (Pipes / Conduits)</option>
                <option value="Pkt">Pkt (Packets)</option>
                <option value="Kg">Kg (Kilograms)</option>
                <option value="Set">Set (Closets / Basins / Kits)</option>
                <option value="Roll">Roll</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Rack / Bin Location</label>
              <input
                type="text"
                value={rackLocation}
                onChange={e => setRackLocation(e.target.value)}
                placeholder="e.g. Yard-P1, Elec-Bin-B4, Shelf-C2"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Pricing Row with Margin Calculation */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>Pricing & Tax</span>
              <span className={`text-[11px] font-mono font-medium ${marginPct < 15 ? 'text-amber-700' : 'text-emerald-700'}`}>
                Gross Margin: {marginPct}%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-slate-600 mb-0.5">Cost Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono tabular-nums focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-0.5">Selling Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono tabular-nums font-semibold focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-0.5">MRP (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={mrp}
                  onChange={e => setMrp(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono tabular-nums focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-0.5">GST / Tax (%)</label>
                <select
                  value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono focus:border-amber-500 focus:outline-hidden"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18% (Standard)</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stock Quantities & Thresholds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {productToEdit ? 'Current Stock' : 'Opening Stock'}
              </label>
              <input
                type="number"
                value={currentStock}
                onChange={e => setCurrentStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono tabular-nums font-semibold focus:border-amber-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500">Auto-adjusted by purchases & sales</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Min Stock Alert Level <span className="text-amber-600">*</span>
              </label>
              <input
                type="number"
                value={minStockLevel}
                onChange={e => setMinStockLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono tabular-nums focus:border-amber-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500">Triggers reorder notification</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Max Stock Capacity</label>
              <input
                type="number"
                value={maxStockLevel}
                onChange={e => setMaxStockLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono tabular-nums focus:border-amber-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500">Warehouse limit</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Specifications / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. SDR 11 Class 1, ISI marked, 10 years manufacturer warranty..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold transition-colors shadow-xs"
            >
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
