'use client';

import React from 'react';
import { MatchedItem } from '../lib/types';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

interface ItemGridProps {
  items: MatchedItem[];
  docType?: 'PO' | 'GRN' | 'Invoice' | 'all';
}

export const ItemGrid: React.FC<ItemGridProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium">
        No line items extracted for this document set yet.
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (!val && val !== 0) return '-';
    return `₹${val.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Grid Bar */}
      <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Line Items Comparison Grid</h3>
          <span className="text-xs bg-slate-200/80 text-slate-700 font-mono px-2.5 py-0.5 rounded-full font-bold">
            {items.length} items
          </span>
        </div>

        <div className="flex items-center gap-5 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Matched
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></span> Discrepancy
          </span>
          <span className="flex items-center gap-1.5 text-orange-700">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm"></span> Unmapped SKU
          </span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto max-h-[520px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4 min-w-[45px] text-center">#</th>
              <th className="py-3.5 px-4 min-w-[100px]">SKU Code</th>
              <th className="py-3.5 px-4 min-w-[220px]">Description</th>
              <th className="py-3.5 px-4 min-w-[180px]">Mapped SKU Name</th>
              <th className="py-3.5 px-4 min-w-[80px]">HSN</th>
              <th className="py-3.5 px-4 min-w-[60px] text-center">UOM</th>
              <th className="py-3.5 px-4 text-right bg-blue-50/50">PO Qty</th>
              <th className="py-3.5 px-4 text-right bg-indigo-50/50">Recv Qty</th>
              <th className="py-3.5 px-4 text-right bg-purple-50/50">Inv Qty</th>
              <th className="py-3.5 px-4 text-right">Agreed Rate</th>
              <th className="py-3.5 px-4 text-right">Inv Rate</th>
              <th className="py-3.5 px-4 text-right">MRP</th>
              <th className="py-3.5 px-4 text-right font-extrabold">Gross Amt</th>
              <th className="py-3.5 px-4 min-w-[140px] text-center">Match Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const hasPriceMismatch = item.itemReasons.includes('price_mismatch');
              const hasMrpMismatch = item.itemReasons.includes('mrp_mismatch');
              const hasQtyMismatch = item.itemReasons.some(r => r.includes('qty_exceeds'));
              const isUnmapped = item.unmapped;

              const grossAmount = (item.invoiceQty || item.grnQty || item.poQty) * (item.unitRate || (item.skuMaster ? item.skuMaster.agreedRate : 0));

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/90 transition-colors ${
                    isUnmapped
                      ? 'bg-orange-50/30'
                      : hasPriceMismatch || hasMrpMismatch || hasQtyMismatch
                      ? 'bg-amber-50/40'
                      : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  
                  {/* SKU Code */}
                  <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                    {item.itemCode || '-'}
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4 text-slate-700 font-medium max-w-[240px] truncate" title={item.description}>
                    {item.description || '-'}
                  </td>

                  {/* Mapped SKU Name */}
                  <td className="py-3 px-4">
                    {item.skuMaster ? (
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 block truncate" title={item.skuMaster.name}>
                        {item.skuMaster.name}
                      </span>
                    ) : (
                      <span className="font-semibold text-orange-800 bg-orange-100/70 px-2.5 py-1 rounded-md border border-orange-200 inline-flex items-center gap-1 text-[11px]">
                        <HelpCircle className="w-3.5 h-3.5 text-orange-600" /> Unmapped SKU
                      </span>
                    )}
                  </td>

                  {/* HSN */}
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {item.skuMaster ? item.skuMaster.hsnCode || '-' : '-'}
                  </td>

                  {/* UOM */}
                  <td className="py-3 px-4 text-center text-slate-600 font-medium">
                    {item.skuMaster ? item.skuMaster.uom || 'Pcs' : 'Pcs'}
                  </td>

                  {/* PO Qty */}
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono bg-blue-50/20">
                    {item.poQty}
                  </td>

                  {/* Received Qty */}
                  <td className={`py-3 px-4 text-right font-bold font-mono bg-indigo-50/20 ${
                    item.grnQty < item.poQty ? 'text-amber-700' : 'text-slate-900'
                  }`}>
                    {item.grnQty}
                  </td>

                  {/* Invoiced Qty */}
                  <td className={`py-3 px-4 text-right font-bold font-mono bg-purple-50/20 ${
                    item.invoiceQty > item.grnQty || item.invoiceQty > item.poQty ? 'text-rose-600 bg-rose-50' : 'text-slate-900'
                  }`}>
                    {item.invoiceQty}
                  </td>

                  {/* Agreed Rate */}
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">
                    {item.skuMaster ? formatCurrency(item.skuMaster.agreedRate) : '-'}
                  </td>

                  {/* Invoice Rate (Highlighted if mismatch) */}
                  <td className={`py-3 px-4 text-right font-mono font-bold ${
                    hasPriceMismatch ? 'bg-amber-200 text-amber-950 font-extrabold rounded-md px-1' : 'text-slate-900'
                  }`}>
                    {item.unitRate ? formatCurrency(item.unitRate) : '-'}
                  </td>

                  {/* MRP (Highlighted if mismatch) */}
                  <td className={`py-3 px-4 text-right font-mono font-semibold ${
                    hasMrpMismatch ? 'bg-amber-200 text-amber-950 font-extrabold rounded-md px-1' : 'text-slate-700'
                  }`}>
                    {formatCurrency(item.invoiceMrp || item.grnMrp || (item.skuMaster ? item.skuMaster.mrp : 0))}
                  </td>

                  {/* Gross Amount */}
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">
                    {formatCurrency(grossAmount)}
                  </td>

                  {/* Match Status Badge */}
                  <td className="py-3 px-4 text-center">
                    {item.itemReasons.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-full shadow-2xs" title={item.itemReasons.join(', ')}>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> {item.itemReasons[0].replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
