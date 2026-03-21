import { clsx } from "clsx";
import { radius, spacing } from "@/lib/design-tokens";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  border?: string;
  noPadding?: boolean;
}

export function Card({
  children,
  className,
  border = "border-gray-200",
  noPadding,
}: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white border shadow-sm overflow-hidden",
        radius.card,
        border,
        !noPadding && spacing.card,
        className
      )}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  iconBg = "bg-brand-50",
  action,
}: CardHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-3 border-b border-gray-100",
        spacing.cardHeader
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={clsx(
              "flex items-center justify-center w-8 h-8",
              radius.icon,
              iconBg
            )}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
