import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from './Button';

interface PDFViewerProps {
  url: string;
  className?: string;
  title?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, className = '', title = 'PDF Document' }) => {
  return (
    <object
      data={url}
      type="application/pdf"
      className={`w-full h-full bg-white ${className}`}
      aria-label={title}
    >
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 p-8 text-center border border-slate-100 rounded-xl">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Cannot display PDF inline</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
          Your browser may not support embedded PDFs. You can view it externally.
        </p>
        <Button variant="secondary" onClick={() => window.open(url, '_blank')}>
          <Download className="w-4 h-4 mr-2" />
          Download / View PDF
        </Button>
      </div>
    </object>
  );
};
