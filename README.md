# Three-Way Match Engine for PO, GRN, and Invoice

A full-stack procurement reconciliation engine that automates three-way matching across **Purchase Orders (PO)**, **Goods Receipt Notes (GRN)**, and **Invoices**. The system extracts structured document data via the **Gemini API** (with a zero-dependency fallback parser), resolves line items against a **SKU Master** catalog, stores all documents in **MongoDB**, and continuously recomputes item-level and PO-level reconciliation statuses with high UI fidelity.

---

## Technical Stack & Architecture

### Backend
- **Runtime & Server**: Node.js, Express.js
- **Database**: MongoDB via Mongoose (with automatic fallback to `mongodb-memory-server` for zero-setup execution)
- **AI Document Parser**: `@google/generative-ai` (Gemini 1.5 Flash) with fallback parser for offline/test environments
- **Authentication**: Bearer Token Auth middleware (`POST /auth/login`)
- **File Storage**: Local disk (`backend/uploads/`) with streaming preview endpoint

### Frontend
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS with custom HSL/Slate dark-mode tokens & accent colors
- **Icons**: Lucide React
- **API Client**: Custom fetch wrapper with Bearer token interceptor

---

## Quick Start & Running Locally

### 1. Start Backend API
```bash
cd backend
npm install
npm run dev # or npm start
```
The backend starts on `http://localhost:5001`. It automatically connects to MongoDB (or launches MongoMemoryServer) and auto-seeds the SKU Master catalog and sample documents (`CI4PO05788`, `CI4000020234`, `IN25MH2504251`).

### 2. Start Frontend UI
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Data Model & Rationale

```
[ SkuMaster ]
  ├── skuErpCode (string, unique)
  ├── name (string)
  ├── eanCode (string)
  ├── hsnCode (string)
  ├── uom (string)
  ├── agreedRate (number)
  ├── mrp (number)
  └── priceTolerance (number, e.g. 0.05 = 5%)

[ PurchaseOrder ] ───── (keyed by poNumber) ───── [ Grn ]
        │                                            │
        └────────────────── [ Invoice ] ─────────────┘
```

### Item Matching Key Rationale
Matching raw product description strings across documents fails because a PO line might read `BIK-BIKANERI-200G` while the GRN reads `Bikaji Bikaneri Bhujia 200 G Pp`. 
The engine resolves items to **`SkuMaster._id`** using:
1. `skuErpCode == itemCode` (trimmed, case-insensitive)
2. `eanCode == itemCode` (trimmed, case-insensitive)
3. Cleaned numeric code matching (e.g. `11423 psm` -> `11423`)

If an item cannot be resolved, `skuMaster` remains `null` and `unmapped_master_sku` is flagged as a soft warning. The document is **never rejected or dropped**. When a missing SKU is created in the SKU Master later, recomputing the match instantly resolves the item.

### Out-of-Order Upload Robustness
Documents are linked strictly by the `poNumber` string (not foreign key constraints). An Invoice or GRN can be uploaded **before** the PO exists in the system. The match result is always dynamically recomputed from whatever documents currently exist in MongoDB.

### Duplication Handling
- Uploading a second PO for an existing `poNumber` flags `duplicate_po` without overwriting the previous document.
- Uploading multiple GRNs/Invoices reusing `grnNumber` or `invoiceNumber` under the same `poNumber` flags `duplicate_document`.

---

## Three-Way Match Engine Rules & Statuses

### Item-Level Reason Codes
- `grn_qty_exceeds_po_qty`: Received GRN quantity > PO quantity
- `invoice_qty_exceeds_grn_qty`: Invoiced quantity > Received GRN quantity
- `invoice_qty_exceeds_po_qty`: Invoiced quantity > PO quantity
- `invoice_date_after_po_date`: Invoice date is after PO date
- `duplicate_po`: Multiple POs uploaded for same PO number
- `duplicate_document`: Duplicate GRN or Invoice number detected
- `item_missing_in_po`: Item on GRN/Invoice has no PO line
- `price_mismatch`: Invoice `unitRate` differs from `SkuMaster.agreedRate` by > `priceTolerance` (5%)
- `mrp_mismatch`: Invoice or GRN MRP differs from `SkuMaster.mrp` by > 1%
- `unmapped_master_sku`: Item could not be resolved to SKU Master catalog

### PO-Level Statuses
1. **`insufficient_documents`**: The full PO + GRN + Invoice set is not yet available.
2. **`mismatch`**: Any hard violation (`*_qty_exceeds_*`, `invoice_date_after_po_date`, `duplicate_po`, `duplicate_document`, `item_missing_in_po`).
3. **`partially_matched`**: No hard violations, but quantities are not fully reconciled (e.g. received < ordered) or soft warnings exist (`price_mismatch`, `mrp_mismatch`, `unmapped_master_sku`).
4. **`matched`**: Full document set present, no reasons/warnings, and all quantities perfectly reconciled.

---

## API Documentation

- `POST /auth/login` -> `{ token, user }`
- `POST /documents/upload` -> Multipart upload (`file`, `documentType`)
- `GET /documents?type=&poNumber=` -> List uploaded documents
- `GET /documents/:id` -> Get document metadata
- `GET /documents/:id/file` -> Stream original PDF/Image file for preview
- `GET /match/:poNumber` -> Returns recomputed 3-way match & item grid
- `GET /summary/:poNumber` -> Returns summary stat cards & cumulative associated docs table
- `POST/GET/PATCH/DELETE /masters/sku[/:id]` -> SKU Master catalog CRUD
- `POST /seed/sample-data` -> 1-click seed endpoint for sample documents and 31 SKUs

---

## UI Highlights & Screenshots

- **Navigation Rail**: Left dark sidebar for quick switching between Dashboard, SKU Master, and Document Upload.
- **Top Tab Shell**: Displays count badges for `Purchase Order (1)`, `Fulfillment (1)`, `Delivery (1)`, and `Summary`.
- **Sub-Tab Pills**: Allows switching between multiple GRNs and Invoices.
- **Mismatch Banner**: Displays discrepancy reason codes with clear warning styling.
- **Document Detail View**: 2-column layout with read-only form panel (Left), original file preview with zoom controls (Right), and full-width comparison item grid (Bottom).
- **Cell Highlighting**: Price and MRP mismatches are highlighted in amber cells; unmapped SKUs are flagged with orange warning pills.
- **Summary Tab**: 3 stat cards (PO Amount, Total Invoiced, Total Received) and Associated Invoice & GRN table with cumulative received/invoiced quantities and final Current Status row.
