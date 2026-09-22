import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface ReconnectBannerProps {
  onRetry: () => void;
}

export const ReconnectBanner: React.FC<ReconnectBannerProps> = ({ onRetry }) => {
  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-rose-600 text-white px-4 py-2 text-xs font-mono flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-pulse" />
        <span className="font-bold">CONNECTION INTERRUPTED</span>
        <span className="hidden sm:inline text-rose-200">• Reconnecting to authoritative server...</span>
      </div>
      <button
        onClick={onRetry}
        className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition"
      >
        <RefreshCw className="w-3 h-3" />
        RETRY SYNC
      </button>
    </div>
  );
};
