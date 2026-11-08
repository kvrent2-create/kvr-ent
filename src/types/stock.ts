export type ProductCategory = 'Electrical' | 'Plumbing' | 'Sanitary' | 'Hardware';

export type UnitOfMeasure = 'Pcs' | 'Mtr' | 'Coil' | 'Box' | 'Pkt' | 'Kg' | 'Set' | 'Roll' | 'Bundle';

export interface Product {
  id: string;
  itemCode: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  subCategory: string;
  brand: string;
  unit: UnitOfMeasure;
  rackLocation: string;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  taxRate: number; // e.g. 18%
  currentStock: number;
  minStockLevel: number; // Low stock threshold
  maxStockLevel: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  productId: string;
  itemCode: string;
  productName: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitCost: number;
  taxRate: number;
  totalAmount: number;
}

export interface PurchaseEntry {
  id: string;
  invoiceNo: string;
  supplierName: string;
  supplierContact: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  itemCode: string;
  productName: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  totalAmount: number;
}

export interface SalesEntry {
  id: string;
  billNo: string;
  customerName: string;
  customerPhone?: string;
  customerType: 'Contractor' | 'Plumber/Electrician' | 'Retail' | 'Wholesale';
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit/Ledger';
  paymentStatus: 'Paid' | 'Pending';
  notes?: string;
  createdAt: string;
}

export type ReturnType = 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN';

export interface ReturnItem {
  productId: string;
  itemCode: string;
  productName: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason: 'Defective/Damaged' | 'Excess Stock' | 'Wrong Size/Spec' | 'Quality Issue' | 'Customer Cancelled';
  condition: 'Good (Restockable)' | 'Damaged (Scrap/RTV)';
}

export interface StockReturnEntry {
  id: string;
  returnNo: string;
  type: ReturnType;
  partyName: string;
  originalInvoiceOrBillRef?: string;
  date: string;
  items: ReturnItem[];
  grandTotal: number;
  actionTaken: 'Refund Paid' | 'Store Credit' | 'Supplier Debit Note' | 'Replacement Issued';
  notes?: string;
  createdAt: string;
}

export interface StockAuditLog {
  id: string;
  productId: string;
  productName: string;
  itemCode: string;
  timestamp: string;
  type: 'PURCHASE' | 'SALE' | 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN' | 'MANUAL_ADJUSTMENT' | 'INITIAL_SEED';
  referenceNo: string;
  qtyChange: number;
  newBalance: number;
  notes?: string;
}

export interface StockSummaryStats {
  totalProducts: number;
  totalStockUnits: number;
  totalStockValueCost: number;
  totalStockValueSelling: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  totalPurchasesAmount: number;
  totalSalesAmount: number;
  totalReturnsAmount: number;
  grossMarginEstimate: number;
}
