"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Pencil,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface EditarCompraModalProps {
  compraId: string | null;
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function StyledInput({
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <>
      <input
        {...props}
        className={clsx(
          "w-full px-3 py-2.5 rounded-lg border text-sm bg-white",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition",
          error ? "border-red-300 bg-red-50/50" : "border-gray-200",
          className
        )}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────

export function EditarCompraModal({ compraId, open, onClose }: EditarCompraModalProps) {
  const { compras, produtos, estoques, updateCompra } = useApp();

  const [precoUnitario, setPrecoUnitario] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const compra = compras.find((c) => c.id === compraId);
  const produto = compra ? produtos.find((p) => p.id === compra.produtoId) : null;
  const estoque = compra ? estoques.find((e) => e.produtoId === compra.produtoId) : null;

  // Pré-popular ao abrir
  useEffect(() => {
    if (!open || !compra) return;
    setPrecoUnitario(String(compra.precoUnitario));
    setQuantidade(String(compra.quantidade));
    setFornecedor(compra.fornecedor);
    setNotaFiscal(compra.notaFiscal || "");
    setErrors({});
  }, [open, compraId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  // Preview de impacto
  const qtdNum = parseFloat(quantidade) || 0;
  const qtdOriginal = compra?.quantidade ?? 0;
  const diff = qtdNum - qtdOriginal;
  const saldoAtual = estoque?.quantidadeAtual ?? 0;
  const novoSaldo = +(saldoAtual + diff).toFixed(4);
  const saldoNegativo = novoSaldo < 0;

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const p = parseFloat(precoUnitario);
    const q = parseFloat(quantidade);
    if (!precoUnitario || isNaN(p) || p <= 0) errs.precoUnitario = "Informe um preço válido";
    if (!quantidade || isNaN(q) || q <= 0) errs.quantidade = "Informe uma quantidade válida";
    if (!fornecedor.trim()) errs.fornecedor = "Informe o fornecedor";
    if (saldoNegativo) errs.quantidade = `Estoque ficaria negativo (${novoSaldo} ${produto?.unidade})`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [precoUnitario, quantidade, fornecedor, saldoNegativo, novoSaldo, produto?.unidade]);

  const handleSubmit = () => {
    if (!validate() || !compraId) return;
    updateCompra({
      id: compraId,
      precoUnitario: parseFloat(precoUnitario),
      quantidade: parseFloat(quantidade),
      fornecedor: fornecedor.trim(),
      notaFiscal: notaFiscal.trim() || undefined,
    });
    onClose();
  };

  if (!open || !compra || !produto) return null;

  const errorCount = Object.keys(errors).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] animate-slide-up-fade" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-brand-50/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-100">
              <Pencil className="w-4 h-4 text-brand-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Editar Compra</h2>
              <p className="text-xs text-gray-500">
                {produto.nome} — {new Date(compra.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {errorCount > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs font-semibold text-red-700">{errorCount} campo{errorCount > 1 ? "s" : ""} com erro</p>
            </div>
          )}

          {/* Preview de impacto no estoque */}
          <div className={clsx(
            "rounded-xl border p-4",
            saldoNegativo ? "bg-red-50 border-red-200" : diff !== 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
          )}>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Impacto no Estoque</p>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-black text-gray-900">{saldoAtual}</p>
                <p className="text-[10px] text-gray-500">{produto.unidade} atual</p>
              </div>
              <div className="flex items-center gap-1">
                {diff > 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : diff < 0 ? <TrendingDown className="w-4 h-4 text-red-500" /> : <span className="text-gray-300">→</span>}
                <span className={clsx("text-xs font-bold", diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-gray-400")}>
                  {diff > 0 ? `+${diff.toFixed(2)}` : diff < 0 ? diff.toFixed(2) : "sem alteração"}
                </span>
              </div>
              <div className="text-center">
                <p className={clsx("text-lg font-black", saldoNegativo ? "text-red-600" : "text-gray-900")}>{novoSaldo}</p>
                <p className="text-[10px] text-gray-500">{produto.unidade} novo</p>
              </div>
            </div>
            {saldoNegativo && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Estoque ficaria negativo! Operação bloqueada.
              </div>
            )}
          </div>

          {/* Campos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Preço Unitário (R$)</FieldLabel>
              <StyledInput
                type="number" min="0" step="0.01"
                value={precoUnitario}
                onChange={(e) => { setPrecoUnitario(e.target.value); setErrors((p) => ({ ...p, precoUnitario: undefined as unknown as string })); }}
                error={errors.precoUnitario}
              />
            </div>
            <div>
              <FieldLabel required>Quantidade ({produto.unidade})</FieldLabel>
              <StyledInput
                type="number" min="0" step="0.1"
                value={quantidade}
                onChange={(e) => { setQuantidade(e.target.value); setErrors((p) => ({ ...p, quantidade: undefined as unknown as string })); }}
                error={errors.quantidade}
              />
            </div>
          </div>

          <div>
            <FieldLabel required>Fornecedor</FieldLabel>
            <StyledInput
              value={fornecedor}
              onChange={(e) => { setFornecedor(e.target.value); setErrors((p) => ({ ...p, fornecedor: undefined as unknown as string })); }}
              error={errors.fornecedor}
            />
          </div>

          <div>
            <FieldLabel>Nota Fiscal</FieldLabel>
            <StyledInput
              value={notaFiscal}
              onChange={(e) => setNotaFiscal(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saldoNegativo}
            className={clsx(
              "px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition active:scale-95 flex items-center gap-2",
              saldoNegativo ? "bg-gray-300 cursor-not-allowed" : "bg-brand-600 hover:bg-brand-700"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
