import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-12 h-12 bg-[rgba(244,107,107,0.14)] rounded-full flex items-center justify-center border border-[rgba(244,107,107,0.22)]">
        <AlertTriangle size={24} className="text-[#FFABAB]" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-[#F3F4F4]">Something went wrong</p>
        <p className="text-sm text-[rgba(243,244,244,0.58)] mt-1">{message || 'Failed to load data from server.'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="action-button flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
