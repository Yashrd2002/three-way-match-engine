'use client';

import React from 'react';

interface DocumentPill {
  id: string;
  label: string;
  sublabel?: string;
}

interface SubTabPillsProps {
  pills: DocumentPill[];
  activeId: string;
  onSelectPill: (id: string) => void;
}

export const SubTabPills: React.FC<SubTabPillsProps> = ({
  pills,
  activeId,
  onSelectPill
}) => {
  if (!pills || pills.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
      {pills.map((pill) => {
        const isActive = activeId === pill.id;
        return (
          <button
            key={pill.id}
            onClick={() => onSelectPill(pill.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all ${
              isActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>{pill.label}</span>
            {pill.sublabel && (
              <span className={`text-[10px] uppercase tracking-wider ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                ({pill.sublabel})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
