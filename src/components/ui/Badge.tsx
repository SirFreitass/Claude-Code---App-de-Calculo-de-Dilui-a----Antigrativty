import { clsx } from "clsx";
import { radius } from "@/lib/design-tokens";

export interface BadgeProps {
  children: React.ReactNode;
  bg?: string;
  text?: string;
  dot?: string;
  className?: string;
}

export function Badge({ children, bg, text, dot, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold",
        radius.badge,
        bg,
        text,
        className
      )}
    >
      {dot && (
        <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      )}
      {children}
    </span>
  );
}
