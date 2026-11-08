import * as XLSX from 'xlsx';
import { 
  Product, 
  PurchaseEntry, 
  SalesEntry, 
  StockReturnEntry, 
  StockAuditLog, 
  StockSummaryStats 
} from '../types/stock';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_PURCHASES, 
  INITIAL_SALES, 
  INITIAL_RETURNS, 
  INITIAL_AUDIT_LOGS 
} from '../data/seedData';

const KEYS = {
  PRODUCTS: 'stockmaster_products_v1',
  PURCHASES: 'stockmaster_purchases_v1',
  SALES: 'stockmaster_sales_v1',
  RETURNS: 'stockmaster_returns_v1',
  AUDIT_LOGS: 'stockmaster_audit_logs_v1',
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyChange() {
  listeners.forEach(fn => fn());
}

export const StorageService = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // --- PRODUCTS ---
  getProducts(): Product[] {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  },

  getProductByCodeOrBarcode(codeOrBarcode: string): Product | undefined {
    const term = codeOrBarcode.trim().toLowerCase();
    return this.getProducts().find(
      p => p.barcode.toLowerCase() === term || p.itemCode.toLowerCase() === term
    );
  },

  saveProduct(productData: Partial<Product> & { name: string; itemCode: string; barcode: string }): Product {
    const products = this.getProducts();
    const now = new Date().toISOString();
    let savedProduct: Product;

    if (productData.id) {
      // Edit existing
      const index = products.findIndex(p => p.id === productData.id);
      if (index === -1) {
        throw new Error('Product not found for update');
      }
      savedProduct = {
        ...products[index],
        ...productData,
        updatedAt: now,
      } as Product;
      products[index] = savedProduct;
    } else {
      // Create new
      savedProduct = {
        id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        itemCode: productData.itemCode.trim().toUpperCase(),
        barcode: productData.barcode.trim(),
        name: productData.name.trim(),
        category: productData.category || 'Hardware',
        subCategory: productData.subCategory || 'General',
        brand: productData.brand || 'Unbranded',
        unit: productData.unit || 'Pcs',
        rackLocation: productData.rackLocation || 'Shelf-1',
        costPrice: Number(productData.costPrice) || 0,
        sellingPrice: Number(productData.sellingPrice) || 0,
        mrp: Number(productData.mrp) || Number(productData.sellingPrice) || 0,
        taxRate: Number(productData.taxRate) || 18,
        currentStock: Number(productData.currentStock) || 0,
        minStockLevel: Number(productData.minStockLevel) || 5,
        maxStockLevel: Number(productData.maxStockLevel) || 100,
        description: productData.description || '',
        createdAt: now,
        updatedAt: now,
      };
      products.push(savedProduct);

      // Log initial stock audit if stock > 0
      if (savedProduct.currentStock > 0) {
        this.addAuditLog({
          productId: savedProduct.id,
          productName: savedProduct.name,
          itemCode: savedProduct.itemCode,
          type: 'MANUAL_ADJUSTMENT',
          referenceNo: 'INIT-CREATE',
          qtyChange: savedProduct.currentStock,
          newBalance: savedProduct.currentStock,
          notes: 'Initial stock recorded on product creation',
        });
      }
    }

    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    notifyChange();
    return savedProduct;
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length !== products.length) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));
      notifyChange();
      return true;
    }
    return false;
  },

  // --- PURCHASES (INWARD) ---
  getPurchases(): PurchaseEntry[] {
    const raw = localStorage.getItem(KEYS.PURCHASES);
    if (!raw) {
      localStorage.setItem(KEYS.PURCHASES, JSON.stringify(INITIAL_PURCHASES));
      return INITIAL_PURCHASES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PURCHASES;
    }
  },

  addPurchase(entry: Omit<PurchaseEntry, 'id' | 'createdAt'>): PurchaseEntry {
    const purchases = this.getPurchases();
    const products = this.getProducts();
    const now = new Date().toISOString();

    const newPurchase: PurchaseEntry = {
      ...entry,
      id: 'pur-' + Date.now(),
      createdAt: now,
    };

    // Automatic Stock Calculation: Increment stock for each item
    entry.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id === item.productId);
      if (pIndex !== -1) {
        const prod = products[pIndex];
        const newStock = prod.currentStock + item.quantity;
        products[pIndex] = {
          ...prod,
          currentStock: newStock,
          costPrice: item.unitCost, // Update latest purchase cost
          updatedAt: now,
        };

        this.addAuditLog({
          productId: prod.id,
          productName: prod.name,
          itemCode: prod.itemCode,
          type: 'PURCHASE',
          referenceNo: entry.invoiceNo,
          qtyChange: item.quantity,
          newBalance: newStock,
          notes: `Purchase from ${entry.supplierName}`,
        });
      }
    });

    purchases.unshift(newPurchase);
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    notifyChange();
    return newPurchase;
  },

  // --- SALES (BILLING / POS) ---
  getSales(): SalesEntry[] {
    const raw = localStorage.getItem(KEYS.SALES);
    if (!raw) {
      localStorage.setItem(KEYS.SALES, JSON.stringify(INITIAL_SALES));
      return INITIAL_SALES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SALES;
    }
  },

  addSale(entry: Omit<SalesEntry, 'id' | 'createdAt'>): SalesEntry {
    const sales = this.getSales();
    const products = this.getProducts();
    const now = new Date().toISOString();

    const newSale: SalesEntry = {
      ...entry,
      id: 'sale-' + Date.now(),
      createdAt: now,
    };

    // Automatic Stock Calculation: Decrement stock for each item
    entry.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id === item.productId);
      if (pIndex !== -1) {
        const prod = products[pIndex];
        const newStock = Math.max(0, prod.currentStock - item.quantity);
        products[pIndex] = {
          ...prod,
          currentStock: newStock,
          updatedAt: now,
        };

        this.addAuditLog({
          productId: prod.id,
          productName: prod.name,
          itemCode: prod.itemCode,
          type: 'SALE',
          referenceNo: entry.billNo,
          qtyChange: -item.quantity,
          newBalance: newStock,
          notes: `Sale to ${entry.customerName} (${entry.customerType})`,
        });
      }
    });

    sales.unshift(newSale);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    notifyChange();
    return newSale;
  },

  // --- RETURNS (CUSTOMER & SUPPLIER) ---
  getReturns(): StockReturnEntry[] {
    const raw = localStorage.getItem(KEYS.RETURNS);
    if (!raw) {
      localStorage.setItem(KEYS.RETURNS, JSON.stringify(INITIAL_RETURNS));
      return INITIAL_RETURNS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_RETURNS;
    }
  },

  addReturn(entry: Omit<StockReturnEntry, 'id' | 'createdAt'>): StockReturnEntry {
    const returns = this.getReturns();
    const products = this.getProducts();
    const now = new Date().toISOString();

    const newReturn: StockReturnEntry = {
      ...entry,
      id: 'ret-' + Date.now(),
      createdAt: now,
    };

    // Stock Calculation based on Return Type:
    // 1. CUSTOMER RETURN with condition 'Good (Restockable)': increments store inventory back
    // 2. SUPPLIER RETURN: item was in store and is returned back to vendor -> decrements store inventory
    entry.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id === item.productId);
      if (pIndex !== -1) {
        const prod = products[pIndex];
        let stockDelta = 0;

        if (entry.type === 'CUSTOMER_RETURN') {
          if (item.condition === 'Good (Restockable)') {
            stockDelta = item.quantity; // Increase stock back
          }
        } else if (entry.type === 'SUPPLIER_RETURN') {
          stockDelta = -item.quantity; // Decrease stock
        }

        const newStock = Math.max(0, prod.currentStock + stockDelta);
        products[pIndex] = {
          ...prod,
          currentStock: newStock,
          updatedAt: now,
        };

        this.addAuditLog({
          productId: prod.id,
          productName: prod.name,
          itemCode: prod.itemCode,
          type: entry.type === 'CUSTOMER_RETURN' ? 'CUSTOMER_RETURN' : 'SUPPLIER_RETURN',
          referenceNo: entry.returnNo,
          qtyChange: stockDelta,
          newBalance: newStock,
          notes: `${entry.type === 'CUSTOMER_RETURN' ? 'Customer Return' : 'Return to Supplier'}: ${item.reason} (${item.condition})`,
        });
      }
    });

    returns.unshift(newReturn);
    localStorage.setItem(KEYS.RETURNS, JSON.stringify(returns));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    notifyChange();
    return newReturn;
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): StockAuditLog[] {
    const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  addAuditLog(log: Omit<StockAuditLog, 'id' | 'timestamp'>) {
    const logs = this.getAuditLogs();
    const newLog: StockAuditLog = {
      ...log,
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 300 logs
    if (logs.length > 300) {
      logs.length = 300;
    }
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  // --- STOCK SUMMARY & KPI STATS ---
  getSummaryStats(): StockSummaryStats {
    const products = this.getProducts();
    const purchases = this.getPurchases();
    const sales = this.getSales();
    const returns = this.getReturns();

    let totalStockUnits = 0;
    let totalStockValueCost = 0;
    let totalStockValueSelling = 0;
    let lowStockItemsCount = 0;
    let outOfStockItemsCount = 0;

    products.forEach(p => {
      totalStockUnits += p.currentStock;
      totalStockValueCost += p.currentStock * p.costPrice;
      totalStockValueSelling += p.currentStock * p.sellingPrice;
      if (p.currentStock <= 0) {
        outOfStockItemsCount++;
        lowStockItemsCount++;
      } else if (p.currentStock <= p.minStockLevel) {
        lowStockItemsCount++;
      }
    });

    const totalPurchasesAmount = purchases.reduce((acc, pur) => acc + pur.grandTotal, 0);
    const totalSalesAmount = sales.reduce((acc, sale) => acc + sale.grandTotal, 0);
    const totalReturnsAmount = returns.reduce((acc, ret) => acc + ret.grandTotal, 0);

    const grossMarginEstimate = totalStockValueSelling > 0
      ? Math.round(((totalStockValueSelling - totalStockValueCost) / totalStockValueSelling) * 100)
      : 0;

    return {
      totalProducts: products.length,
      totalStockUnits,
      totalStockValueCost,
      totalStockValueSelling,
      lowStockItemsCount,
      outOfStockItemsCount,
      totalPurchasesAmount,
      totalSalesAmount,
      totalReturnsAmount,
      grossMarginEstimate,
    };
  },

  // --- EXCEL & CSV EXPORT ---
  exportToExcel(type: 'all' | 'products' | 'low-stock' | 'sales' | 'purchases' | 'returns'): void {
    const wb = XLSX.utils.book_new();
    const products = this.getProducts();
    const dateStr = new Date().toISOString().split('T')[0];

    if (type === 'products' || type === 'all') {
      const productRows = products.map(p => ({
        'Item Code': p.itemCode,
        'Barcode': p.barcode,
        'Product Name': p.name,
        'Category': p.category,
        'Sub Category': p.subCategory,
        'Brand': p.brand,
        'Unit': p.unit,
        'Rack Location': p.rackLocation,
        'Cost Price': p.costPrice,
        'Selling Price': p.sellingPrice,
        'MRP': p.mrp,
        'Tax Rate %': p.taxRate,
        'Current Stock': p.currentStock,
        'Min Stock Level': p.minStockLevel,
        'Stock Valuation (Cost)': p.currentStock * p.costPrice,
        'Stock Valuation (Selling)': p.currentStock * p.sellingPrice,
        'Status': p.currentStock === 0 ? 'Out of Stock' : (p.currentStock <= p.minStockLevel ? 'Low Stock' : 'Adequate'),
      }));
      const ws = XLSX.utils.json_to_sheet(productRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Master');
    }

    if (type === 'low-stock' || type === 'all') {
      const lowStockProducts = products.filter(p => p.currentStock <= p.minStockLevel);
      const lowStockRows = lowStockProducts.map(p => ({
        'Item Code': p.itemCode,
        'Barcode': p.barcode,
        'Product Name': p.name,
        'Category': p.category,
        'Brand': p.brand,
        'Current Stock': p.currentStock,
        'Min Stock (Threshold)': p.minStockLevel,
        'Suggested Reorder Qty': Math.max(1, p.minStockLevel * 2 - p.currentStock),
        'Cost Price': p.costPrice,
        'Estimated Reorder Cost': Math.max(1, p.minStockLevel * 2 - p.currentStock) * p.costPrice,
        'Rack Location': p.rackLocation,
      }));
      const ws = XLSX.utils.json_to_sheet(lowStockRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Low Stock Alert');
    }

    if (type === 'sales' || type === 'all') {
      const sales = this.getSales();
      const salesRows = sales.map(s => ({
        'Bill No': s.billNo,
        'Date': s.date.split('T')[0],
        'Customer Name': s.customerName,
        'Customer Type': s.customerType,
        'Phone': s.customerPhone || '',
        'Total Items Count': s.items.reduce((acc, it) => acc + it.quantity, 0),
        'Subtotal': s.subtotal,
        'Discount Total': s.discountTotal,
        'Tax Total': s.taxTotal,
        'Grand Total': s.grandTotal,
        'Payment Mode': s.paymentMode,
        'Payment Status': s.paymentStatus,
        'Notes': s.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(salesRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Register');
    }

    if (type === 'purchases' || type === 'all') {
      const purchases = this.getPurchases();
      const purchaseRows = purchases.map(pur => ({
        'Invoice No': pur.invoiceNo,
        'Date': pur.date.split('T')[0],
        'Supplier Name': pur.supplierName,
        'Supplier Contact': pur.supplierContact,
        'Total Items Count': pur.items.reduce((acc, it) => acc + it.quantity, 0),
        'Subtotal': pur.subtotal,
        'Tax Total': pur.taxTotal,
        'Grand Total': pur.grandTotal,
        'Payment Status': pur.paymentStatus,
        'Notes': pur.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(purchaseRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Purchase Register');
    }

    if (type === 'returns' || type === 'all') {
      const returns = this.getReturns();
      const returnRows = returns.map(ret => ({
        'Return No': ret.returnNo,
        'Type': ret.type === 'CUSTOMER_RETURN' ? 'Customer Return' : 'Supplier Return',
        'Date': ret.date.split('T')[0],
        'Party Name': ret.partyName,
        'Original Ref': ret.originalInvoiceOrBillRef || '',
        'Grand Total': ret.grandTotal,
        'Action Taken': ret.actionTaken,
        'Items Detail': ret.items.map(it => `${it.productName} (Qty: ${it.quantity}, ${it.reason})`).join('; '),
        'Notes': ret.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(returnRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Returns Log');
    }

    const filename = `StockMaster_${type}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);
  },

  // --- DATABASE BACKUP & RESTORE ---
  exportDatabaseJson(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      purchases: this.getPurchases(),
      sales: this.getSales(),
      returns: this.getReturns(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(data, null, 2);
  },

  restoreDatabaseJson(jsonContent: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonContent);
      if (!Array.isArray(data.products)) {
        return { success: false, message: 'Invalid backup file: Missing products array.' };
      }
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data.products));
      if (Array.isArray(data.purchases)) {
        localStorage.setItem(KEYS.PURCHASES, JSON.stringify(data.purchases));
      }
      if (Array.isArray(data.sales)) {
        localStorage.setItem(KEYS.SALES, JSON.stringify(data.sales));
      }
      if (Array.isArray(data.returns)) {
        localStorage.setItem(KEYS.RETURNS, JSON.stringify(data.returns));
      }
      if (Array.isArray(data.auditLogs)) {
        localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      }
      notifyChange();
      return { success: true, message: `Successfully restored ${data.products.length} products and related records.` };
    } catch {
      return { success: false, message: 'Failed to parse JSON backup file.' };
    }
  },

  resetToDefaults(): void {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(INITIAL_PURCHASES));
    localStorage.setItem(KEYS.SALES, JSON.stringify(INITIAL_SALES));
    localStorage.setItem(KEYS.RETURNS, JSON.stringify(INITIAL_RETURNS));
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    notifyChange();
  },
};
