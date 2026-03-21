import { clsx } from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";
import { radius } from "@/lib/design-tokens";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  sub?: string;
  trend?: { value: number; label: string };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-brand-600",
  iconBg = "bg-brand-50",
  sub,
  trend,
}: StatCardProps) {
  const up = trend && trend.value >= 0;

  return (
    <div
      className={clsx(
        "bg-white border border-gray-200 p-5 flex flex-col gap-4 shadow-sm",
        radius.card
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={clsx(
            "flex items-center justify-center w-11 h-11",
            radius.icon,
            iconBg
          )}
        >
          <Icon className={clsx("w-5 h-5", iconColor)} />
        </div>
        {trend && (
          <span
            className={clsx(
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              up
                ? "text-emerald-700 bg-emerald-50"
                : "text-red-600 bg-red-50"
            )}
          >
            {up ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{title}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend && (
          <p className="text-xs text-gray-400 mt-1">{trend.label}</p>
        )}
      </div>
    </div>
  );
}
