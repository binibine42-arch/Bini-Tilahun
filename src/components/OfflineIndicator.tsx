import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-amber-400/40 bg-[#15130C] px-4 py-3 text-sm font-medium text-amber-200 shadow-lg sm:left-6 sm:right-auto"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
      <span>
        Offline Mode — Contact details and cached portfolio remain available.
      </span>
    </div>
  );
};
