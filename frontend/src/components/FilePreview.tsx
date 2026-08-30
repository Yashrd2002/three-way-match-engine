'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FileText, ExternalLink } from 'lucide-react';

interface FilePreviewProps {
  fileUrl?: string;
  filename?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, filename }) => {
  const [zoom, setZoom] = useState<number>(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Zoom Bar */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={filename || 'Document Preview'}>
            {filename || 'Original Document'}
          </span>
        </div>

        {fileUrl && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-300 rounded text-xs">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-slate-100 text-slate-600 border-r border-slate-200"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold text-slate-700">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-slate-100 text-slate-600 border-l border-slate-200"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-slate-200 text-slate-600 rounded bg-slate-100"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 hover:bg-slate-200 text-slate-600 rounded bg-slate-100"
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Main Viewport */}
      <div className="flex-1 bg-slate-900/5 p-4 overflow-auto flex items-center justify-center min-h-[350px]">
        {fileUrl ? (
          <div
            className="transition-transform origin-top duration-200 shadow-md bg-white rounded overflow-hidden w-full h-full flex justify-center"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <iframe
              src={fileUrl}
              className="w-full h-[400px] border-none"
              title="Document Viewer"
            />
          </div>
        ) : (
          <div className="text-center p-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-semibold">Document File Preview</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Select or upload a document to view original PDF/Image file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
