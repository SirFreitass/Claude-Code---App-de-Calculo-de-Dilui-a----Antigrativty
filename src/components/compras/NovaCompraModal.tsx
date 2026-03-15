"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  ShoppingCart,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import { precoMedioPonderado, custoTotalCompra } from "@/types";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface NovaCompraModalProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────

interface CompraForm {
  produtoId: string;
  precoUnitario: string;
  quantidade: string;
  fornecedor: string;
  notaFiscal: string;
  data: string;
}

const INITIAL_FORM: CompraForm = {
  produtoId: "",
  precoUnitario: "",
  quantidade: "",
  fornecedor: "",
  notaFiscal: "",
  data: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
};

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

export function NovaCompraModal({ open, onClose }: NovaCompraModalProps) {
  const { produtos, compras, estoques, addCompra } = useApp();

  const [form, setForm] = useState<CompraForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CompraForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setForm({ ...INITIAL_FORM, data: new Date().toISOString().slice(0, 10) });
      setErrors({});
      setSubmitted(false);
    }
  }, [open]);

  // ── Dados derivados ──
  const produtoSelecionado = useMemo(
    () => produtos.find((p) => p.id === form.produtoId) ?? null,
    [produtos, form.produtoId]
  );

  const estoqueAtual = useMemo(
    () => (form.produtoId ? estoques.find((e) => e.produtoId === form.produtoId)?.quantidadeAtual ?? 0 : 0),
    [estoques, form.produtoId]
  );

  const mediaAnterior = useMemo(() => {
    if (!form.produtoId) return null;
    const pCompras = compras.filter((c) => c.produtoId === form.produtoId);
    return precoMedioPonderado(pCompras);
  }, [compras, form.produtoId]);

  const precoNum = parseFloat(form.precoUnitario) || 0;
  const qtdNum = parseFloat(form.quantidade) || 0;
  const totalCompra = precoNum * qtdNum;

  const tendencia = useMemo(() => {
    if (!mediaAnterior || precoNum <= 0) return null;
    const diff = ((precoNum - mediaAnterior) / mediaAnterior) * 100;
    if (Math.abs(diff) < 0.5) return { tipo: "equal" as const, percent: diff };
    return { tipo: diff > 0 ? "up" as const : "down" as const, percent: diff };
  }, [mediaAnterior, precoNum]);

  // ── Handlers ──
  function update(field: keyof CompraForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};

    if (!form.produtoId) errs.produtoId = "Selecione um produto.";
    if (precoNum <= 0) errs.precoUnitario = "Informe o preço unitário.";
    if (qtdNum <= 0) errs.quantidade = "Informe a quantidade.";
    if (!form.fornecedor.trim()) errs.fornecedor = "Informe o fornecedor.";
    if (!form.data) errs.data = "Informe a data.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    addCompra({
      produtoId: form.produtoId,
      precoUnitario: precoNum,
      quantidade: qtdNum,
      fornecedor: form.fornecedor.trim(),
      data: new Date(form.data + "T12:00:00Z").toISOString(),
      ...(form.notaFiscal.trim() ? { notaFiscal: form.notaFiscal.trim() } : {}),
    });

    setSubmitted(true);
    setTimeout(() => onClose(), 1200);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50">
              <ShoppingCart className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Nova Compra</h2>
              <p className="text-xs text-gray-400">Registre a entrada de mercadoria</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sucesso */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-gray-900">Compra registrada!</p>
            <p className="text-sm text-gray-500">
              +{qtdNum} {produtoSelecionado?.unidade} adicionados ao estoque
            </p>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-5">

            {/* Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Produto *
              </label>
              <div className="relative">
                <select
                  value={form.produtoId}
                  onChange={(e) => update("produtoId", e.target.value)}
                  className={clsx(
                    "w-full appearance-none px-4 py-2.5 pr-10 border rounded-xl text-sm transition",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                    errors.produtoId ? "border-red-300 bg-red-50/50" : "border-gray-200 bg-white"
                  )}
                >
                  <option value="">Selecione...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {p.marca} ({p.unidade})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.produtoId && <FieldError msg={errors.produtoId} />}
              {produtoSelecionado && (
                <p className="text-xs text-gray-400 mt-1">
                  Estoque atual: <span className="font-semibold">{estoqueAtual} {produtoSelecionado.unidade}</span>
                  {mediaAnterior !== null && (
                    <> · Preço médio: <span className="font-semibold">R$ {mediaAnterior.toFixed(2)}/{produtoSelecionado.unidade}</span></>
                  )}
                </p>
              )}
            </div>

            {/* Preço + Quantidade (side by side) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Preço Unitário (R$) *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={form.precoUnitario}
                  onChange={(e) => update("precoUnitario", e.target.value)}
                  placeholder="28.90"
                  className={clsx(
                    "w-full px-4 py-2.5 border rounded-xl text-sm transition",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    errors.precoUnitario ? "border-red-300 bg-red-50/50" : "border-gray-200"
                  )}
                />
                {errors.precoUnitario && <FieldError msg={errors.precoUnitario} />}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantidade ({produtoSelecionado?.unidade ?? "un"}) *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="0.1"
                  value={form.quantidade}
                  onChange={(e) => update("quantidade", e.target.value)}
                  placeholder="5"
                  className={clsx(
                    "w-full px-4 py-2.5 border rounded-xl text-sm transition",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    errors.quantidade ? "border-red-300 bg-red-50/50" : "border-gray-200"
                  )}
                />
                {errors.quantidade && <FieldError msg={errors.quantidade} />}
              </div>
            </div>

            {/* Preview: total + tendência */}
            {precoNum > 0 && qtdNum > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Total desta compra</p>
                  <p className="text-lg font-black text-gray-900">
                    R$ {totalCompra.toFixed(2)}
                  </p>
                </div>
                {tendencia && (
                  <div className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                    tendencia.tipo === "up" && "bg-red-100",
                    tendencia.tipo === "down" && "bg-emerald-100",
                    tendencia.tipo === "equal" && "bg-gray-200",
                  )}>
                    {tendencia.tipo === "up" && <TrendingUp className="w-4 h-4 text-red-600" />}
                    {tendencia.tipo === "down" && <TrendingDown className="w-4 h-4 text-emerald-600" />}
                    {tendencia.tipo === "equal" && <Minus className="w-4 h-4 text-gray-500" />}
                    <div className="text-right">
                      <p className={clsx(
                        "text-xs font-bold",
                        tendencia.tipo === "up" && "text-red-700",
                        tendencia.tipo === "down" && "text-emerald-700",
                        tendencia.tipo === "equal" && "text-gray-600",
                      )}>
                        {tendencia.percent > 0 ? "+" : ""}{tendencia.percent.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-gray-400">vs. média</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fornecedor + NF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fornecedor *
              </label>
              <input
                type="text"
                value={form.fornecedor}
                onChange={(e) => update("fornecedor", e.target.value)}
                placeholder="Nome do fornecedor"
                className={clsx(
                  "w-full px-4 py-2.5 border rounded-xl text-sm transition",
                  "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                  errors.fornecedor ? "border-red-300 bg-red-50/50" : "border-gray-200"
                )}
              />
              {errors.fornecedor && <FieldError msg={errors.fornecedor} />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nota Fiscal
                </label>
                <input
                  type="text"
                  value={form.notaFiscal}
                  onChange={(e) => update("notaFiscal", e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Data *
                </label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => update("data", e.target.value)}
                  className={clsx(
                    "w-full px-4 py-2.5 border rounded-xl text-sm transition",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                    errors.data ? "border-red-300 bg-red-50/50" : "border-gray-200"
                  )}
                />
                {errors.data && <FieldError msg={errors.data} />}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-sm"
              >
                Registrar Compra
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}
