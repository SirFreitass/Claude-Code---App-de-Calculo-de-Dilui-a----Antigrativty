"use client";

import { useMemo } from "react";
import {
  Package,
  Warehouse,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  FlaskConical,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import { getStatusEstoque, custoTotalCompra } from "@/types";

// ─────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  sub?: string;
  trend?: { value: number; label: string };
}) {
  const up = trend && trend.value >= 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={clsx("flex items-center justify-center w-11 h-11 rounded-xl", iconBg)}>
          <Icon className={clsx("w-5 h-5", iconColor)} />
        </div>
        {trend && (
          <span
            className={clsx(
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              up ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
            )}
          >
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{title}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend && <p className="text-xs text-gray-400 mt-1">{trend.label}</p>}
      </div>
    </div>
  );
}

const statusConfig = {
  ok:      { label: "OK",          cls: "bg-emerald-50 text-emerald-700" },
  baixo:   { label: "Baixo",       cls: "bg-amber-50 text-amber-700"     },
  critico: { label: "Crítico",     cls: "bg-orange-50 text-orange-700"   },
  zerado:  { label: "Sem estoque", cls: "bg-red-50 text-red-700"         },
};

// ─────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const { produtos, estoques, compras, diluicoes } = useApp();

  // ── Dados compostos ──
  const produtosCompletos = useMemo(() =>
    produtos.map((p) => {
      const estoque = estoques.find((e) => e.produtoId === p.id);
      const pDils   = diluicoes.filter((d) => d.produtoId === p.id);
      const pCompras = compras
        .filter((c) => c.produtoId === p.id)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      return { ...p, estoque: estoque ?? null, diluicoes: pDils, ultimaCompra: pCompras[0] ?? null };
    }),
    [produtos, estoques, compras, diluicoes]
  );

  // ── Resumo Estoque ──
  const resumoEstoque = useMemo(() => ({
    totalProdutos: produtos.length,
    produtosAbaixoMinimo: estoques.filter((e) => {
      const s = getStatusEstoque(e);
      return s === "baixo" || s === "critico";
    }).length,
    produtosEmFalta: estoques.filter((e) => e.quantidadeAtual === 0).length,
  }), [produtos, estoques]);

  // ── Resumo Compras (mês atual vs anterior) ──
  const resumoCompras = useMemo(() => {
    const agora = new Date();
    const mesAtual  = agora.getMonth();
    const anoAtual  = agora.getFullYear();
    const mesAnt    = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnt    = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    const doMes = (c: typeof compras[0]) => {
      const d = new Date(c.data);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    };
    const doMesAnt = (c: typeof compras[0]) => {
      const d = new Date(c.data);
      return d.getMonth() === mesAnt && d.getFullYear() === anoAnt;
    };

    const gastoMes     = compras.filter(doMes).reduce((s, c) => s + custoTotalCompra(c), 0);
    const gastoMesAnt  = compras.filter(doMesAnt).reduce((s, c) => s + custoTotalCompra(c), 0);
    const variacao     = gastoMesAnt === 0 ? 100 : ((gastoMes - gastoMesAnt) / gastoMesAnt) * 100;

    return {
      totalComprasMes: compras.filter(doMes).length,
      gastoMes,
      variacaoPercentual: variacao,
    };
  }, [compras]);

  const alertas = produtosCompletos.filter(
    (p) => p.estoque && getStatusEstoque(p.estoque) !== "ok"
  );

  const ultimasCompras = produtosCompletos
    .filter((p) => p.ultimaCompra)
    .sort((a, b) =>
      new Date(b.ultimaCompra!.data).getTime() - new Date(a.ultimaCompra!.data).getTime()
    )
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* ── Cabeçalho ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão geral do estoque e compras —{" "}
          {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total de Produtos"
          value={resumoEstoque.totalProdutos}
          icon={Package}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          sub="Cadastrados no sistema"
        />
        <StatCard
          title="Abaixo do Mínimo"
          value={resumoEstoque.produtosAbaixoMinimo}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          sub="Requerem reposição em breve"
        />
        <StatCard
          title="Sem Estoque"
          value={resumoEstoque.produtosEmFalta}
          icon={Warehouse}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          sub="Produtos zerados — urgente"
        />
        <StatCard
          title="Compras no Mês"
          value={`R$ ${resumoCompras.gastoMes.toFixed(2)}`}
          icon={ShoppingCart}
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
          sub={`${resumoCompras.totalComprasMes} pedido${resumoCompras.totalComprasMes !== 1 ? "s" : ""} realizados`}
          trend={{ value: resumoCompras.variacaoPercentual, label: "vs. mês anterior" }}
        />
      </div>

      {/* ── Conteúdo principal ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Alertas de estoque */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Alertas de Estoque</h2>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="divide-y divide-gray-50">
            {alertas.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">
                Nenhum alerta — todos os estoques estão OK.
              </p>
            ) : (
              alertas.map((produto) => {
                const status = getStatusEstoque(produto.estoque!);
                const cfg = statusConfig[status];
                return (
                  <div key={produto.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{produto.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {produto.marca} · {produto.categoria}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {produto.estoque?.quantidadeAtual ?? 0}{" "}
                          <span className="text-gray-400 font-normal">{produto.unidade}</span>
                        </p>
                        <p className="text-[11px] text-gray-400">
                          mín: {produto.estoque?.alertaEstoqueMinimo ?? 0} {produto.unidade}
                        </p>
                      </div>
                      <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full", cfg.cls)}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Últimas compras */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Últimas Compras</h2>
            <ShoppingCart className="w-4 h-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {ultimasCompras.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">
                Nenhuma compra registrada.
              </p>
            ) : (
              ultimasCompras.map((produto) => {
                const compra = produto.ultimaCompra!;
                return (
                  <div key={compra.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 shrink-0">
                          <FlaskConical className="w-3.5 h-3.5 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 leading-tight">
                            {produto.nome.length > 24
                              ? produto.nome.slice(0, 24) + "…"
                              : produto.nome}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(compra.data).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">
                          R$ {custoTotalCompra(compra).toFixed(2)}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {compra.quantidade} {produto.unidade}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
