import { AlertCircle, ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

interface DemoBannerProps {
  className?: string;
}

export function DemoModeBanner({ className }: DemoBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        'bg-amber-50 border border-amber-200/90 text-amber-900 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded-md bg-amber-100/80 text-amber-700 flex-shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold tracking-wide uppercase text-[11px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded mr-2">
            Demo Mode Active
          </span>
          <span className="text-amber-800">
            Simulated demonstration data is active. The backend is not connected and no real mutations are made.
          </span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-700 hover:text-amber-900 p-1 rounded-md hover:bg-amber-100 transition-colors ml-3 cursor-pointer"
        title="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface AlertBoxProps {
  title: string;
  message: string;
  variant?: 'info' | 'warning' | 'danger';
}

export function AlertBox({ title, message, variant = 'info' }: AlertBoxProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    danger: 'bg-rose-50 border-rose-200 text-rose-900',
  };

  return (
    <div className={cn('p-4 rounded-xl border flex items-start gap-3 text-xs', styles[variant])}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-0.5 opacity-90">{message}</div>
      </div>
    </div>
  );
}
