/**
 * Design Tokens — Dona Help Hub de Suprimentos
 *
 * Single source of truth para todas as constantes visuais do app.
 * Importar daqui em vez de redefinir STATUS_CFG, NIVEL_CFG etc. inline.
 */

import type { TipoDiluicao } from "@/types";

// ─────────────────────────────────────────────
// Status de Estoque
// ─────────────────────────────────────────────

export type StatusEstoque = "ok" | "baixo" | "critico" | "zerado";

export const statusTokens: Record<
  StatusEstoque,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    border: string;
    cardBorder: string;
    icon: string;
    progressBar: string;
  }
> = {
  ok: {
    label: "OK",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
    cardBorder: "border-gray-200",
    icon: "text-emerald-500",
    progressBar: "bg-emerald-500",
  },
  baixo: {
    label: "Baixo",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
    cardBorder: "border-amber-300",
    icon: "text-amber-500",
    progressBar: "bg-amber-500",
  },
  critico: {
    label: "Crítico",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    border: "border-orange-200",
    cardBorder: "border-orange-300",
    icon: "text-orange-500",
    progressBar: "bg-orange-500",
  },
  zerado: {
    label: "Sem estoque",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
    cardBorder: "border-red-300",
    icon: "text-red-500",
    progressBar: "bg-red-500",
  },
};

// ─────────────────────────────────────────────
// Níveis de Diluição
// ─────────────────────────────────────────────

export const dilutionTokens: Record<
  TipoDiluicao,
  {
    label: string;
    descricao: string;
    color: string;
    bgActive: string;
    bgIdle: string;
    border: string;
    ring: string;
    dot: string;
    resultBadge: string;
    epiLevel: "none" | "basic" | "full";
    epiMessage: string;
  }
> = {
  Leve: {
    label: "Leve",
    descricao: "Manutenção diária",
    color: "text-emerald-700",
    bgActive: "bg-emerald-50",
    bgIdle: "bg-white",
    border: "border-emerald-300",
    ring: "ring-4 ring-emerald-500/30",
    dot: "bg-emerald-500",
    resultBadge: "bg-emerald-500/20 text-emerald-400",
    epiLevel: "none",
    epiMessage: "",
  },
  Media: {
    label: "Média",
    descricao: "Limpeza de rotina",
    color: "text-amber-700",
    bgActive: "bg-amber-50",
    bgIdle: "bg-white",
    border: "border-amber-300",
    ring: "ring-4 ring-amber-500/30",
    dot: "bg-amber-500",
    resultBadge: "bg-amber-500/20 text-amber-400",
    epiLevel: "basic",
    epiMessage: "Recomendado: use luvas de borracha durante o preparo.",
  },
  Pesada: {
    label: "Pesada",
    descricao: "Sujidade intensa",
    color: "text-red-700",
    bgActive: "bg-red-50",
    bgIdle: "bg-white",
    border: "border-red-300",
    ring: "ring-4 ring-red-500/30",
    dot: "bg-red-500",
    resultBadge: "bg-red-500/20 text-red-400",
    epiLevel: "full",
    epiMessage:
      "OBRIGATÓRIO: Luvas, óculos de proteção e ambiente bem ventilado.",
  },
};

// ─────────────────────────────────────────────
// Spacing Presets
// ─────────────────────────────────────────────

export const spacing = {
  /** Padding da área de conteúdo principal */
  page: "p-4 sm:p-6 lg:p-8",
  /** Gap entre seções de uma página */
  sectionGap: "gap-6",
  /** Padding interno de cards */
  card: "p-5",
  /** Padding do header de cards */
  cardHeader: "px-5 py-4",
  /** Gap entre cards em grids */
  cardGap: "gap-3",
} as const;

// ─────────────────────────────────────────────
// Border Radius Presets
// ─────────────────────────────────────────────

export const radius = {
  button: "rounded-xl",
  card: "rounded-2xl",
  badge: "rounded-full",
  input: "rounded-xl",
  icon: "rounded-lg",
  progress: "rounded-full",
} as const;

// ─────────────────────────────────────────────
// Typography Presets
// ─────────────────────────────────────────────

export const typography = {
  display: "text-2xl font-bold text-gray-900",
  heading: "text-lg font-semibold text-gray-900",
  subheading: "text-base font-semibold text-gray-900",
  body: "text-sm text-gray-700",
  caption: "text-xs font-medium text-gray-500",
  micro: "text-[11px] font-medium text-gray-400",
  overline: "text-[10px] font-semibold uppercase tracking-widest text-gray-500",
  /** Números grandes (métricas, KPIs) */
  metric: "text-2xl font-bold text-gray-900",
  metricLarge: "text-3xl sm:text-4xl font-black text-white tracking-tight",
} as const;

// ─────────────────────────────────────────────
// Button Variants
// ─────────────────────────────────────────────

export const buttonVariants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secondary:
    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
  ghost:
    "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm",
} as const;

export const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-sm",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;
