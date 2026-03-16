"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Plus,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Package,
  ChevronDown,
  Filter,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import {
  custoTotalCompra,
  precoMedioPonderado,
  type Compra,
} from "@/types";
import { NovaCompraModal } from "@/components/compras/NovaCompraModal";
import { EditarCompraModal } from "@/components/compras/EditarCompraModal";

// ─────────────────────────────────────────────
// Tipos locais
// ─────────────────────────────────────────────

type SortField = "data" | "produto" | "fornecedor" | "total";
type SortDir = "asc" | "desc";
type PeriodoFilter = "" | "mes-atual" | "mes-anterior" | "ultimos-3";

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function ComprasPage() {
  const { produtos, compras, estoques, deleteCompra } = useApp();

  const [search, setSearch] = useState("");
  const [filterProduto, setFilterProduto] = useState("");
  const [filterPeriodo, setFilterPeriodo] = useState<PeriodoFilter>("");
  const [sortField, setSortField] = useState<SortField>("data");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [detalheCompraId, setDetalheCompraId] = useState<string | null>(null);
  const [editarCompraId, setEditarCompraId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Datas de referência ──
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();
  const mesAnt = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoAnt = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  // ── Lista enriquecida ──
  const comprasList = useMemo(() => {
    const list = compras.map((c) => {
      const produto = produtos.find((p) => p.id === c.produtoId);

      // Calcular tendência: preço desta compra vs média anterior
      const comprasAnteriores = compras.filter(
        (x) => x.produtoId === c.produtoId && new Date(x.data) < new Date(c.data)
      );
      const mediaAnterior = precoMedioPonderado(comprasAnteriores);
      const tendencia: "up" | "down" | "first" | "equal" =
        mediaAnterior === null
          ? "first"
          : c.precoUnitario > mediaAnterior * 1.005
            ? "up"
            : c.precoUnitario < mediaAnterior * 0.995
              ? "down"
              : "equal";
      const variacaoPercent =
        mediaAnterior !== null && mediaAnterior > 0
          ? ((c.precoUnitario - mediaAnterior) / mediaAnterior) * 100
          : null;

      return {
        ...c,
        produto,
        total: custoTotalCompra(c),
        tendencia,
        variacaoPercent,
        mediaAnterior,
      };
    });

    // Filtro por busca
    const q = search.toLowerCase();
    let filtered = list.filter((c) => {
      if (q) {
        const matchSearch =
          (c.produto?.nome ?? "").toLowerCase().includes(q) ||
          c.fornecedor.toLowerCase().includes(q) ||
          (c.notaFiscal ?? "").toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      return true;
    });

    // Filtro por produto
    if (filterProduto) {
      filtered = filtered.filter((c) => c.produtoId === filterProduto);
    }

    // Filtro por período
    if (filterPeriodo) {
      filtered = filtered.filter((c) => {
        const d = new Date(c.data);
        const m = d.getMonth();
        const y = d.getFullYear();
        if (filterPeriodo === "mes-atual") return m === mesAtual && y === anoAtual;
        if (filterPeriodo === "mes-anterior") return m === mesAnt && y === anoAnt;
        if (filterPeriodo === "ultimos-3") {
          const tresMesesAtras = new Date(anoAtual, mesAtual - 2, 1);
          return d >= tresMesesAtras;
        }
        return true;
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === "data") cmp = new Date(a.data).getTime() - new Date(b.data).getTime();
      if (sortField === "produto") cmp = (a.produto?.nome ?? "").localeCompare(b.produto?.nome ?? "");
      if (sortField === "fornecedor") cmp = a.fornecedor.localeCompare(b.fornecedor);
      if (sortField === "total") cmp = a.total - b.total;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [compras, produtos, search, filterProduto, filterPeriodo, sortField, sortDir, mesAtual, anoAtual, mesAnt, anoAnt]);

  // ── Resumos ──
  const resumo = useMemo(() => {
    const comprasMes = compras.filter((c) => {
      const d = new Date(c.data);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    const comprasMesAnt = compras.filter((c) => {
      const d = new Date(c.data);
      return d.getMonth() === mesAnt && d.getFullYear() === anoAnt;
    });

    const gastoMes = comprasMes.reduce((s, c) => s + custoTotalCompra(c), 0);
    const gastoMesAnt = comprasMesAnt.reduce((s, c) => s + custoTotalCompra(c), 0);
    const variacao = gastoMesAnt === 0 ? 0 : ((gastoMes - gastoMesAnt) / gastoMesAnt) * 100;

    return {
      totalCompras: compras.length,
      comprasMes: comprasMes.length,
      gastoMes,
      gastoMesAnt,
      variacao,
    };
  }, [compras, mesAtual, anoAtual, mesAnt, anoAnt]);

  // ── Compra selecionada para detalhe ──
  const compraDetalhe = useMemo(() => {
    if (!detalheCompraId) return null;
    return comprasList.find((c) => c.id === detalheCompraId) ?? null;
  }, [detalheCompraId, comprasList]);

  // ── Helpers de sort ──
  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir(field === "data" ? "desc" : "asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-brand-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const hasFilters = search || filterProduto || filterPeriodo;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">

      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500 mt-1">
            Histórico de aquisições e registro de novas entradas
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Compra
        </button>
      </div>

      {/* ── Cards de resumo ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50">
            <ShoppingCart className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{resumo.totalCompras}</p>
            <p className="text-xs text-gray-500">Total de compras</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">
              R$ {resumo.gastoMes.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Gasto no mês ({resumo.comprasMes} compra{resumo.comprasMes !== 1 ? "s" : ""})
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className={clsx(
            "flex items-center justify-center w-10 h-10 rounded-xl",
            resumo.variacao > 0 ? "bg-red-50" : "bg-emerald-50"
          )}>
            {resumo.variacao > 0
              ? <TrendingUp className="w-5 h-5 text-red-500" />
              : <TrendingDown className="w-5 h-5 text-emerald-500" />}
          </div>
          <div>
            <p className={clsx(
              "text-xl font-black",
              resumo.variacao > 0 ? "text-red-600" : "text-emerald-600"
            )}>
              {resumo.variacao > 0 ? "+" : ""}{resumo.variacao.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">vs. mês anterior</p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar produto, fornecedor ou NF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro produto */}
        <div className="relative">
          <select
            value={filterProduto}
            onChange={(e) => setFilterProduto(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-600"
          >
            <option value="">Todos os produtos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Filtro período */}
        <div className="relative">
          <select
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value as PeriodoFilter)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-600"
          >
            <option value="">Todo o período</option>
            <option value="mes-atual">Mês atual</option>
            <option value="mes-anterior">Mês anterior</option>
            <option value="ultimos-3">Últimos 3 meses</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Limpar filtros */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilterProduto(""); setFilterPeriodo(""); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            <Filter className="w-3 h-3" />
            Limpar
          </button>
        )}

        {hasFilters && (
          <span className="text-xs text-gray-500">
            {comprasList.length} resultado{comprasList.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Tabela ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th onClick={() => toggleSort("data")} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700">
                  Data <SortIcon field="data" />
                </th>
                <th onClick={() => toggleSort("produto")} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700">
                  Produto <SortIcon field="produto" />
                </th>
                <th onClick={() => toggleSort("fornecedor")} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700">
                  Fornecedor <SortIcon field="fornecedor" />
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Qtd
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Preço Unit.
                </th>
                <th onClick={() => toggleSort("total")} className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700">
                  Total <SortIcon field="total" />
                </th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tendência
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {comprasList.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100">
                        <ShoppingCart className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">
                        {hasFilters
                          ? "Nenhuma compra encontrada para estes filtros."
                          : "Nenhuma compra registrada ainda."}
                      </p>
                      {!hasFilters && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Registrar primeira compra →
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                comprasList.map((compra) => (
                  <tr
                    key={compra.id}
                    onClick={() => setDetalheCompraId(compra.id === detalheCompraId ? null : compra.id)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Data */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {new Date(compra.data).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(compra.data).toLocaleDateString("pt-BR", { weekday: "short" })}
                      </p>
                    </td>

                    {/* Produto */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 shrink-0">
                          <Package className="w-3.5 h-3.5 text-brand-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {compra.produto?.nome ?? "Produto removido"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {compra.produto?.marca}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Fornecedor */}
                    <td className="px-5 py-4">
                      <p className="text-gray-700 truncate max-w-[180px]">{compra.fornecedor}</p>
                      {compra.notaFiscal && (
                        <p className="text-[11px] text-gray-400 mt-0.5">NF: {compra.notaFiscal}</p>
                      )}
                    </td>

                    {/* Quantidade */}
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium text-gray-900">
                        {compra.quantidade}
                      </span>
                      <span className="text-gray-400 ml-0.5 text-xs">
                        {compra.produto?.unidade}
                      </span>
                    </td>

                    {/* Preço Unitário */}
                    <td className="px-5 py-4 text-right">
                      <span className="font-medium text-gray-900">
                        R$ {compra.precoUnitario.toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-xs">/{compra.produto?.unidade}</span>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-gray-900">
                        R$ {compra.total.toFixed(2)}
                      </span>
                    </td>

                    {/* Tendência */}
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <TendenciaBadge
                          tendencia={compra.tendencia}
                          variacao={compra.variacaoPercent}
                        />
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditarCompraId(compra.id); }}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 bg-white hover:border-brand-300 hover:text-brand-600 transition shadow-sm"
                          title="Editar compra"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(compra.id); }}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 bg-white hover:border-red-300 hover:text-red-600 transition shadow-sm"
                          title="Excluir compra"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé totalizador */}
        {comprasList.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Exibindo {comprasList.length} de {compras.length} compra{compras.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs font-semibold text-gray-600">
              Total exibido: R$ {comprasList.reduce((s, c) => s + c.total, 0).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* ── Detalhe da compra (expansível) ── */}
      {compraDetalhe && (
        <div className="animate-slide-up-fade bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Detalhes da Compra
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {compraDetalhe.produto?.nome} — {new Date(compraDetalhe.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <button
              onClick={() => setDetalheCompraId(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DetailItem label="Fornecedor" value={compraDetalhe.fornecedor} />
            <DetailItem label="Quantidade" value={`${compraDetalhe.quantidade} ${compraDetalhe.produto?.unidade}`} />
            <DetailItem label="Preço Unitário" value={`R$ ${compraDetalhe.precoUnitario.toFixed(2)}`} />
            <DetailItem label="Total" value={`R$ ${compraDetalhe.total.toFixed(2)}`} bold />
            {compraDetalhe.notaFiscal && (
              <DetailItem label="Nota Fiscal" value={compraDetalhe.notaFiscal} />
            )}
          </div>

          {/* Comparação com média */}
          {compraDetalhe.mediaAnterior !== null && (
            <div className={clsx(
              "mt-4 p-4 rounded-xl border flex items-center gap-3",
              compraDetalhe.tendencia === "up" && "bg-red-50 border-red-200",
              compraDetalhe.tendencia === "down" && "bg-emerald-50 border-emerald-200",
              compraDetalhe.tendencia === "equal" && "bg-gray-50 border-gray-200",
            )}>
              {compraDetalhe.tendencia === "up" && <TrendingUp className="w-5 h-5 text-red-500 shrink-0" />}
              {compraDetalhe.tendencia === "down" && <TrendingDown className="w-5 h-5 text-emerald-500 shrink-0" />}
              {compraDetalhe.tendencia === "equal" && <Minus className="w-5 h-5 text-gray-400 shrink-0" />}
              <div>
                <p className={clsx(
                  "text-sm font-semibold",
                  compraDetalhe.tendencia === "up" && "text-red-700",
                  compraDetalhe.tendencia === "down" && "text-emerald-700",
                  compraDetalhe.tendencia === "equal" && "text-gray-700",
                )}>
                  {compraDetalhe.tendencia === "up" && "Preço acima da média"}
                  {compraDetalhe.tendencia === "down" && "Preço abaixo da média"}
                  {compraDetalhe.tendencia === "equal" && "Preço estável"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Esta compra: <span className="font-semibold">R$ {compraDetalhe.precoUnitario.toFixed(2)}</span>
                  {" · "}
                  Média anterior: <span className="font-semibold">R$ {compraDetalhe.mediaAnterior.toFixed(2)}</span>
                  {compraDetalhe.variacaoPercent !== null && (
                    <span className={clsx(
                      "ml-1 font-bold",
                      compraDetalhe.tendencia === "up" ? "text-red-600" : "text-emerald-600"
                    )}>
                      ({compraDetalhe.variacaoPercent > 0 ? "+" : ""}{compraDetalhe.variacaoPercent.toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {compraDetalhe.tendencia === "first" && (
            <div className="mt-4 p-4 rounded-xl border bg-blue-50 border-blue-200 flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Primeira compra deste produto.</span>
                {" "}A tendência será calculada a partir da próxima aquisição.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmDeleteId && (() => {
        const cDel = compras.find(c => c.id === confirmDeleteId);
        const pDel = cDel ? produtos.find(p => p.id === cDel.produtoId) : null;
        const eDel = cDel ? estoques.find(e => e.produtoId === cDel.produtoId) : null;
        const saldoApos = eDel && cDel ? +(eDel.quantidadeAtual - cDel.quantidade).toFixed(4) : 0;
        const bloqueado = saldoApos < 0;
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-slide-up-fade" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Excluir Compra</h3>
                  <p className="text-xs text-gray-500">{pDel?.nome} — {cDel ? new Date(cDel.data).toLocaleDateString("pt-BR") : ""}</p>
                </div>
              </div>

              <div className={clsx("rounded-xl border p-4 mb-4", bloqueado ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
                <p className="text-sm text-gray-700 mb-2">
                  Esta ação vai <strong>subtrair {cDel?.quantidade} {pDel?.unidade}</strong> do estoque.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Saldo atual: <strong>{eDel?.quantidadeAtual} {pDel?.unidade}</strong></span>
                  <span className="text-gray-400">→</span>
                  <span className={clsx("font-bold", bloqueado ? "text-red-600" : "text-amber-700")}>{saldoApos} {pDel?.unidade}</span>
                </div>
                {bloqueado && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exclusão bloqueada — estoque ficaria negativo!
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button
                  onClick={() => { deleteCompra({ id: confirmDeleteId }); setConfirmDeleteId(null); setDetalheCompraId(null); }}
                  disabled={bloqueado}
                  className={clsx("px-5 py-2 rounded-xl text-sm font-semibold text-white transition flex items-center gap-2", bloqueado ? "bg-gray-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700")}
                >
                  <Trash2 className="w-4 h-4" />
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modais */}
      <NovaCompraModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <EditarCompraModal compraId={editarCompraId} open={!!editarCompraId} onClose={() => setEditarCompraId(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────

function TendenciaBadge({
  tendencia,
  variacao,
}: {
  tendencia: "up" | "down" | "first" | "equal";
  variacao: number | null;
}) {
  if (tendencia === "first") {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
        1ª compra
      </span>
    );
  }
  if (tendencia === "equal") {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        <Minus className="w-3 h-3 inline" /> Estável
      </span>
    );
  }
  const isUp = tendencia === "up";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
        isUp ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
      )}
    >
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {variacao !== null ? `${variacao > 0 ? "+" : ""}${variacao.toFixed(1)}%` : ""}
    </span>
  );
}

function DetailItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={clsx("text-sm mt-0.5", bold ? "font-bold text-gray-900" : "font-medium text-gray-700")}>
        {value}
      </p>
    </div>
  );
}
