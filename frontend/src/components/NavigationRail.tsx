'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Upload, RefreshCw, LogOut, ShieldCheck } from 'lucide-react';

interface NavigationRailProps {
  onSeed?: () => void;
  isSeeding?: boolean;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({ onSeed, isSeeding }) => {
  const pathname = usePathname();

  return (
    <aside className="w-16 bg-slate-900 text-slate-300 flex flex-col items-center py-4 justify-between min-h-screen border-r border-slate-800 shrink-0">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Brand Logo */}
        <Link href="/" className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
          3M
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2 w-full px-2">
          <Link
            href="/"
            title="3-Way Match Dashboard"
            className={`p-3 rounded-lg flex justify-center items-center transition-colors ${
              pathname === '/' ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </Link>

          <Link
            href="/skus"
            title="SKU Master Catalogue"
            className={`p-3 rounded-lg flex justify-center items-center transition-colors ${
              pathname === '/skus' ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-5 h-5" />
          </Link>

          <Link
            href="/upload"
            title="Upload Document"
            className={`p-3 rounded-lg flex justify-center items-center transition-colors ${
              pathname === '/upload' ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-5 h-5" />
          </Link>
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {onSeed && (
          <button
            onClick={onSeed}
            disabled={isSeeding}
            title="Seed Sample Data"
            className="p-3 rounded-lg text-amber-400 hover:bg-amber-400/10 transition-colors flex justify-center items-center relative group"
          >
            <RefreshCw className={`w-5 h-5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span className="absolute left-16 bg-slate-900 text-amber-400 text-xs px-2 py-1 rounded border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Seed Sample Docs
            </span>
          </button>
        )}

        <div className="p-3 text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-500/60" />
        </div>
      </div>
    </aside>
  );
};
