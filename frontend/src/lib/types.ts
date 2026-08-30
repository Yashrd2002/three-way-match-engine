export interface SkuMasterItem {
  _id: string;
  skuErpCode: string;
  name: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate: number;
  mrp: number;
  priceTolerance: number;
}

export interface DocumentItem {
  _id?: string;
  itemCode: string;
  description: string;
  quantity?: number;
  receivedQuantity?: number;
  unitRate?: number;
  mrp?: number;
  skuMaster?: SkuMasterItem | null;
  unmapped?: boolean;
}

export interface DocumentRecord {
  _id: string;
  docType: 'PO' | 'GRN' | 'Invoice';
  poNumber: string;
  grnNumber?: string;
  invoiceNumber?: string;
  poDate?: string;
  grnDate?: string;
  invoiceDate?: string;
  vendorName?: string;
  items: DocumentItem[];
  originalFilename?: string;
  createdAt: string;
}

export interface MatchedItem {
  key: string;
  itemCode: string;
  description: string;
  skuMaster?: {
    id: string;
    skuErpCode: string;
    name: string;
    eanCode?: string;
    hsnCode?: string;
    uom?: string;
    agreedRate: number;
    mrp: number;
    priceTolerance: number;
  } | null;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  unitRate: number;
  invoiceMrp: number;
  grnMrp: number;
  itemReasons: string[];
  unmapped: boolean;
}

export interface ThreeWayMatchResult {
  poNumber: string;
  status: 'matched' | 'partially_matched' | 'mismatch' | 'insufficient_documents';
  reasons: string[];
  documents: {
    pos: DocumentRecord[];
    grns: DocumentRecord[];
    invoices: DocumentRecord[];
  };
  items: MatchedItem[];
  docCounts: {
    poCount: number;
    grnCount: number;
    invoiceCount: number;
  };
}

export interface SummaryDocRow {
  id: string;
  docType: string;
  docNumber: string;
  date: string;
  invoicedQty: number | string;
  receivedQty: number | string;
  pendingDeliveryQty?: number;
  status: string;
}

export interface SummaryResult {
  poNumber: string;
  poAmount: number;
  totalInvoiced: number;
  totalReceived: number;
  totalPoQty: number;
  cumulativeInvoicedQty: number;
  cumulativeReceivedQty: number;
  pendingDeliveryQty: number;
  overallStatus: string;
  reasons: string[];
  associatedDocs: SummaryDocRow[];
}
