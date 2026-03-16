"use client";

import { useState, useEffect } from "react";
import { X, PackagePlus, User, HandCoins, Info } from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import type { Produto } from "@/types";

interface EntradaEstoqueModalProps {
  produtoId: string | null;
  open: boolean;
  onClose: () => void;
}

const MOTIVOS_ENTRADA = [
  "Ajuste de Inventário",
  "Sobra de Obra/Serviço",
  "Devolução",
  "Outro"
];

export function EntradaEstoqueModal({
  produtoId,
  open,
  onClose,
}: EntradaEstoqueModalProps) {
  const { produtos, estoques, registrarEntrada } = useApp();

  const [quantidadeStr, setQuantidadeStr] = useState("");
  const [unidadeInsercao, setUnidadeInsercao] = useState<"mL" | "L">("mL");
  const [motivoSelecionado, setMotivoSelecionado] = useState(MOTIVOS_ENTRADA[0]);
  const [motivoManual, setMotivoManual] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [error, setError] = useState("");

  const produto = produtos.find((p) => p.id === produtoId);
  const estoqueAtual = estoques.find((e) => e.produtoId === produtoId)?.quantidadeAtual ?? 0;

  // Calculo on-the-fly do novo saldo demonstrativo
  const valDigitado = parseFloat(quantidadeStr.replace(",", ".")) || 0;
  let litrosSimulacao = valDigitado;
  if (unidadeInsercao === "mL" && produto?.unidade === "L") {
    litrosSimulacao = valDigitado / 1000;
  }
  const prevSaldo = estoqueAtual + litrosSimulacao;

  // Fechar com ESC / resetar estado
  useEffect(() => {
    if (!open) {
      setQuantidadeStr("");
      setUnidadeInsercao("mL");
      setResponsavel("");
      setMotivoSelecionado(MOTIVOS_ENTRADA[0]);
      setMotivoManual("");
      setError("");
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !produto) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const val = parseFloat(quantidadeStr.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      setError("Insira uma quantidade válida de entrada.");
      return;
    }

    if (!responsavel.trim()) {
      setError("Informe o responsável pela entrada.");
      return;
    }

    const motivoFinal = motivoSelecionado === "Outro" 
      ? motivoManual.trim() 
      : motivoSelecionado;

    if (!motivoFinal) {
      setError("Informe um motivo descritivo.");
      return;
    }

    // Conversão mL -> L
    let litrosAInserir = val;
    if (unidadeInsercao === "mL" && produto.unidade === "L") {
      litrosAInserir = val / 1000;
    }

    // Dispara a Action
    registrarEntrada({
      produtoId: produto.id,
      quantidade: litrosAInserir,
      motivo: `Entrada Avulsa — ${motivoFinal} (${val}${unidadeInsercao})`,
      responsavel: responsavel.trim(),
    });

    onClose();
  };

  const handleShortcutClick = (valNum: number, unLabel: "mL" | "L") => {
    setQuantidadeStr(valNum.toString());
    setUnidadeInsercao(unLabel);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-emerald-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2 text-emerald-700">
            <PackagePlus className="w-5 h-5" />
            <h2 className="font-bold">Dar Entrada (Ajuste)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Info context + Preview */}
          <div className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex justify-between items-center mb-1">
               <p className="text-sm font-bold text-gray-900 truncate">{produto.nome}</p>
               <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-600">
                 Unid: {produto.unidade}
               </div>
            </div>
            <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-200/60">
               <p className="text-xs text-gray-500">
                 Saldo Antigo: <b className="text-gray-900">{estoqueAtual} {produto.unidade}</b>
               </p>
               <p className="text-sm text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-lg border border-emerald-200 font-medium flex gap-1 items-center">
                 Novo Saldo: <b className="font-black">{prevSaldo} {produto.unidade}</b>
               </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Use esta função para ajustes, devoluções ou sobras. Digite em <b>mL</b> (mililitros) que o sistema converte em <b>{produto.unidade}</b> sozinho!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Input Inteligente (Manual vs Shortcuts) */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700">Quantidade</label>
              
              <div className="relative flex shadow-sm rounded-xl">
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantidadeStr}
                  onChange={(e) => setQuantidadeStr(e.target.value)}
                  placeholder="Ex: 250"
                  className={clsx(
                    "w-full pl-10 pr-3 py-2.5 border rounded-l-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition border-r-0",
                    error && quantidadeStr.trim() === "" ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                  )}
                />
                <HandCoins className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <select
                  value={unidadeInsercao}
                  onChange={(e) => setUnidadeInsercao(e.target.value as "mL" | "L")}
                  className={clsx(
                     "w-16 px-2 bg-gray-50 border border-gray-200 rounded-r-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500",
                     error && quantidadeStr.trim() === "" && "border-red-300"
                  )}
                >
                  <option value="mL">mL</option>
                  <option value="L">L</option>
                </select>
              </div>

              {/* Atalhos */}
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                <button type="button" onClick={() => handleShortcutClick(50, "mL")} className="py-1.5 text-[10px] font-bold bg-white border border-gray-200 text-gray-600 rounded-md hover:border-emerald-400 hover:text-emerald-600 transition active:scale-95 shadow-sm">50ml</button>
                <button type="button" onClick={() => handleShortcutClick(100, "mL")} className="py-1.5 text-[10px] font-bold bg-white border border-gray-200 text-gray-600 rounded-md hover:border-emerald-400 hover:text-emerald-600 transition active:scale-95 shadow-sm">100ml</button>
                <button type="button" onClick={() => handleShortcutClick(500, "mL")} className="py-1.5 text-[10px] font-bold bg-white border border-gray-200 text-gray-600 rounded-md hover:border-emerald-400 hover:text-emerald-600 transition active:scale-95 shadow-sm">500ml</button>
                <button type="button" onClick={() => handleShortcutClick(1, "L")} className="py-1.5 text-[10px] font-bold bg-white border border-emerald-200 text-emerald-700 rounded-md hover:border-emerald-400 hover:bg-emerald-50 transition active:scale-95 shadow-sm">1L</button>
              </div>
            </div>

            {/* Motivo Select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo</label>
              <select
                value={motivoSelecionado}
                onChange={(e) => setMotivoSelecionado(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700"
              >
                {MOTIVOS_ENTRADA.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Motivo Manual */}
          {motivoSelecionado === "Outro" && (
            <div className="animate-slide-up-fade">
              <input
                type="text"
                value={motivoManual}
                onChange={(e) => setMotivoManual(e.target.value)}
                placeholder="Descreva o motivo..."
                className={clsx(
                  "w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition",
                  error && motivoSelecionado === "Outro" && !motivoManual.trim() ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                )}
              />
            </div>
          )}

          {/* Responsável */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Responsável (Autorizador)</label>
            <div className="relative">
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Seu nome"
                className={clsx(
                  "w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition",
                  error && !responsavel.trim() ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                )}
              />
              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Error / Feedback */}
          {error && <p className="text-xs font-medium text-red-600 flex items-center gap-1.5"><X className="w-3.5 h-3.5"/> {error}</p>}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
            >
              Adicionar Saldo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
