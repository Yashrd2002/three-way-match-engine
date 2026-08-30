'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface MismatchBannerProps {
  status: string;
  reasons: string[];
}

export const MismatchBanner: React.FC<MismatchBannerProps> = ({ status, reasons }) => {
  if (status === 'matched' && reasons.length === 0) {
    return (
      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Three-Way Match Fully Reconciled</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              All quantities, prices, MRPs, and dates match across Purchase Order, GRN, and Invoice.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full">
          Matched
        </span>
      </div>
    );
  }

  if (status === 'insufficient_documents') {
    return (
      <div className="bg-sky-50 border-l-4 border-sky-500 p-4 rounded-r-lg shadow-sm mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-sky-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-sky-900">Awaiting Document Completion</h4>
            <p className="text-xs text-sky-700 mt-0.5">
              Full document set (PO + GRN + Invoice) is not yet available for complete reconciliation.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider bg-sky-200 text-sky-800 px-2.5 py-1 rounded-full">
          Pending Docs
        </span>
      </div>
    );
  }

  const isHardMismatch = status === 'mismatch';
  const bgColor = isHardMismatch ? 'bg-amber-50' : 'bg-orange-50';
  const borderColor = isHardMismatch ? 'border-amber-500' : 'border-orange-400';
  const titleColor = isHardMismatch ? 'text-amber-900' : 'text-orange-900';
  const textColor = isHardMismatch ? 'text-amber-800' : 'text-orange-800';

  const formatReason = (reason: string) => {
    switch (reason) {
      case 'grn_qty_exceeds_po_qty': return 'Received GRN quantity exceeds PO quantity';
      case 'invoice_qty_exceeds_grn_qty': return 'Invoiced quantity exceeds received GRN quantity';
      case 'invoice_qty_exceeds_po_qty': return 'Invoiced quantity exceeds PO quantity';
      case 'invoice_date_after_po_date': return 'Invoice date is after PO date';
      case 'duplicate_po': return 'Duplicate PO uploaded for same PO number';
      case 'duplicate_document': return 'Duplicate document number detected';
      case 'item_missing_in_po': return 'Item present on GRN/Invoice is missing from PO';
      case 'price_mismatch': return 'Invoice unit price differs from SKU Master agreed rate (> 5%)';
      case 'mrp_mismatch': return 'Invoice/GRN MRP differs from SKU Master MRP';
      case 'unmapped_master_sku': return 'Item could not be resolved to SKU Master catalog';
      default: return reason.replace(/_/g, ' ');
    }
  };

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-4 rounded-r-lg shadow-sm mb-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {isHardMismatch ? (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className={`text-sm font-bold ${titleColor}`}>
              {isHardMismatch ? 'Discrepancy / Mismatch Banner' : 'Partial Match / Soft Warnings Detected'}
            </h4>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {reasons.map((r, i) => (
                <span
                  key={i}
                  className={`text-xs px-2.5 py-0.5 rounded font-semibold border ${
                    isHardMismatch
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-orange-100 text-orange-900 border-orange-200'
                  }`}
                >
                  ⚠️ {formatReason(r)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <span
          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            isHardMismatch
              ? 'bg-amber-200 text-amber-900'
              : 'bg-orange-200 text-orange-900'
          }`}
        >
          {status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};
