import { statusTokens, type StatusEstoque } from "@/lib/design-tokens";
import { Badge } from "./Badge";

export interface StatusBadgeProps {
  status: StatusEstoque;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const token = statusTokens[status];
  return (
    <Badge bg={token.bg} text={token.text} dot={token.dot} className={className}>
      {token.label}
    </Badge>
  );
}
