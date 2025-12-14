import React, { useState, useEffect } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface PDFViewerProps {
  url: string;
  className?: string;
  title?: string;
  autoAdvance?: boolean;
  onError?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  url, 
  className = '', 
  title = 'PDF Document',
  autoAdvance = false,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      setTimeout(onError, 2000); // Auto-advance after 2 seconds if callback provided
    }
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Try iframe first (best compatibility) - Show only first page, no scrolling
  if (!hasError) {
    return (
      <div className={`w-full h-full relative bg-white overflow-hidden ${className}`} style={{ overflow: 'hidden' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600 text-sm">Loading PDF...</p>
            </div>
          </div>
        )}
        <div className="w-full h-full overflow-hidden" style={{ overflow: 'hidden', position: 'relative' }}>
          <iframe
            src={`${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full border-0"
            title={title}
            onLoad={handleLoad}
            onError={handleError}
            style={{ 
              display: isLoading ? 'none' : 'block',
              overflow: 'hidden',
              pointerEvents: 'none',
              height: '100%',
              width: '100%'
            }}
            scrolling="no"
          />
        </div>
        {/* Fallback: Try object tag if iframe fails */}
        <object
          data={`${url}#page=1&view=FitH`}
          type="application/pdf"
          className="w-full h-full hidden"
          onError={handleError}
          aria-label={title}
          style={{ overflow: 'hidden' }}
        >
          {hasError && (
            <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Cannot display PDF inline</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                Your browser may not support embedded PDFs. You can view it externally.
              </p>
              <Button variant="secondary" onClick={handleOpenExternal}>
                <Download className="w-4 h-4 mr-2" />
                Download / View PDF
              </Button>
            </div>
          )}
        </object>
      </div>
    );
  }

  // Error fallback UI
  return (
    <div className={`flex flex-col items-center justify-center h-full w-full bg-slate-50 p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">Cannot display PDF</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
        The PDF could not be loaded. {autoAdvance && 'Advancing to next item...'}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleOpenExternal}>
          <Download className="w-4 h-4 mr-2" />
          Open PDF
        </Button>
        {onError && (
          <Button variant="secondary" onClick={onError}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Skip
          </Button>
        )}
      </div>
    </div>
  );
};
