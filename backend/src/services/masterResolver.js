const SkuMaster = require('../models/SkuMaster');

/**
 * Resolves a raw itemCode string to a SkuMaster record ID.
 * Lookup sequence:
 * 1. Exact match on skuErpCode (case-insensitive, trimmed)
 * 2. Exact match on eanCode (case-insensitive, trimmed)
 * 3. Match by cleaning leading/trailing non-digit noise (e.g. "11423 psm" -> "11423")
 */
async function resolveItem(itemCode) {
  if (!itemCode) {
    return { skuMaster: null, unmapped: true };
  }

  const rawCode = String(itemCode).trim();
  const cleanCode = rawCode.replace(/\s+psm$/i, '').trim();

  // 1. Try skuErpCode
  let sku = await SkuMaster.findOne({
    skuErpCode: { $regex: new RegExp(`^${escapeRegex(rawCode)}$`, 'i') }
  });

  if (!sku && cleanCode !== rawCode) {
    sku = await SkuMaster.findOne({
      skuErpCode: { $regex: new RegExp(`^${escapeRegex(cleanCode)}$`, 'i') }
    });
  }

  // 2. Try eanCode
  if (!sku) {
    sku = await SkuMaster.findOne({
      eanCode: { $regex: new RegExp(`^${escapeRegex(rawCode)}$`, 'i') }
    });
  }
  if (!sku && cleanCode !== rawCode) {
    sku = await SkuMaster.findOne({
      eanCode: { $regex: new RegExp(`^${escapeRegex(cleanCode)}$`, 'i') }
    });
  }

  if (sku) {
    return { skuMaster: sku._id, unmapped: false, skuRecord: sku };
  }

  return { skuMaster: null, unmapped: true, skuRecord: null };
}

/**
 * Resolve all items in a document and assign skuMaster references.
 */
async function resolveDocumentItems(items) {
  if (!Array.isArray(items)) return [];

  const resolved = [];
  for (const item of items) {
    const { skuMaster, unmapped } = await resolveItem(item.itemCode);
    resolved.push({
      ...item,
      skuMaster,
      unmapped
    });
  }
  return resolved;
}

function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = {
  resolveItem,
  resolveDocumentItems
};
