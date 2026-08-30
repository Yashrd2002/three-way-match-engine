const SkuMaster = require('../models/SkuMaster');
const PurchaseOrder = require('../models/PurchaseOrder');
const Grn = require('../models/Grn');
const Invoice = require('../models/Invoice');
const MatchAudit = require('../models/MatchAudit');
const { resolveDocumentItems } = require('./masterResolver');

const sampleSkus = [
  { skuErpCode: '11423', name: 'Cheesy Spicy Veg Momos 24.0 Pieces', hsnCode: '19022010', agreedRate: 220.762, mrp: 305.00, priceTolerance: 0.05 },
  { skuErpCode: '11797', name: 'Meatigo Hot Wings 250.0 g', hsnCode: '02071400', agreedRate: 126.667, mrp: 175.00, priceTolerance: 0.05 },
  { skuErpCode: '18003', name: 'Meatigo Chicken Curry Cut Skinless Frozen 450 g', hsnCode: '02071300', agreedRate: 141.143, mrp: 195.00, priceTolerance: 0.05 },
  { skuErpCode: '18004', name: 'Meatigo Chicken Boneless Breast Frozen 450.0 g', hsnCode: '02071300', agreedRate: 199.048, mrp: 275.00, priceTolerance: 0.05 },
  { skuErpCode: '205950', name: 'Spring Rolls Veg Frozen 240.0 g / Pork Pepperoni Salami', hsnCode: '20049000', agreedRate: 123.048, mrp: 170.00, priceTolerance: 0.05 },
  { skuErpCode: '253430', name: 'Pork Salami 200.0 g', hsnCode: '16010000', agreedRate: 188.190, mrp: 260.00, priceTolerance: 0.05 },
  { skuErpCode: '33387', name: 'Frozen Chicken Chilli Salami 200.0 g', hsnCode: '16010000', agreedRate: 126.667, mrp: 175.00, priceTolerance: 0.05 },
  { skuErpCode: '33388', name: 'Frozen Chicken Pepperoni Salami 100.0 g', hsnCode: '16010000', agreedRate: 108.571, mrp: 150.00, priceTolerance: 0.05 },
  { skuErpCode: '33390', name: 'Chicken Seekh Kebab 500.0 g', hsnCode: '16010000', agreedRate: 228.000, mrp: 315.00, priceTolerance: 0.05 },
  { skuErpCode: '398656', name: 'Meatigo Chicken Drumsticks 450.0 g', hsnCode: '02071400', agreedRate: 188.190, mrp: 260.00, priceTolerance: 0.05 },
  { skuErpCode: '414867', name: 'Chinese Veg Spring Rolls 240.0 g', hsnCode: '20049000', agreedRate: 119.429, mrp: 165.00, priceTolerance: 0.05 },
  { skuErpCode: '432518', name: 'Meatigo Chicken Kheema 450.0 g', hsnCode: '02071400', agreedRate: 199.048, mrp: 275.00, priceTolerance: 0.05 },
  { skuErpCode: '4459', name: 'Original Chicken Momos 24.0 Pieces', hsnCode: '21069099', agreedRate: 220.762, mrp: 305.00, priceTolerance: 0.05 },
  { skuErpCode: '4460', name: 'Spicy Chicken Momos 24.0 Pieces', hsnCode: '21069099', agreedRate: 220.762, mrp: 305.00, priceTolerance: 0.05 },
  { skuErpCode: '4461', name: 'Veg & Paneer Momos 24.0 Pieces', hsnCode: '21069099', agreedRate: 202.667, mrp: 280.00, priceTolerance: 0.05 },
  { skuErpCode: '453259', name: 'Chicken Cheese & Onion Sausage 250.0 g', hsnCode: '16010000', agreedRate: 144.762, mrp: 200.00, priceTolerance: 0.05 },
  { skuErpCode: '4694', name: 'Original Chicken Momos 10.0 Pieces', hsnCode: '21069099', agreedRate: 133.905, mrp: 185.00, priceTolerance: 0.05 },
  { skuErpCode: '4695', name: 'Spicy Chicken Momos 10.0 Pieces', hsnCode: '21069099', agreedRate: 133.905, mrp: 185.00, priceTolerance: 0.05 },
  { skuErpCode: '4697', name: 'Veg & Paneer Momos 10.0 Pieces', hsnCode: '21069099', agreedRate: 112.190, mrp: 155.00, priceTolerance: 0.05 },
  { skuErpCode: '469735', name: 'Meatigo Everyday Chicken Breast (Frozen) 150.0 g', hsnCode: '16021000', agreedRate: 119.429, mrp: 165.00, priceTolerance: 0.05 },
  { skuErpCode: '4698', name: 'Chicken Ham 200.0 g', hsnCode: '16023200', agreedRate: 133.905, mrp: 185.00, priceTolerance: 0.05 },
  { skuErpCode: '4699', name: 'Pork Sausage 250.0 g', hsnCode: '16010000', agreedRate: 170.095, mrp: 235.00, priceTolerance: 0.05 },
  { skuErpCode: '4700', name: 'Pork Ham 200.0 g', hsnCode: '16024900', agreedRate: 177.333, mrp: 245.00, priceTolerance: 0.05 },
  { skuErpCode: '4701', name: 'Pork Breakfast Bacon 300.0 g', hsnCode: '16024900', agreedRate: 267.810, mrp: 370.00, priceTolerance: 0.05 },
  { skuErpCode: '470663', name: 'Whole Wheat Momos - Veg & Paneer 330.0 g', hsnCode: '16021000', agreedRate: 162.857, mrp: 225.00, priceTolerance: 0.05 },
  { skuErpCode: '489632', name: 'Tandoori Momos - Chicken 280.0 g', hsnCode: '19022010', agreedRate: 159.238, mrp: 220.00, priceTolerance: 0.05 },
  { skuErpCode: '49168', name: 'Peri Peri Veg Momos 15.0 Pieces', hsnCode: '19022010', agreedRate: 88.667, mrp: 245.00, priceTolerance: 0.05 },
  { skuErpCode: '498695', name: 'Chicken Salami 200.0 g', hsnCode: '16010000', agreedRate: 137.524, mrp: 190.00, priceTolerance: 0.05 },
  { skuErpCode: '526303', name: 'Chicken Pepper & Herb Sausage 250.0 g', hsnCode: '16010000', agreedRate: 141.143, mrp: 195.00, priceTolerance: 0.05 },
  { skuErpCode: '598770', name: 'Pork Breakfast Bacon 150.0 g', hsnCode: '16010000', agreedRate: 152.000, mrp: 210.00, priceTolerance: 0.05 },
  { skuErpCode: '6664', name: 'Chicken Sausages 250.0 g', hsnCode: '16010000', agreedRate: 130.286, mrp: 180.00, priceTolerance: 0.05 }
];

async function seedSampleData() {
  console.log('[Seeder] Seeding SKU Master catalogue...');
  for (const sku of sampleSkus) {
    await SkuMaster.findOneAndUpdate(
      { skuErpCode: sku.skuErpCode },
      sku,
      { upsert: true, new: true }
    );
  }

  const poNumber = 'CI4PO05788';

  // Seed Purchase Order CI4PO05788
  console.log('[Seeder] Seeding Purchase Order CI4PO05788...');
  const poItemsRaw = [
    { itemCode: '11423', description: 'Cheesy Spicy Veg Momos 24.0 Pieces', quantity: 50 },
    { itemCode: '11797', description: 'Meatigo Hot Wings 250.0 g', quantity: 75 },
    { itemCode: '18003', description: 'Meatigo Chicken Curry Cut Skinless Frozen 450 g', quantity: 120 },
    { itemCode: '18004', description: 'Meatigo Chicken Boneless Breast Frozen 450.0 g', quantity: 540 },
    { itemCode: '205950', description: 'Spring Rolls Veg Frozen 240.0 g', quantity: 175 },
    { itemCode: '253430', description: 'Pork Salami 200.0 g', quantity: 75 },
    { itemCode: '33387', description: 'Frozen Chicken Chilli Salami 200.0 g', quantity: 75 },
    { itemCode: '33388', description: 'Frozen Chicken Pepperoni Salami 100.0 g', quantity: 120 },
    { itemCode: '33390', description: 'Chicken Seekh Kebab 500.0 g', quantity: 272 },
    { itemCode: '398656', description: 'Meatigo Chicken Drumsticks 450.0 g', quantity: 270 },
    { itemCode: '414867', description: 'Chinese Veg Spring Rolls 240.0 g', quantity: 25 },
    { itemCode: '432518', description: 'Meatigo Chicken Kheema 450.0 g', quantity: 360 },
    { itemCode: '4459', description: 'Original Chicken Momos 24.0 Pieces', quantity: 475 },
    { itemCode: '4460', description: 'Spicy Chicken Momos 24.0 Pieces', quantity: 325 },
    { itemCode: '4461', description: 'Veg & Paneer Momos 24.0 Pieces', quantity: 75 },
    { itemCode: '453259', description: 'Chicken Cheese & Onion Sausage 250.0 g', quantity: 40 },
    { itemCode: '4694', description: 'Original Chicken Momos 10.0 Pieces', quantity: 450 },
    { itemCode: '4695', description: 'Spicy Chicken Momos 10.0 Pieces', quantity: 100 },
    { itemCode: '4697', description: 'Veg & Paneer Momos 10.0 Pieces', quantity: 400 },
    { itemCode: '469735', description: 'Meatigo Everyday Chicken Breast (Frozen) 150.0 g', quantity: 90 },
    { itemCode: '4698', description: 'Chicken Ham 200.0 g', quantity: 150 },
    { itemCode: '4699', description: 'Pork Sausage 250.0 g', quantity: 40 },
    { itemCode: '4700', description: 'Pork Ham 200.0 g', quantity: 50 },
    { itemCode: '4701', description: 'Pork Breakfast Bacon 300.0 g', quantity: 20 },
    { itemCode: '470663', description: 'Whole Wheat Momos - Veg & Paneer 330.0 g', quantity: 80 },
    { itemCode: '489632', description: 'Tandoori Momos - Chicken 280.0 g', quantity: 35 },
    { itemCode: '49168', description: 'Peri Peri Veg Momos 15.0 Pieces', quantity: 80 },
    { itemCode: '498695', description: 'Chicken Salami 200.0 g', quantity: 25 },
    { itemCode: '526303', description: 'Chicken Pepper & Herb Sausage 250.0 g', quantity: 20 },
    { itemCode: '598770', description: 'Pork Breakfast Bacon 150.0 g', quantity: 36 },
    { itemCode: '6664', description: 'Chicken Sausages 250.0 g', quantity: 380 }
  ];

  const poItemsResolved = await resolveDocumentItems(poItemsRaw);
  await PurchaseOrder.findOneAndUpdate(
    { poNumber },
    {
      poNumber,
      poDate: 'Mar 17, 2026',
      vendorName: 'M/s AFP',
      items: poItemsResolved,
      rawParsed: { sample: true },
      originalFilename: 'Purchase_Order_CI4PO05788.pdf'
    },
    { upsert: true, new: true }
  );

  // Seed GRN CI4000020234
  console.log('[Seeder] Seeding GRN CI4000020234...');
  const grnItemsRaw = poItemsRaw.map(item => {
    let recvQty = item.quantity;
    // Introduce partial received quantity for items 3, 4, 25 to demonstrate match engine discrepancy handling
    if (item.itemCode === '18003') recvQty = 30; // Ordered 120, received 30
    if (item.itemCode === '18004') recvQty = 30; // Ordered 540, received 30
    if (item.itemCode === '470663') recvQty = 40; // Ordered 80, received 40
    if (item.itemCode === '205950') recvQty = 40; // Ordered 175, received 40

    const skuObj = sampleSkus.find(s => s.skuErpCode === item.itemCode);
    return {
      itemCode: item.itemCode,
      description: item.description,
      receivedQuantity: recvQty,
      mrp: skuObj ? skuObj.mrp : 0
    };
  });

  const grnItemsResolved = await resolveDocumentItems(grnItemsRaw);
  await Grn.findOneAndUpdate(
    { grnNumber: 'CI4000020234', poNumber },
    {
      grnNumber: 'CI4000020234',
      poNumber,
      grnDate: '24-3-2026',
      items: grnItemsResolved,
      rawParsed: { sample: true },
      originalFilename: 'GRN_CI4000020234.pdf'
    },
    { upsert: true, new: true }
  );

  // Seed Invoice IN25MH2504251
  console.log('[Seeder] Seeding Invoice IN25MH2504251...');
  const invItemsRaw = grnItemsRaw.map(item => {
    const skuObj = sampleSkus.find(s => s.skuErpCode === item.itemCode);
    return {
      itemCode: item.itemCode,
      description: item.description,
      quantity: item.receivedQuantity,
      unitRate: skuObj ? skuObj.agreedRate : 0,
      mrp: skuObj ? skuObj.mrp : 0
    };
  });

  const invItemsResolved = await resolveDocumentItems(invItemsRaw);
  await Invoice.findOneAndUpdate(
    { invoiceNumber: 'IN25MH2504251', poNumber },
    {
      invoiceNumber: 'IN25MH2504251',
      poNumber,
      invoiceDate: '24/03/2026',
      items: invItemsResolved,
      rawParsed: { sample: true },
      originalFilename: 'Invoice_IN25MH2504251.pdf'
    },
    { upsert: true, new: true }
  );

  // Add Match Audit Entry
  await MatchAudit.findOneAndUpdate(
    { poNumber },
    {
      poNumber,
      steps: [
        { step: 'PO Created', status: 'success', message: 'PO CI4PO05788 loaded with 31 items.', at: new Date() },
        { step: 'GRN Created', status: 'success', message: 'GRN CI4000020234 processed with 31 items.', at: new Date() },
        { step: 'Invoice Created', status: 'success', message: 'Invoice IN25MH2504251 processed with 31 items.', at: new Date() },
        { step: 'Master Resolution', status: 'success', message: 'Resolved 31/31 items against SKU Master.', at: new Date() },
        { step: 'Three-Way Match', status: 'info', message: 'Engine computed match status: partially_matched', at: new Date() }
      ]
    },
    { upsert: true, new: true }
  );

  console.log('[Seeder] Sample data seeded successfully for PO CI4PO05788!');
  return { poNumber, skuCount: sampleSkus.length };
}

module.exports = { seedSampleData };
