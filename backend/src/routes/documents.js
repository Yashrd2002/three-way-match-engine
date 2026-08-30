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

    let fullPath = path.join(__dirname, '../../uploads', doc.filePath);
    if (!fs.existsSync(fullPath)) {
      // Fallback: check if standard sample file exists or return simple inline placeholder response
      return res.status(404).send('File content not available on disk');
    }

    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/pdf';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename || 'document' + ext}"`);
    const stream = fs.createReadStream(fullPath);
    return stream.pipe(res);
  } catch (err) {
    return res.status(500).send('Error reading document file');
  }
});

module.exports = router;
