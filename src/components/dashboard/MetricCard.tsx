import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'blue' | 'emerald' | 'amber' | 'purple';
  };
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  className,
}: MetricCardProps) {
  const badgeStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
  };

  const iconBgStyles = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const currentTheme = badge?.variant || 'blue';

  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-xl p-5 shadow-card transition-all hover:shadow-md hover:border-slate-300',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            iconBgStyles[currentTheme]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {badge && (
          <span
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
              badgeStyles[badge.variant]
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between gap-1">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'font-medium text-[11px]',
                trend.isPositive ? 'text-emerald-600' : 'text-slate-500'
              )}
            >
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
