const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const MatchAudit = require('../models/MatchAudit');

const { parseDocument } = require('../services/geminiParser');
const { resolveDocumentItems } = require('../services/masterResolver');
const { computeThreeWayMatch } = require('../services/matchingEngine');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

// POST /documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { documentType } = req.body;
    const file = req.file;

    if (!documentType || !['po', 'grn', 'invoice'].includes(documentType.toLowerCase())) {
      return res.status(400).json({ error: 'Valid documentType (po, grn, invoice) is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'File upload is required' });
    }

    const type = documentType.toLowerCase();
    const filePath = file.path;

    // 1. Parse document with Gemini / Fallback
    console.log(`[Upload] Parsing ${type} file: ${file.originalname}...`);
    let parsed;
    try {
      parsed = await parseDocument(filePath, type);
    } catch (parseErr) {
      return res.status(422).json({
        error: 'Failed to extract structured data from document',
        details: parseErr.message
      });
    }

    // 2. Master Resolution
    const resolvedItems = await resolveDocumentItems(parsed.items);
    let savedDoc;
    let poNum = parsed.poNumber;

    if (type === 'po') {
      savedDoc = await PurchaseOrder.create({
        poNumber: parsed.poNumber,
        poDate: parsed.poDate,
        vendorName: parsed.vendorName,
        items: resolvedItems,
        rawParsed: parsed,
        filePath: file.filename,
        originalFilename: file.originalname
      });
    } else if (type === 'grn') {
      savedDoc = await Grn.create({
        grnNumber: parsed.grnNumber,
        poNumber: parsed.poNumber,
        grnDate: parsed.grnDate,
        items: resolvedItems,
        rawParsed: parsed,
        filePath: file.filename,
        originalFilename: file.originalname
      });
    } else if (type === 'invoice') {
      savedDoc = await Invoice.create({
        invoiceNumber: parsed.invoiceNumber,
        poNumber: parsed.poNumber,
        invoiceDate: parsed.invoiceDate,
        items: resolvedItems,
        rawParsed: parsed,
        filePath: file.filename,
        originalFilename: file.originalname
      });
    }

    // 3. Update Audit Trail
    let audit = await MatchAudit.findOne({ poNumber: poNum });
    if (!audit) {
      audit = new MatchAudit({ poNumber: poNum, steps: [] });
    }
    audit.steps.push({
      step: `${type.toUpperCase()} Uploaded`,
      status: 'success',
      message: `Uploaded and parsed ${file.originalname} (${resolvedItems.length} items extracted).`,
      at: new Date()
    });
    await audit.save();

    // 4. Recompute Match
    const matchResult = await computeThreeWayMatch(poNum);

    return res.status(201).json({
      message: 'Document uploaded and parsed successfully',
      document: savedDoc,
      documentType: type,
      matchResult
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ error: 'Server error uploading document', details: err.message });
  }
});

// GET /documents?type=&poNumber=
router.get('/', async (req, res) => {
  try {
    const { type, poNumber } = req.query;
    const query = {};
    if (poNumber) query.poNumber = String(poNumber).trim();

    let docs = [];
    if (!type || type === 'po') {
      const pos = await PurchaseOrder.find(query).sort({ createdAt: -1 });
      docs.push(...pos.map(d => ({ ...d.toObject(), docType: 'PO' })));
    }
    if (!type || type === 'grn') {
      const grns = await Grn.find(query).sort({ createdAt: -1 });
      docs.push(...grns.map(d => ({ ...d.toObject(), docType: 'GRN' })));
    }
    if (!type || type === 'invoice') {
      const invoices = await Invoice.find(query).sort({ createdAt: -1 });
      docs.push(...invoices.map(d => ({ ...d.toObject(), docType: 'Invoice' })));
    }

    return res.json({ count: docs.length, documents: docs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let doc = await PurchaseOrder.findById(id).populate('items.skuMaster');
    let type = 'PO';
    if (!doc) {
      doc = await Grn.findById(id).populate('items.skuMaster');
      type = 'GRN';
    }
    if (!doc) {
      doc = await Invoice.findById(id).populate('items.skuMaster');
      type = 'Invoice';
    }

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({ documentType: type, document: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id/file - Stream original file for inline preview
router.get('/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    let doc = await PurchaseOrder.findById(id) || await Grn.findById(id) || await Invoice.findById(id);

    if (!doc || !doc.filePath) {
      return res.status(404).send('File not found');
    }

    let fullPath = path.join(__dirname, '../../uploads', doc.filePath || '');
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath).toLowerCase();
      let contentType = 'application/pdf';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename || 'document' + ext}"`);
      const stream = fs.createReadStream(fullPath);
      return stream.pipe(res);
    }

    // Fallback: Generate structured HTML visual preview for seeded or virtual documents
    const docType = doc.grnNumber ? 'GRN' : doc.invoiceNumber ? 'TAX INVOICE' : 'PURCHASE ORDER';
    const docNum = doc.poNumber || doc.grnNumber || doc.invoiceNumber || 'DOC-001';
    const vendor = doc.vendorName || 'M/s AFP';
    const date = doc.poDate || doc.grnDate || doc.invoiceDate || 'Mar 17, 2026';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${docType} ${docNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { border-b: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
    .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    .badge { background: #0f172a; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; font-size: 12px; }
    .box { background: #f1f5f9; padding: 12px; border-radius: 8px; }
    .box-title { font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
    th { background: #f1f5f9; text-align: left; padding: 8px; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .right { text-align: right; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1 class="title">${docType}</h1>
        <div class="meta">Vendor: ${vendor} | Date: ${date}</div>
      </div>
      <span class="badge">Ref: ${docNum}</span>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Document Reference</div>
        <div><strong>PO Number:</strong> ${doc.poNumber || '-'}</div>
        <div><strong>Doc Date:</strong> ${date}</div>
      </div>
      <div class="box">
        <div class="box-title">Party Information</div>
        <div><strong>Issued By:</strong> ${vendor}</div>
        <div><strong>Ship To:</strong> CLOUDSTORE RETAIL PRIVATE LIMITED</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item Code</th>
          <th>Description</th>
          <th class="right">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${(doc.items || []).map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${item.itemCode}</strong></td>
            <td>${item.description || '-'}</td>
            <td class="right">${item.quantity || item.receivedQuantity || 0}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlContent);
  } catch (err) {
    return res.status(500).send('Error reading document file');
  }
});

module.exports = router;
