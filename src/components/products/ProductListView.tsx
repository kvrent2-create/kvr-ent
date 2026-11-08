import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Scan, 
  Printer, 
  Trash2, 
  Edit3, 
  MapPin, 
  Tag, 
  Layers, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { Product, ProductCategory } from '../../types/stock';
import { StorageService } from '../../services/storageService';
import { ProductFormModal } from './ProductFormModal';
import { BarcodeScannerModal } from '../barcode/BarcodeScannerModal';
import { BarcodeLabelSheetModal } from '../barcode/BarcodeLabelSheetModal';

interface ProductListViewProps {
  products: Product[];
  onOpenSaleWithProduct?: (prod: Product) => void;
  onOpenPurchaseWithProduct?: (prod: Product) => void;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  onOpenSaleWithProduct,
  onOpenPurchaseWithProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'HEALTHY'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'cost' | 'selling'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLabelSheetOpen, setIsLabelSheetOpen] = useState(false);
  const [selectedLabelProduct, setSelectedLabelProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      // Stock health filter
      if (stockFilter === 'LOW' && (p.currentStock > p.minStockLevel || p.currentStock === 0)) {
        return false;
      }
      if (stockFilter === 'OUT' && p.currentStock > 0) {
        return false;
      }
      if (stockFilter === 'HEALTHY' && p.currentStock <= p.minStockLevel) {
        return false;
      }
      // Instant text search across name, code, barcode, brand, rack, subcat
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchCode = p.itemCode.toLowerCase().includes(query);
        const matchBarcode = p.barcode.toLowerCase().includes(query);
        const matchBrand = p.brand.toLowerCase().includes(query);
        const matchSub = p.subCategory.toLowerCase().includes(query);
        const matchRack = p.rackLocation.toLowerCase().includes(query);
        return matchName || matchCode || matchBarcode || matchBrand || matchSub || matchRack;
      }
      return true;
    }).sort((a, b) => {
      let valA: string | number = a.name;
      let valB: string | number = b.name;
      if (sortBy === 'stock') {
        valA = a.currentStock;
        valB = b.currentStock;
      } else if (sortBy === 'cost') {
        valA = a.costPrice;
        valB = b.costPrice;
      } else if (sortBy === 'selling') {
        valA = a.sellingPrice;
        valB = b.sellingPrice;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy, sortOrder]);

  const handleDelete = (id: string) => {
    StorageService.deleteProduct(id);
    setDeleteConfirmId(null);
  };

  const handleExportProducts = () => {
    StorageService.exportToExcel('products');
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by product name, barcode, item code, brand, rack..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg text-xs text-slate-900 focus:outline-hidden transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Scan className="w-4 h-4 text-slate-600" />
            <span>Barcode Scanner</span>
          </button>

          <button
            onClick={() => {
              setSelectedLabelProduct(null);
              setIsLabelSheetOpen(true);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Shelf Labels</span>
          </button>

          <button
            onClick={handleExportProducts}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
            title="Download inventory list as Excel file"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Excel Export</span>
          </button>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(['ALL', 'Electrical', 'Plumbing', 'Sanitary', 'Hardware'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Stock Status Filter Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 text-xs">Status:</span>
          {(['ALL', 'LOW', 'OUT', 'HEALTHY'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStockFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                stockFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' && 'All'}
              {st === 'LOW' && 'Low Stock'}
              {st === 'OUT' && 'Out of Stock'}
              {st === 'HEALTHY' && 'In Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Item Code & Barcode</th>
                <th className="py-3 px-4">
                  <button
                    onClick={() => {
                      if (sortBy === 'name') setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('name');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold uppercase"
                  >
                    <span>Product Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3">Category & Rack</th>
                <th className="py-3 px-3 text-right">Cost (₹)</th>
                <th className="py-3 px-3 text-right">Selling (₹)</th>
                <th className="py-3 px-3 text-right">
                  <button
                    onClick={() => {
                      if (sortBy === 'stock') setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('stock');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1 ml-auto text-slate-600 hover:text-slate-900 font-semibold uppercase"
                  >
                    <span>Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 text-center">Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-700">No products match your filters</p>
                    <p className="text-xs mt-1">Try resetting search keywords or category filters</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('ALL');
                        setStockFilter('ALL');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-xs inline-block"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock = product.currentStock <= 0;
                  const isLowStock = !isOutOfStock && product.currentStock <= product.minStockLevel;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Code & Barcode */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-900 text-xs">{product.itemCode}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{product.barcode}</div>
                      </td>

                      {/* Product Name & Brand */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700">{product.brand}</span>
                          <span>·</span>
                          <span>{product.subCategory}</span>
                        </div>
                      </td>

                      {/* Category & Rack */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{product.category}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{product.rackLocation}</span>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        ₹{product.costPrice.toLocaleString()}
                      </td>

                      {/* Selling */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        ₹{product.sellingPrice.toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-normal">
                          MRP: ₹{product.mrp}
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className={`font-bold text-sm ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-700'
                            : 'text-slate-900'
                        }`}>
                          {product.currentStock}
                        </span>{' '}
                        <span className="text-[11px] text-slate-500 font-normal">{product.unit}</span>
                        <div className="text-[10px] text-slate-400">
                          Min: {product.minStockLevel}
                        </div>
                      </td>

                      {/* Stock Health */}
                      <td className="py-3 px-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Adequate
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLabelProduct(product);
                              setIsLabelSheetOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            title="Print Barcode Label"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProductToEdit(product);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === product.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded border border-rose-200">
                              <button
                                type="button"
                                onClick={() => handleDelete(product.id)}
                                className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] rounded font-semibold hover:bg-rose-700"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded hover:bg-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(product.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Adequate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Low Stock
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Out of Stock
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={productToEdit}
        onSuccess={() => {}}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProductForSale={onOpenSaleWithProduct}
        onSelectProductForPurchase={onOpenPurchaseWithProduct}
      />

      <BarcodeLabelSheetModal
        isOpen={isLabelSheetOpen}
        onClose={() => setIsLabelSheetOpen(false)}
        products={products}
        selectedProduct={selectedLabelProduct}
      />
    </div>
  );
};
