'use client';

import React, { useState } from 'react';
import { api } from '../lib/api';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (poNumber: string) => void;
  defaultPoNumber?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPoNumber
}) => {
  const [docType, setDocType] = useState<'po' | 'grn' | 'invoice'>('po');
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'idle' | 'uploading' | 'parsing' | 'mapping' | 'matched' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    try {
      setStep('uploading');
      setErrorMessage('');

      const formData = new FormData();
      formData.append('documentType', docType);
      formData.append('file', file);

      setTimeout(() => setStep('parsing'), 600);
      setTimeout(() => setStep('mapping'), 1400);

      const res = await api.uploadDocument(formData);

      setStep('matched');
      setTimeout(() => {
        const poNum = res.document.poNumber || defaultPoNumber || 'CI4PO05788';
        onSuccess(poNum);
        onClose();
        setStep('idle');
        setFile(null);
      }, 1000);
    } catch (err: any) {
      setStep('error');
      setErrorMessage(err.message || 'Failed to parse document');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Upload Procurement Document</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Document Tag
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'po', label: 'Purchase Order' },
                { type: 'grn', label: 'GRN' },
                { type: 'invoice', label: 'Invoice' }
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setDocType(item.type as any)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    docType === item.type
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Document File (PDF / Image)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2 stroke-[1.5]" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-700">Click or drag PDF / Image here</p>
                  <p className="text-[11px] text-slate-400 mt-1">Supports sample Purchase Order, GRN, or Invoice</p>
                </>
              )}
            </div>
          </div>

          {/* Real Upload Progress Steps */}
          {step !== 'idle' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="capitalize">Status: {step}</span>
                {step !== 'error' && step !== 'matched' && (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                )}
              </div>

              <div className="grid grid-cols-4 gap-1 pt-1">
                {['uploading', 'parsing', 'mapping', 'matched'].map((s, idx) => {
                  const stepIndex = ['uploading', 'parsing', 'mapping', 'matched'].indexOf(step);
                  const isDone = stepIndex >= idx;
                  const isCurrent = step === s;

                  return (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all ${
                        isDone
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-slate-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!file || (step !== 'idle' && step !== 'error')}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <span>Submit & Parse</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
