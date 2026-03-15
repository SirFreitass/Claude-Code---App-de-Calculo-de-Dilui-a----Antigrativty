"use client";

import { useEffect, useMemo } from "react";
import {
  X,
  Package,
  FlaskConical,
  Warehouse,
  ShoppingCart,
  Pencil,
  Tag,
  CircleDollarSign,
  Droplets,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import { 
  getStatusEstoque, 
  precoMedioPonderado, 
  custoTotalCompra,
  custoLitroDiluido,
  rendimentoPorLitro,
  formatProporcao
} from "@/types";

interface DetalhesProdutoModalProps {
  produtoId: string | null;
  open: boolean;
  onClose: () => void;
}

export function DetalhesProdutoModal({
  produtoId,
  open,
  onClose,
}: DetalhesProdutoModalProps) {
  const { produtos, estoques, compras, diluicoes } = useApp();

  // Fechar com ESC + travar scroll do body
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // ── Extrair dados do produto alvo ──
  const detalhes = useMemo(() => {
    if (!produtoId) return null;

    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return null;

    const estoque = estoques.find((e) => e.produtoId === produtoId);
    const pCompras = compras.filter((c) => c.produtoId === produtoId).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
    const pDils = diluicoes.filter((d) => d.produtoId === produtoId);

    const precoMedio = precoMedioPonderado(pCompras);
    const ultimaCompra = pCompras[0] || null;

    return {
      produto,
      estoque,
      compras: pCompras,
      ultimaCompra,
      precoMedio,
      diluicoes: pDils,
    };
  }, [produtoId, produtos, estoques, compras, diluicoes]);

  if (!open || !detalhes) return null;

  const { produto, estoque, ultimaCompra, precoMedio, diluicoes: dils } = detalhes;

  // Helpers visuais
  const statusEstoque = estoque ? getStatusEstoque(estoque) : null;
  const statusConfig = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-500/30",
    baixo: "bg-amber-50 text-amber-700 ring-amber-500/30",
    critico: "bg-orange-50 text-orange-700 ring-orange-500/30",
    zerado: "bg-red-50 text-red-700 ring-red-500/30",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header Flutuante ── */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/10 text-gray-700 hover:bg-black/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto flex-1 p-0">
          {/* Cabeçalho de Destaque */}
          <div className="bg-brand-50 px-6 sm:px-8 py-8 border-b border-brand-100">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm shrink-0 border border-brand-100">
                <Package className="w-8 h-8 text-brand-600" />
              </div>
              <div className="flex-1 mt-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-white text-gray-600 border border-gray-200">
                    <Tag className="w-3.5 h-3.5" />
                    {produto.categoria}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-white text-gray-600 border border-gray-200">
                    {produto.marca}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">
                  {produto.nome}
                </h2>
                {produto.descricao && (
                  <p className="text-sm text-gray-600 leading-relaxed max-w-lg">
                    {produto.descricao}
                  </p>
                )}
              </div>
            </div>
            {/* Actions no topo */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => alert("Edição completa de produtos chegando em breve!")}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-brand-50 text-brand-700 text-sm font-semibold rounded-xl transition border border-brand-200 shadow-sm"
              >
                <Pencil className="w-4 h-4" />
                Editar Produto
              </button>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6 space-y-8">
            {/* ── Grid Principal: Estoque e Financeiro ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card de Estoque */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <Warehouse className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-bold text-gray-900">Posição de Estoque</h3>
                </div>
                <div className="p-5">
                  {estoque ? (
                    <div className="space-y-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-gray-500">Saldo Atual</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-gray-900">
                            {estoque.quantidadeAtual}
                          </span>
                          <span className="text-sm font-semibold text-gray-500">
                            {produto.unidade}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Ponto de Pedido</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {estoque.alertaEstoqueMinimo} {produto.unidade}
                          </p>
                        </div>
                        {statusEstoque && (
                          <span
                            className={clsx(
                              "px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
                              statusConfig[statusEstoque]
                            )}
                          >
                            {statusEstoque.toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      {estoque.localizacao && (
                        <div className="pt-3 border-t border-gray-100 mt-3">
                          <p className="text-xs text-gray-500 mb-0.5">Localização</p>
                          <p className="text-sm font-medium text-gray-900">
                            {estoque.localizacao}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sem controle de estoque</p>
                  )}
                </div>
              </div>

              {/* Card Financeiro */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <ShoppingCart className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-bold text-gray-900">Gestão Financeira</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-500">Preço Médio</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-gray-900">
                          {precoMedio !== null ? `R$ ${precoMedio.toFixed(2)}` : "—"}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          /{produto.unidade}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Última Compra</p>
                      {ultimaCompra ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date(ultimaCompra.data).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="text-sm font-bold text-emerald-700">
                              R$ {custoTotalCompra(ultimaCompra).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{ultimaCompra.fornecedor}</span>
                            <span>{ultimaCompra.quantidade} {produto.unidade} (R$ {ultimaCompra.precoUnitario.toFixed(2)}/{produto.unidade})</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhuma compra registrada</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
            </div>

            {/* ── Grid Diluições ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-gray-900" />
                <h3 className="text-lg font-bold text-gray-900">Faixas de Diluição</h3>
              </div>

              {dils.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <FlaskConical className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma diluição cadastrada para este produto.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dils.map(dil => {
                    // Config visual por tipo
                    const cfg = {
                      Leve: "bg-emerald-50 border-emerald-200 text-emerald-800 ring-emerald-500",
                      Media: "bg-amber-50 border-amber-200 text-amber-800 ring-amber-500",
                      Pesada: "bg-red-50 border-red-200 text-red-800 ring-red-500"
                    }[dil.tipo];

                    const rendimento = rendimentoPorLitro(dil.fatorDiluicao);
                    const custo = precoMedio !== null ? custoLitroDiluido(precoMedio, dil.fatorDiluicao) : null;

                    return (
                      <div key={dil.id} className={clsx("rounded-xl border p-4 sm:p-5 flex flex-col h-full", cfg.split(" ")[0], cfg.split(" ")[1])}>
                        <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-3">
                          <span className={clsx("text-xs font-bold uppercase tracking-wider", cfg.split(" ")[2])}>
                            {dil.tipo}
                          </span>
                          <span className={clsx("text-xl font-black", cfg.split(" ")[2])}>
                            {dil.proporcao}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 leading-relaxed mb-4 flex-1">
                          {dil.instrucaoDeUso}
                        </p>

                        <div className="bg-white/60 rounded-lg p-3 space-y-2 mt-auto">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>Rende <strong>{rendimento}{produto.unidade}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {custo !== null ? (
                              <span>Custo: <strong>R$ {custo.toFixed(3)}</strong> / litro</span>
                            ) : (
                              <span className="italic">Custo indisponível</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
