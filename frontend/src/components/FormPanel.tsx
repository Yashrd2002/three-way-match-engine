'use client';

import React from 'react';

interface FormField {
  label: string;
  value?: string | number;
}

interface FormSection {
  title?: string;
  accentColor?: string;
  fields: FormField[];
}

interface FormPanelProps {
  title: string;
  sections: FormSection[];
  accentColor?: string;
}

export const FormPanel: React.FC<FormPanelProps> = ({
  title,
  sections,
  accentColor = 'border-emerald-500'
}) => {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full border-l-4 ${accentColor}`}>
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Read Only</span>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[420px]">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            {section.title && (
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
                {section.title}
              </h4>
            )}

            <div className="grid grid-cols-2 gap-3">
              {section.fields.map((field, fIdx) => (
                <div key={fIdx} className="bg-slate-50/70 p-2.5 rounded border border-slate-100">
                  <span className="block text-[11px] font-medium text-slate-500">{field.label}</span>
                  <span className="block text-xs font-bold text-slate-800 mt-0.5 truncate" title={String(field.value || '-')}>
                    {field.value !== undefined && field.value !== '' ? String(field.value) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
