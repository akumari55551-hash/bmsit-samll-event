import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/80 rounded-xl shadow-card transition-shadow hover:shadow-md overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className,
  ...props
}: CardHeaderProps) {
  if (children) {
    return (
      <div
        className={cn('px-5 py-4 border-b border-slate-100 flex items-center justify-between', className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn('px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4', className)}
      {...props}
    >
      <div>
        {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500', className)}
      {...props}
    >
      {children}
    </div>
  );
}
