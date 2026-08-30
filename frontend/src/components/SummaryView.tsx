'use client';

import React from 'react';
import { SummaryResult } from '../lib/types';
import { IndianRupee, FileCheck, Truck, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface SummaryViewProps {
  summary: SummaryResult | null;
  loading?: boolean;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Computing summary reconciliation statistics...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-400">
        No summary metrics available. Please specify a valid PO Number.
      </div>
    );
  }

  const formatCurrency = (val?: number) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0.00';
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
          </span>
        );
      case 'partially_matched':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-800 bg-orange-100 px-3 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" /> Partially Matched
          </span>
        );
      case 'mismatch':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200 px-3 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> Hard Mismatch
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 bg-sky-100 px-3 py-1 rounded-full">
            <Info className="w-3.5 h-3.5" /> Insufficient Docs
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PO Amount Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">PO Amount</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(summary.poAmount)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold flex justify-between">
            <span>Total PO Qty:</span>
            <span className="font-bold text-slate-900">{summary.totalPoQty} units</span>
          </div>
        </div>

        {/* Total Invoiced Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Invoiced</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(summary.totalInvoiced)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold flex justify-between">
            <span>Invoiced Qty:</span>
            <span className="font-bold text-slate-900">{summary.cumulativeInvoicedQty} units</span>
          </div>
        </div>

        {/* Total Received Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Received</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(summary.totalReceived)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold flex justify-between">
            <span>Pending Delivery:</span>
            <span className={`font-bold ${summary.pendingDeliveryQty > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {summary.pendingDeliveryQty} units
            </span>
          </div>
        </div>
      </div>

      {/* Associated Invoice & GRN Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Associated Invoice & GRN Cumulative Summary</h3>
          <span className="text-xs font-semibold text-slate-500">PO: {summary.poNumber}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                <th className="py-3 px-6">Document Type</th>
                <th className="py-3 px-6">Document Number</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6 text-right">Invoiced Qty</th>
                <th className="py-3 px-6 text-right">Received Qty</th>
                <th className="py-3 px-6 text-right">Pending Delivery</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(summary.associatedDocs || []).map((row) => {
                const isFinalRow = row.docNumber === 'Current Status';

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isFinalRow ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        row.docType === 'GRN'
                          ? 'bg-indigo-100 text-indigo-800'
                          : row.docType === 'Invoice'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-500 text-slate-950 font-black'
                      }`}>
                        {row.docType}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 font-mono font-bold">
                      {row.docNumber}
                    </td>

                    <td className="py-3.5 px-6 font-medium">
                      {row.date}
                    </td>

                    <td className="py-3.5 px-6 text-right font-semibold">
                      {row.invoicedQty}
                    </td>

                    <td className="py-3.5 px-6 text-right font-semibold">
                      {row.receivedQty}
                    </td>

                    <td className="py-3.5 px-6 text-right font-semibold">
                      {row.pendingDeliveryQty !== undefined ? row.pendingDeliveryQty : '-'}
                    </td>

                    <td className="py-3.5 px-6 text-center">
                      {isFinalRow ? (
                        getStatusBadge(summary.overallStatus)
                      ) : (
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {row.status}
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
    </div>
  );
};
