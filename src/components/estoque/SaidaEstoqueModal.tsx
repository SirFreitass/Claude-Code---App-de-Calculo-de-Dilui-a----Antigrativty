"use client";

import { useState, useEffect } from "react";
import { X, PackageMinus, User, Droplets } from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import type { Produto } from "@/types";

interface SaidaEstoqueModalProps {
  produtoId: string | null;
  open: boolean;
  onClose: () => void;
}

export function SaidaEstoqueModal({
  produtoId,
  open,
  onClose,
}: SaidaEstoqueModalProps) {
  const { produtos, estoques, registrarSaida } = useApp();

  const [quantidadeStr, setQuantidadeStr] = useState("");
  const [unidadeInsercao, setUnidadeInsercao] = useState<"mL" | "L">("mL");
  const [responsavel, setResponsavel] = useState("");
  const [error, setError] = useState("");

  const produto = produtos.find((p) => p.id === produtoId);
  const estoqueAtual = estoques.find((e) => e.produtoId === produtoId)?.quantidadeAtual ?? 0;

  // Fechar com ESC / resetar estado
  useEffect(() => {
    if (!open) {
      setQuantidadeStr("");
      setResponsavel("");
      setError("");
      setUnidadeInsercao("mL");
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
    
    const valRaw = parseFloat(quantidadeStr.replace(",", "."));
    if (isNaN(valRaw) || valRaw <= 0) {
      setError("Insira uma quantidade válida.");
      return;
    }

    if (!responsavel.trim()) {
      setError("Informe o responsável pela retirada.");
      return;
    }

    // CRÍTICA: Se a inserção for ml mas o banco for Litros, divide por 1000
    // O sistema armazena o saldo sempre na unidade base do produto.
    let litrosARetirar = valRaw;
    if (unidadeInsercao === "mL" && produto.unidade === "L") {
      litrosARetirar = valRaw / 1000;
    }

    if (litrosARetirar > estoqueAtual) {
      setError("Estoque insuficiente para esta saída.");
      return;
    }

    // Dispara a Action
    registrarSaida({
      produtoId: produto.id,
      quantidade: litrosARetirar,
      motivo: `Fracionamento Manual — ${valRaw}${unidadeInsercao}`,
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
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-red-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2 text-red-700">
            <PackageMinus className="w-5 h-5" />
            <h2 className="font-bold">Registrar Saída (Fração)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Produto Contexto */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto Alvo</p>
            <p className="text-sm font-bold text-gray-900 truncate">{produto.nome}</p>
            <p className="text-xs text-gray-600">Saldo Atual: <span className="font-bold text-gray-900">{estoqueAtual} {produto.unidade}</span></p>
          </div>

          {/* Atalhos Rápidos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Atalhos de Extração</label>
            <div className="grid grid-cols-4 gap-2">
              <button type="button" onClick={() => handleShortcutClick(50, "mL")} className="py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-red-400 hover:text-red-600 transition active:scale-95">50ml</button>
              <button type="button" onClick={() => handleShortcutClick(100, "mL")} className="py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-red-400 hover:text-red-600 transition active:scale-95">100ml</button>
              <button type="button" onClick={() => handleShortcutClick(500, "mL")} className="py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-red-400 hover:text-red-600 transition active:scale-95">500ml</button>
              <button type="button" onClick={() => handleShortcutClick(1, "L")} className="py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-red-400 hover:text-red-600 transition active:scale-95">1L</button>
            </div>
          </div>

          {/* Inserção Customizada */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ou Quantidade Manual</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantidadeStr}
                  onChange={(e) => setQuantidadeStr(e.target.value)}
                  placeholder="Ex: 250"
                  className={clsx(
                    "w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition",
                    error && quantidadeStr.trim() === "" ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                  )}
                />
                <Droplets className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              </div>
              <select
                value={unidadeInsercao}
                onChange={(e) => setUnidadeInsercao(e.target.value as "mL" | "L")}
                className="w-24 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="mL">mL</option>
                <option value="L">L</option>
              </select>
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Responsável (Helper)</label>
            <div className="relative">
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome de quem retirou"
                className={clsx(
                  "w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition",
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
              className="px-4 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition"
            >
              Dar Saída
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
