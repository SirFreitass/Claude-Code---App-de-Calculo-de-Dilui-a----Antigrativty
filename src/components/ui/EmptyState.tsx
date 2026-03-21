import { clsx } from "clsx";
import { radius } from "@/lib/design-tokens";

export interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div
        className={clsx(
          "flex items-center justify-center w-12 h-12 bg-gray-100",
          radius.card
        )}
      >
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      {action}
    </div>
  );
}
