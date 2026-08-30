const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const SkuMaster = require('../models/SkuMaster');

/**
 * Recomputes three-way match for a given poNumber from database.
 */
async function computeThreeWayMatch(poNumber) {
  const cleanPoNumber = String(poNumber).trim();

  const pos = await PurchaseOrder.find({ poNumber: cleanPoNumber }).populate('items.skuMaster');
  const grns = await Grn.find({ poNumber: cleanPoNumber }).populate('items.skuMaster');
  const invoices = await Invoice.find({ poNumber: cleanPoNumber }).populate('items.skuMaster');

  // Load all SKU Master records for dynamic re-resolution
  const allSkus = await SkuMaster.find({});
  const skuMapByErp = new Map();
  const skuMapByEan = new Map();
  allSkus.forEach(s => {
    skuMapByErp.set(s.skuErpCode.toLowerCase().trim(), s);
    if (s.eanCode) skuMapByEan.set(s.eanCode.toLowerCase().trim(), s);
  });

  const resolveItemRecord = (itemCode, existingRef) => {
    if (existingRef && typeof existingRef === 'object' && existingRef._id) {
      return existingRef;
    }
    if (!itemCode) return null;
    const raw = String(itemCode).trim().toLowerCase();
    const clean = raw.replace(/\s+psm$/i, '').trim();

    return skuMapByErp.get(raw) || skuMapByErp.get(clean) || skuMapByEan.get(raw) || skuMapByEan.get(clean) || null;
  };

  const hasPO = pos.length > 0;
  const hasGRN = grns.length > 0;
  const hasInvoice = invoices.length > 0;

  const reasons = new Set();
  const itemMap = new Map(); // key -> item summary

  // 1. Check Duplications
  if (pos.length > 1) {
    reasons.add('duplicate_po');
  }

  const grnNumbers = grns.map(g => g.grnNumber);
  if (new Set(grnNumbers).size < grnNumbers.length) {
    reasons.add('duplicate_document');
  }

  const invoiceNumbers = invoices.map(i => i.invoiceNumber);
  if (new Set(invoiceNumbers).size < invoiceNumbers.length) {
    reasons.add('duplicate_document');
  }

  // 2. Check Invoice Date vs PO Date
  if (hasPO && hasInvoice) {
    const poDateStr = pos[0].poDate;
    if (poDateStr) {
      const poDate = parseDate(poDateStr);
      for (const inv of invoices) {
        if (inv.invoiceDate) {
          const invDate = parseDate(inv.invoiceDate);
          if (poDate && invDate && invDate > poDate) {
            reasons.add('invoice_date_after_po_date');
          }
        }
      }
    }
  }

  // Helper to get item key
  const getItemKey = (itemCode, skuRecord) => {
    if (skuRecord && skuRecord._id) {
      return `sku:${skuRecord._id.toString()}`;
    }
    const cleanCode = String(itemCode || '').trim().toLowerCase().replace(/\s+psm$/i, '');
    return `raw:${cleanCode}`;
  };

  const getOrCreateItemEntry = (itemCode, description, skuRecord) => {
    const key = getItemKey(itemCode, skuRecord);
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        key,
        itemCode: itemCode || (skuRecord ? skuRecord.skuErpCode : ''),
        description: description || (skuRecord ? skuRecord.name : ''),
        skuMaster: skuRecord ? {
          id: skuRecord._id,
          skuErpCode: skuRecord.skuErpCode,
          name: skuRecord.name,
          eanCode: skuRecord.eanCode,
          hsnCode: skuRecord.hsnCode,
          uom: skuRecord.uom,
          agreedRate: skuRecord.agreedRate,
          mrp: skuRecord.mrp,
          priceTolerance: skuRecord.priceTolerance
        } : null,
        poQty: 0,
        grnQty: 0,
        invoiceQty: 0,
        unitRate: 0, // from invoice
        invoiceMrp: 0,
        grnMrp: 0,
        itemReasons: [],
        unmapped: !skuRecord
      });
    }
    return itemMap.get(key);
  };

  // Process PO Items
  for (const po of pos) {
    for (const item of po.items) {
      const skuRecord = resolveItemRecord(item.itemCode, item.skuMaster);
      const entry = getOrCreateItemEntry(item.itemCode, item.description, skuRecord);
      entry.poQty += (item.quantity || 0);
    }
  }

  // Process GRN Items
  for (const grn of grns) {
    for (const item of grn.items) {
      const skuRecord = resolveItemRecord(item.itemCode, item.skuMaster);
      const entry = getOrCreateItemEntry(item.itemCode, item.description, skuRecord);
      entry.grnQty += (item.receivedQuantity || 0);
      if (item.mrp) entry.grnMrp = item.mrp;
    }
  }

  // Process Invoice Items
  for (const inv of invoices) {
    for (const item of inv.items) {
      const skuRecord = resolveItemRecord(item.itemCode, item.skuMaster);
      const entry = getOrCreateItemEntry(item.itemCode, item.description, skuRecord);
      entry.invoiceQty += (item.quantity || 0);
      if (item.unitRate) entry.unitRate = item.unitRate;
      if (item.mrp) entry.invoiceMrp = item.mrp;
    }
  }

  // Evaluate Item-Level Reasons & Discrepancies
  const itemsList = Array.from(itemMap.values());

  for (const entry of itemsList) {
    const itemReasons = [];

    // Soft warning for unmapped SKU
    if (entry.unmapped) {
      itemReasons.push('unmapped_master_sku');
      reasons.add('unmapped_master_sku');
    }

    // Missing in PO
    if (hasPO && entry.poQty === 0 && (entry.grnQty > 0 || entry.invoiceQty > 0)) {
      itemReasons.push('item_missing_in_po');
      reasons.add('item_missing_in_po');
    }

    // Quantity checks
    if (hasPO && entry.grnQty > entry.poQty) {
      itemReasons.push('grn_qty_exceeds_po_qty');
      reasons.add('grn_qty_exceeds_po_qty');
    }

    if (hasGRN && hasInvoice && entry.invoiceQty > entry.grnQty) {
      itemReasons.push('invoice_qty_exceeds_grn_qty');
      reasons.add('invoice_qty_exceeds_grn_qty');
    }

    if (hasPO && hasInvoice && entry.invoiceQty > entry.poQty) {
      itemReasons.push('invoice_qty_exceeds_po_qty');
      reasons.add('invoice_qty_exceeds_po_qty');
    }

    // Price Mismatch (Invoice unitRate vs SkuMaster agreedRate)
    if (entry.skuMaster && entry.unitRate > 0 && entry.skuMaster.agreedRate > 0) {
      const agreedRate = entry.skuMaster.agreedRate;
      const tolerance = entry.skuMaster.priceTolerance || 0.05;
      const diffFraction = Math.abs(entry.unitRate - agreedRate) / agreedRate;

      if (diffFraction > tolerance) {
        itemReasons.push('price_mismatch');
        reasons.add('price_mismatch');
      }
    }

    // MRP Mismatch (Invoice or GRN MRP vs SkuMaster MRP)
    if (entry.skuMaster && entry.skuMaster.mrp > 0) {
      const masterMrp = entry.skuMaster.mrp;
      const checkMrp = entry.invoiceMrp || entry.grnMrp;
      if (checkMrp > 0) {
        const mrpDiffFraction = Math.abs(checkMrp - masterMrp) / masterMrp;
        if (mrpDiffFraction > 0.01) { // > ~1%
          itemReasons.push('mrp_mismatch');
          reasons.add('mrp_mismatch');
        }
      }
    }

    entry.itemReasons = itemReasons;
  }

  // Calculate Overall PO Status
  const reasonsArray = Array.from(reasons);

  const hardViolations = [
    'grn_qty_exceeds_po_qty',
    'invoice_qty_exceeds_grn_qty',
    'invoice_qty_exceeds_po_qty',
    'invoice_date_after_po_date',
    'duplicate_po',
    'duplicate_document',
    'item_missing_in_po'
  ];

  const softWarnings = [
    'price_mismatch',
    'mrp_mismatch',
    'unmapped_master_sku'
  ];

  let status = 'matched';

  if (!hasPO || !hasGRN || !hasInvoice) {
    status = 'insufficient_documents';
  } else if (reasonsArray.some(r => hardViolations.includes(r))) {
    status = 'mismatch';
  } else {
    // Check if quantities aren't fully reconciled or soft warnings exist
    const hasUnreconciledQty = itemsList.some(i => i.grnQty < i.poQty || i.invoiceQty < i.poQty || i.invoiceQty < i.grnQty);
    const hasSoftWarning = reasonsArray.some(r => softWarnings.includes(r));

    if (hasUnreconciledQty || hasSoftWarning) {
      status = 'partially_matched';
    }
  }

  return {
    poNumber: cleanPoNumber,
    status,
    reasons: reasonsArray,
    documents: {
      pos,
      grns,
      invoices
    },
    items: itemsList,
    docCounts: {
      poCount: pos.length,
      grnCount: grns.length,
      invoiceCount: invoices.length
    }
  };
}

/**
 * Calculates GET /summary/:poNumber payload.
 */
async function computeSummary(poNumber) {
  const matchResult = await computeThreeWayMatch(poNumber);
  const { pos, grns, invoices } = matchResult.documents;

  // Calculate PO total amount and received total using resolved match items
  let poAmount = 0;
  let totalReceived = 0;
  let totalInvoiced = 0;

  matchResult.items.forEach(item => {
    const rate = (item.skuMaster && item.skuMaster.agreedRate) || item.unitRate || item.invoiceMrp || item.grnMrp || 0;
    poAmount += (item.poQty * rate);
    if (item.grnQty > 0) {
      totalReceived += (item.grnQty * rate);
    }
  });

  // Calculate Total Invoiced amount & cumulative qty
  let cumulativeInvoicedQty = 0;
  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const qty = item.quantity || 0;
      totalInvoiced += (qty * (item.unitRate || 0));
      cumulativeInvoicedQty += qty;
    });
  });

  // Calculate Total Received Qty
  let cumulativeReceivedQty = 0;
  grns.forEach(grn => {
    (grn.items || []).forEach(item => {
      cumulativeReceivedQty += (item.receivedQuantity || 0);
    });
  });

  // Calculate total PO Qty
  let totalPoQty = 0;
  pos.forEach(po => {
    (po.items || []).forEach(item => {
      totalPoQty += (item.quantity || 0);
    });
  });

  // Associated Documents Table Rows
  const associatedDocs = [];

  // GRN rows
  grns.forEach(grn => {
    let grnQty = 0;
    (grn.items || []).forEach(i => grnQty += (i.receivedQuantity || 0));
    associatedDocs.push({
      id: grn._id,
      docType: 'GRN',
      docNumber: grn.grnNumber,
      date: grn.grnDate || '-',
      invoicedQty: '-',
      receivedQty: grnQty,
      status: 'Received'
    });
  });

  // Invoice rows
  invoices.forEach(inv => {
    let invQty = 0;
    (inv.items || []).forEach(i => invQty += (i.quantity || 0));
    associatedDocs.push({
      id: inv._id,
      docType: 'Invoice',
      docNumber: inv.invoiceNumber,
      date: inv.invoiceDate || '-',
      invoicedQty: invQty,
      receivedQty: '-',
      status: 'Invoiced'
    });
  });

  // Final "Current Status" Row
  const pendingQty = Math.max(0, totalPoQty - cumulativeReceivedQty);
  associatedDocs.push({
    id: 'current-status',
    docType: 'Summary',
    docNumber: 'Current Status',
    date: '-',
    invoicedQty: cumulativeInvoicedQty,
    receivedQty: cumulativeReceivedQty,
    pendingDeliveryQty: pendingQty,
    status: matchResult.status || 'insufficient_documents'
  });

  return {
    poNumber,
    poAmount,
    totalInvoiced,
    totalReceived,
    totalPoQty,
    cumulativeInvoicedQty,
    cumulativeReceivedQty,
    pendingDeliveryQty: pendingQty,
    overallStatus: matchResult.status,
    reasons: matchResult.reasons,
    associatedDocs
  };
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Try dd-mm-yyyy or dd/mm/yyyy
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) { // yyyy-mm-dd
      return new Date(parts[0], parts[1] - 1, parts[2]);
    } else { // dd-mm-yyyy
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  return null;
}

module.exports = {
  computeThreeWayMatch,
  computeSummary
};
