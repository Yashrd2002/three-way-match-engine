# Project Description: Three-Way Match Engine for PO, GRN, and Invoice

A full-stack, enterprise-grade procurement reconciliation system built with **Node.js, Express, MongoDB, Gemini API, and Next.js (App Router)**. This application automates the reconciliation process across **Purchase Orders (PO)**, **Goods Receipt Notes (GRN)**, and **Tax Invoices**, identifying item-level and document-level discrepancies in real time.

---

## 🎥 Video Presentation Demo
- **YouTube Presentation Video**: [https://youtu.be/Xcy_Yqa3zZA](https://youtu.be/Xcy_Yqa3zZA)

---

## 🎯 Executive Summary

In enterprise procurement, a single purchase is documented at three distinct operational stages:
1. **Purchase Order (PO)**: What was ordered from the vendor.
2. **Goods Receipt Note (GRN)**: What physically arrived at the warehouse.
3. **Tax Invoice**: What the vendor billed for.

Reconciling these three records—known as **Three-Way Matching**—is critical to prevent overbilling, premature payment for unreceived stock, tax misclassification, and price variances. 

This project delivers an automated **Three-Way Match Engine** that ingests PDF/Image documents, extracts structured data using **Gemini API**, resolves inconsistent vendor line items against a canonical **SKU Master Catalogue**, and visualizes matching statuses with high-fidelity UI layout, interactive file previews, and cell-level mismatch highlighting.

---

## 🏗️ System Architecture & Workflow

```
 ┌────────────────┐     ┌─────────────────────┐     ┌───────────────────────┐
 │  PDF / Image   │ ──> │ Gemini API Parser   │ ──> │ Master Resolver       │
 │ Document Upload│     │ (or Fallback Engine)│     │ (SKU Master Lookup)   │
 └────────────────┘     └─────────────────────┘     └───────────────────────┘
                                                               │
 ┌────────────────┐     ┌─────────────────────┐               ▼
 │ React UI       │ <── │ Match Engine &      │ <── ┌───────────────────────┐
 │ Dashboard      │     │ Summary Recomputer  │     │ MongoDB Document Store│
 └────────────────┘     └─────────────────────┘     └───────────────────────┘
```

### 1. Document Extraction Layer (`backend/src/services/geminiParser.js`)
- Receives uploaded PDF or image files tagged as `po`, `grn`, or `invoice`.
- Calls `@google/generative-ai` with multimodal prompts specifying structured JSON schemas.
- Features an offline structured fallback parser (`pdf-parse`) to guarantee 100% testability even without a Gemini API key.

### 2. Master Resolution Layer (`backend/src/services/masterResolver.js`)
- Vendors often describe products differently across documents (e.g. `BIK-BIKANERI-200G` vs `Bikaji Bikaneri Bhujia 200 G Pp`).
- Resolves raw document line items against the **SKU Master Catalogue** using:
  1. `skuErpCode == itemCode` (trimmed, case-insensitive)
  2. `eanCode == itemCode` (trimmed, case-insensitive)
  3. Cleaned numeric code matching (e.g. `11423 psm` → `11423`)
- Unmapped items are flagged with `unmapped_master_sku` as soft warnings but are **never dropped or blocked**. When a missing SKU is added to the catalogue later, the engine dynamically updates item resolution on the next match call.

### 3. Recomputed Match Engine Layer (`backend/src/services/matchingEngine.js`)
- Computes matching status dynamically from the current stored documents in MongoDB whenever requested.
- Aggregates quantities by resolved `SkuMaster._id` (or raw `itemCode` if unmapped) across multiple lines/GRNs/Invoices.
- Evaluates reason codes and assigns a PO-level status:
  - **`matched`**: Full document set present, no reasons/warnings, and all quantities/prices perfectly reconciled.
  - **`partially_matched`**: No hard violations, but quantities are not fully reconciled (e.g., received < ordered) or soft warnings exist (`price_mismatch`, `mrp_mismatch`, `unmapped_master_sku`).
  - **`mismatch`**: Hard violations detected (`*_qty_exceeds_*`, `invoice_date_after_po_date`, `duplicate_po`, `duplicate_document`, `item_missing_in_po`).
  - **`insufficient_documents`**: Full document set (PO + GRN + Invoice) is not yet available.

---

## 📊 Data Models Specification

### 1. `SkuMaster`
Stores canonical product metadata, contracted prices, and tolerance limits.
- `skuErpCode`: String (Unique, e.g., `"11423"`)
- `name`: String (e.g., `"Cheesy Spicy Veg Momos 24.0 Pieces"`)
- `eanCode`: String (Alternate lookup key)
- `hsnCode`: String (HSN tax code)
- `uom`: String (Unit of Measure, default `"Pcs"`)
- `agreedRate`: Number (Contracted unit cost, e.g., `220.762`)
- `mrp`: Number (Maximum Retail Price, e.g., `305.00`)
- `priceTolerance`: Number (Allowed variance fraction, e.g., `0.05` = 5%)

### 2. `PurchaseOrder`
Stores ordered items keyed by unique `poNumber`.
- `poNumber`: String (Unique link key)
- `poDate`: String
- `vendorName`: String
- `items`: Array of `{ itemCode, description, quantity, skuMaster }`

### 3. `Grn` (Goods Receipt Note)
Stores warehouse receipt records linked by `poNumber`.
- `grnNumber`: String
- `poNumber`: String (Link key)
- `grnDate`: String
- `items`: Array of `{ itemCode, description, receivedQuantity, mrp, skuMaster }`

### 4. `Invoice`
Stores vendor bill records linked by `poNumber`.
- `invoiceNumber`: String
- `poNumber`: String (Link key)
- `invoiceDate`: String
- `items`: Array of `{ itemCode, description, quantity, unitRate, mrp, skuMaster }`

---

## 🚦 Reason Codes & Matching Rules Reference

| Reason Code | Category | Rule / Condition |
| :--- | :--- | :--- |
| `grn_qty_exceeds_po_qty` | Hard Violation | Total received quantity across all GRNs > PO ordered quantity |
| `invoice_qty_exceeds_grn_qty` | Hard Violation | Total invoiced quantity across all Invoices > Total GRN received quantity |
| `invoice_qty_exceeds_po_qty` | Hard Violation | Total invoiced quantity > PO ordered quantity |
| `invoice_date_after_po_date` | Hard Violation | Any Invoice date is after PO date |
| `duplicate_po` | Hard Violation | A second PO was uploaded for a `poNumber` that already exists |
| `duplicate_document` | Hard Violation | A second GRN or Invoice reuses a `grnNumber`/`invoiceNumber` under the same PO |
| `item_missing_in_po` | Hard Violation | Item appears on GRN/Invoice but has no corresponding PO line |
| `price_mismatch` | Soft Warning | Invoice `unitRate` differs from `SkuMaster.agreedRate` by > `priceTolerance` (5%) |
| `mrp_mismatch` | Soft Warning | Invoice or GRN `mrp` differs from `SkuMaster.mrp` by > 1% |
| `unmapped_master_sku` | Soft Warning | Item could not be resolved to any SKU Master record |

---

## 🖥️ Frontend UI Specification & Features

The frontend application (`/frontend`) is built with **Next.js 14 App Router and Tailwind CSS**:

1. **Navigation Rail**: Left sidebar for switching between Dashboard, SKU Master, and Document Upload.
2. **Top Tab Shell**:
   - `Purchase Order (1)` tab
   - `Fulfillment (N)` tab (shows Invoices)
   - `Delivery (N)` tab (shows GRNs)
   - `Summary` tab
3. **Sub-Tab Pills**: Multi-document selector for switching between multiple GRNs/Invoices.
4. **Mismatch Banner**: Color-coded warning banner displayed above header details when discrepancies are detected.
5. **Document Detail View**:
   - **Left Column**: Bordered form panel with read-only document headers.
   - **Right Column**: Original PDF/Image file previewer with zoom controls (`-`, `100%`, `+`).
6. **Full-Width Line Items Comparison Grid**:
   - Displays SKU Code, Description, Mapped SKU Name, HSN, UOM, PO Qty, Received Qty, Invoiced Qty, Agreed Rate, Invoice Rate, MRP, Gross Amount, and Match Status.
   - Price and MRP mismatches are highlighted in amber cells.
   - Unmapped SKUs are highlighted with orange warning badges.
7. **Summary View**:
   - 3 Stat Cards: **PO Amount**, **Total Invoiced**, **Total Received**.
   - **Associated Invoice & GRN Table**: Shows document rows plus a final **Current Status** row with pending delivery quantities.
8. **SKU Master Catalogue (`/skus`)**:
   - Full CRUD table view with search filter.
   - Add/Edit/Delete modals with instant backend synchronization.

---

## ⚡ Tech Stack & Installation

### Backend
```bash
cd backend
npm install
npm run dev
```
Running on `http://localhost:5001`. Connects to MongoDB or launches `mongodb-memory-server` automatically.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Running on `http://localhost:3000`.

---

## 🛠️ Seed Data Feature
The backend includes an automatic and manual 1-click seed endpoint (`POST /seed/sample-data`) that pre-loads:
- **31 SKUs** from the assignment documents into the SKU Master catalog.
- **Purchase Order `CI4PO05788`** (31 items).
- **Goods Receipt Note `CI4000020234`** (31 items, partial delivery on items 3, 4, 25, 205950).
- **Tax Invoice `IN25MH2504251`** (31 items).
