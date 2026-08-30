'use client';

import React from 'react';

export type TabType = 'po' | 'fulfillment' | 'delivery' | 'summary';

interface TopTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  poCount: number;
  fulfillmentCount: number;
  deliveryCount: number;
  poNumber: string;
  onPoNumberChange: (poNum: string) => void;
  onUploadClick: () => void;
}

export const TopTabs: React.FC<TopTabsProps> = ({
  activeTab,
  onSelectTab,
  poCount,
  fulfillmentCount,
  deliveryCount,
  poNumber,
  onPoNumberChange,
  onUploadClick
}) => {
  const tabs = [
    { key: 'po', label: 'Purchase Order', count: poCount },
    { key: 'fulfillment', label: 'Fulfillment', count: fulfillmentCount },
    { key: 'delivery', label: 'Delivery', count: deliveryCount },
    { key: 'summary', label: 'Summary', count: null }
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-6 pt-4 flex flex-col gap-4 shrink-0 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Header Title + PO Picker */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Reconciliation Engine</span>
          </h1>
          
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PO:</span>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => onPoNumberChange(e.target.value)}
              placeholder="e.g. CI4PO05788"
              className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none w-36"
            />
          </div>
        </div>

        {/* Top Right Upload Action */}
        <button
          onClick={onUploadClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2"
        >
          <span>+ Upload Document</span>
        </button>
      </div>

      {/* Primary Tab Strip */}
      <div className="flex items-center gap-8 border-t border-slate-100 pt-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key as TabType)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all relative ${
                isActive
                  ? 'text-emerald-700 font-bold border-b-2 border-emerald-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
