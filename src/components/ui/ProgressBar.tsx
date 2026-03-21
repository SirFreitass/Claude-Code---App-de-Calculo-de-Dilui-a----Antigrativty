import { clsx } from "clsx";
import { radius } from "@/lib/design-tokens";

export interface ProgressBarProps {
  /** Value between 0 and 100 */
  value: number;
  /** Tailwind bg class for the filled portion */
  color?: string;
  /** Height class (default: h-2) */
  height?: string;
  className?: string;
}

export function ProgressBar({
  value,
  color = "bg-brand-500",
  height = "h-2",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={clsx(
        "bg-gray-100 overflow-hidden",
        radius.progress,
        height,
        className
      )}
    >
      <div
        className={clsx(
          "h-full transition-all duration-700",
          radius.progress,
          color
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
