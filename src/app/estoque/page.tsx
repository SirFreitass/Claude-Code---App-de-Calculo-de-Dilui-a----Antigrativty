"use client";

import { useState, useMemo } from "react";
import {
  Warehouse,
  AlertTriangle,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import { getStatusEstoque, type StatusEstoque } from "@/types";
import { EntradaEstoqueModal } from "@/components/estoque/EntradaEstoqueModal";
import { SaidaEstoqueModal } from "@/components/estoque/SaidaEstoqueModal";

// ─────────────────────────────────────────────
// Config de status (reutilizável)
// ─────────────────────────────────────────────

const STATUS_CFG: Record<StatusEstoque, { label: string; cls: string; dot: string; cardBorder: string }> = {
  ok:      { label: "OK",          cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", cardBorder: "border-gray-200"     },
  baixo:   { label: "Baixo",       cls: "bg-amber-50 text-amber-700",    dot: "bg-amber-500",   cardBorder: "border-amber-300"    },
  critico: { label: "Crítico",     cls: "bg-orange-50 text-orange-700",  dot: "bg-orange-500",  cardBorder: "border-orange-300"   },
  zerado:  { label: "Sem estoque", cls: "bg-red-50 text-red-700",        dot: "bg-red-500",     cardBorder: "border-red-300"      },
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function EstoquePage() {
  const { produtos, estoques, movimentacoes } = useApp();
  
  const [modalEntradaId, setModalEntradaId] = useState<string | null>(null);
  const [modalSaidaId, setModalSaidaId] = useState<string | null>(null);

  // ── Lista enriquecida de estoque ──
  const listaEstoque = useMemo(() => {
    return estoques
      .map((e) => {
        const produto = produtos.find((p) => p.id === e.produtoId);
        if (!produto) return null;
        const status = getStatusEstoque(e);
        return { ...e, produto, status };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => {
        // Ordenar por gravidade: zerado > critico > baixo > ok
        const ordem: Record<StatusEstoque, number> = { zerado: 0, critico: 1, baixo: 2, ok: 3 };
        return ordem[a.status] - ordem[b.status];
      });
  }, [estoques, produtos]);

  // ── Resumo cards ──
  const resumo = useMemo(() => ({
    total: listaEstoque.length,
    ok: listaEstoque.filter((e) => e.status === "ok").length,
    baixo: listaEstoque.filter((e) => e.status === "baixo").length,
    critico: listaEstoque.filter((e) => e.status === "critico").length,
    zerado: listaEstoque.filter((e) => e.status === "zerado").length,
  }), [listaEstoque]);

  // ── Últimas 10 movimentações ──
  const ultimasMovimentacoes = useMemo(() => {
    return [...movimentacoes]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 10)
      .map((m) => {
        const produto = produtos.find((p) => p.id === m.produtoId);
        return { ...m, produto };
      });
  }, [movimentacoes, produtos]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* ── Cabeçalho ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
        <p className="text-sm text-gray-500 mt-1">
          Controle de saldos e histórico de movimentações
        </p>
      </div>

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Em dia"
          value={resumo.ok}
          color="emerald"
          icon={<Package className="w-4 h-4" />}
        />
        <SummaryCard
          label="Baixo"
          value={resumo.baixo}
          color="amber"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <SummaryCard
          label="Crítico"
          value={resumo.critico}
          color="orange"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <SummaryCard
          label="Zerado"
          value={resumo.zerado}
          color="red"
          icon={<Warehouse className="w-4 h-4" />}
        />
      </div>

      {/* ── Conteúdo principal: Lista + Histórico ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Lista de produtos / estoque ── */}
        <div className="xl:col-span-2 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Produtos ({listaEstoque.length})
          </h2>

          {listaEstoque.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-2">
              {listaEstoque.map((item) => {
                const cfg = STATUS_CFG[item.status];
                const percentMin =
                  item.alertaEstoqueMinimo > 0
                    ? Math.min((item.quantidadeAtual / item.alertaEstoqueMinimo) * 100, 100)
                    : 100;

                return (
                  <div
                    key={item.id}
                    className={clsx(
                      "bg-white rounded-xl border-2 p-4 sm:p-5 transition-all",
                      cfg.cardBorder,
                      item.status !== "ok" && "shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Info produto */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={clsx(
                          "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
                          item.status === "ok" ? "bg-brand-50" : cfg.cls
                        )}>
                          <Package className={clsx(
                            "w-5 h-5",
                            item.status === "ok" ? "text-brand-600" : ""
                          )} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.produto.nome}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.produto.marca} · {item.produto.categoria}
                          </p>
                          {item.localizacao && (
                            <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <MapPin className="w-3 h-3" />
                              {item.localizacao}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Saldo + Status */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-gray-900">
                            {item.quantidadeAtual}
                          </span>
                          <span className="text-sm text-gray-400 font-medium">
                            {item.produto.unidade}
                          </span>
                        </div>
                        <span className={clsx("text-xs font-semibold px-2.5 py-0.5 rounded-full", cfg.cls)}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação Avulsa */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => setModalEntradaId(item.produtoId)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        Dar Entrada
                      </button>
                      <button
                        onClick={() => setModalSaidaId(item.produtoId)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-red-400 hover:text-red-700 hover:bg-red-50 transition"
                      >
                        <ArrowDownCircle className="w-4 h-4" />
                        Registrar Saída
                      </button>
                    </div>

                    {/* Barra de progresso vs mínimo */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                        <span>Mín: {item.alertaEstoqueMinimo} {item.produto.unidade}</span>
                        <span>
                          {percentMin >= 100
                            ? "Acima do mínimo"
                            : `${percentMin.toFixed(0)}% do mínimo`}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            "h-full rounded-full transition-all duration-700",
                            item.status === "ok" && "bg-emerald-500",
                            item.status === "baixo" && "bg-amber-500",
                            item.status === "critico" && "bg-orange-500",
                            item.status === "zerado" && "bg-red-500",
                          )}
                          style={{ width: `${percentMin}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Histórico de Movimentações ── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Últimas Movimentações
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {ultimasMovimentacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Clock className="w-6 h-6 text-gray-300" />
                <p className="text-sm text-gray-400">Nenhuma movimentação registrada.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {ultimasMovimentacoes.map((mov) => (
                  <div key={mov.id} className="px-4 py-3.5 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Ícone tipo */}
                      <div className={clsx(
                        "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5",
                        mov.tipo === "entrada"
                          ? "bg-emerald-50"
                          : "bg-red-50"
                      )}>
                        {mov.tipo === "entrada" ? (
                          <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {mov.produto?.nome ?? "Produto removido"}
                          </p>
                          <span className={clsx(
                            "text-sm font-bold shrink-0",
                            mov.tipo === "entrada" ? "text-emerald-600" : "text-red-600"
                          )}>
                            {mov.tipo === "entrada" ? "+" : "−"}
                            {mov.quantidade < 1
                              ? `${(mov.quantidade * 1000).toFixed(0)}ml`
                              : `${mov.quantidade}${mov.produto?.unidade ?? "L"}`}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {mov.motivo}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {mov.responsavel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(mov.data).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modais ── */}
      <EntradaEstoqueModal 
        produtoId={modalEntradaId}
        open={!!modalEntradaId}
        onClose={() => setModalEntradaId(null)}
      />
      
      <SaidaEstoqueModal 
        produtoId={modalSaidaId}
        open={!!modalSaidaId}
        onClose={() => setModalSaidaId(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "emerald" | "amber" | "orange" | "red";
  icon: React.ReactNode;
}) {
  const colors = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500", border: "border-emerald-200" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-700",   icon: "text-amber-500",   border: "border-amber-200"   },
    orange:  { bg: "bg-orange-50",   text: "text-orange-700",  icon: "text-orange-500",  border: "border-orange-200"  },
    red:     { bg: "bg-red-50",      text: "text-red-700",     icon: "text-red-500",     border: "border-red-200"     },
  };
  const c = colors[color];

  return (
    <div className={clsx(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl border",
      c.bg, c.border,
      value === 0 && "opacity-50"
    )}>
      <div className={c.icon}>{icon}</div>
      <div>
        <p className={clsx("text-xl font-black", c.text)}>{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100">
        <Warehouse className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">
        Nenhum estoque cadastrado ainda.
      </p>
    </div>
  );
}
