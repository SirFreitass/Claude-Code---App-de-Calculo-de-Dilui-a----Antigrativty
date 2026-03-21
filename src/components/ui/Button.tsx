import { forwardRef } from "react";
import { clsx } from "clsx";
import {
  buttonVariants,
  buttonSizes,
  radius,
  type ButtonVariant,
  type ButtonSize,
} from "@/lib/design-tokens";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      loading,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-[0.98]",
          radius.button,
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
