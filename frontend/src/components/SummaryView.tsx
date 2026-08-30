'use client';

import React from 'react';
import { SummaryResult } from '../lib/types';
import { IndianRupee, FileCheck, Truck, CheckCircle2, AlertTriangle, AlertCircle, Info, ArrowUpRight } from 'lucide-react';

interface SummaryViewProps {
  summary: SummaryResult | null;
  loading?: boolean;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium animate-pulse flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Computing reconciliation financial statistics...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-12 text-center text-slate-400">
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
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
          </span>
        );
      case 'partially_matched':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> Partially Matched
          </span>
        );
      case 'mismatch':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-900 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full shadow-sm">
            <AlertCircle className="w-3.5 h-3.5" /> Hard Mismatch
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-800 bg-sky-100 border border-sky-300 px-3 py-1 rounded-full shadow-sm">
            <Info className="w-3.5 h-3.5" /> Insufficient Docs
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PO Amount Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 border-t-4 border-t-emerald-500 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PO Amount</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
                {formatCurrency(summary.poAmount)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <IndianRupee className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex justify-between items-center">
            <span>Total PO Units:</span>
            <span className="font-bold text-slate-900 font-mono">{summary.totalPoQty} units</span>
          </div>
        </div>

        {/* Total Invoiced Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 border-t-4 border-t-purple-500 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
                {formatCurrency(summary.totalInvoiced)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <FileCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex justify-between items-center">
            <span>Invoiced Units:</span>
            <span className="font-bold text-slate-900 font-mono">{summary.cumulativeInvoicedQty} units</span>
          </div>
        </div>

        {/* Total Received Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 border-t-4 border-t-blue-500 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Received</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
                {formatCurrency(summary.totalReceived)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium flex justify-between items-center">
            <span>Pending Delivery:</span>
            <span className={`font-bold font-mono ${summary.pendingDeliveryQty > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {summary.pendingDeliveryQty} units
            </span>
          </div>
        </div>
      </div>

      {/* Associated Invoice & GRN Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Associated Invoice & GRN Cumulative Summary</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Breakdown per document record and final cumulative status</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-3 py-1 rounded-lg font-mono">
            PO: {summary.poNumber}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-6">Document Type</th>
                <th className="py-3.5 px-6">Document Number</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-right">Invoiced Qty</th>
                <th className="py-3.5 px-6 text-right">Received Qty</th>
                <th className="py-3.5 px-6 text-right">Pending Delivery</th>
                <th className="py-3.5 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(summary.associatedDocs || []).map((row) => {
                const isFinalRow = row.docNumber === 'Current Status';

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isFinalRow
                        ? 'bg-slate-950 text-white font-bold'
                        : 'hover:bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                        row.docType === 'GRN'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : row.docType === 'Invoice'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-400 text-slate-950 font-black'
                      }`}>
                        {row.docType}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono font-bold">
                      {row.docNumber}
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-500">
                      {row.date}
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-bold">
                      {row.invoicedQty}
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-bold">
                      {row.receivedQty}
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-bold">
                      {row.pendingDeliveryQty !== undefined ? `${row.pendingDeliveryQty} units` : '-'}
                    </td>

                    <td className="py-4 px-6 text-center">
                      {isFinalRow ? (
                        getStatusBadge(summary.overallStatus)
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
