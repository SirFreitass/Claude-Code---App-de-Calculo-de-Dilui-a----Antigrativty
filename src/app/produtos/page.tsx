"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Package,
  FlaskConical,
  AlertTriangle,
  Eye,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import { getStatusEstoque, precoMedioPonderado, type StatusEstoque, type Categoria } from "@/types";
import { NovoProdutoModal } from "@/components/produtos/NovoProdutoModal";
import { DetalhesProdutoModal } from "@/components/produtos/DetalhesProdutoModal";

// ─────────────────────────────────────────────
// Config de status
// ─────────────────────────────────────────────

const STATUS_CFG: Record<StatusEstoque, { label: string; cls: string; dot: string }> = {
  ok:      { label: "OK",           cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  baixo:   { label: "Baixo",        cls: "bg-amber-50 text-amber-700",     dot: "bg-amber-500"   },
  critico: { label: "Crítico",      cls: "bg-orange-50 text-orange-700",   dot: "bg-orange-500"  },
  zerado:  { label: "Sem estoque",  cls: "bg-red-50 text-red-700",         dot: "bg-red-500"     },
};

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

type SortField = "nome" | "categoria" | "estoque" | "preco";
type SortDir = "asc" | "desc";

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function ProdutosPage() {
  const { produtos, estoques, compras, diluicoes, categorias: categoriasContexto } = useApp();

  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<Categoria | "">("");
  const [sortField, setSortField]   = useState<SortField>("nome");
  const [sortDir, setSortDir]       = useState<SortDir>("asc");
  const [modalOpen, setModalOpen]   = useState(false);
  const [detalhesId, setDetalhesId] = useState<string | null>(null);

  // ── Lista enriquecida + filtros + ordenação ──
  const produtosList = useMemo(() => {
    const list = produtos.map((p) => {
      const estoque    = estoques.find((e) => e.produtoId === p.id);
      const pCompras   = compras.filter((c) => c.produtoId === p.id);
      const precoMedio = precoMedioPonderado(pCompras);
      const dils       = diluicoes.filter((d) => d.produtoId === p.id);
      const status     = estoque ? getStatusEstoque(estoque) : ("zerado" as StatusEstoque);
      return { ...p, estoque, precoMedio, dils, status };
    });

    // Filtrar
    const filtered = list.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q);
      const matchCat = !filterCat || p.categoria === filterCat;
      return matchSearch && matchCat;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === "nome")      cmp = a.nome.localeCompare(b.nome);
      if (sortField === "categoria") cmp = a.categoria.localeCompare(b.categoria);
      if (sortField === "estoque")   cmp = (a.estoque?.quantidadeAtual ?? 0) - (b.estoque?.quantidadeAtual ?? 0);
      if (sortField === "preco")     cmp = (a.precoMedio ?? 0) - (b.precoMedio ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [produtos, estoques, compras, diluicoes, search, filterCat, sortField, sortDir]);

  // ── Helpers ──
  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-brand-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // ── Resumo de alertas ──
  const alertaCount = produtosList.filter((p) => p.status !== "ok").length;

  return (
    <div className="flex flex-col gap-6 p-8">

      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {produtos.length} produto{produtos.length !== 1 ? "s" : ""} cadastrado
            {produtos.length !== 1 ? "s" : ""}
            {alertaCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                {alertaCount} com alerta de estoque
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* ── Barra de busca e filtros ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Busca */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, marca ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro de categoria */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as Categoria | "")}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-600"
        >
          <option value="">Todas as categorias</option>
          {categoriasContexto.map((c) => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
        </select>

        {/* Badge de resultados quando filtrando */}
        {(search || filterCat) && (
          <span className="text-xs text-gray-500">
            {produtosList.length} resultado{produtosList.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Tabela ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th
                onClick={() => toggleSort("nome")}
                className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
              >
                Produto <SortIcon field="nome" />
              </th>
              <th
                onClick={() => toggleSort("categoria")}
                className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
              >
                Categoria <SortIcon field="categoria" />
              </th>
              <th
                onClick={() => toggleSort("estoque")}
                className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
              >
                Estoque Atual <SortIcon field="estoque" />
              </th>
              <th
                onClick={() => toggleSort("preco")}
                className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
              >
                Preço Médio <SortIcon field="preco" />
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Diluições
              </th>
              <th className="px-5 py-3.5 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {produtosList.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {search || filterCat
                        ? "Nenhum produto encontrado para esta busca."
                        : "Nenhum produto cadastrado ainda."}
                    </p>
                    {!search && !filterCat && (
                      <button
                        onClick={() => setModalOpen(true)}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        Cadastrar primeiro produto →
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              produtosList.map((produto) => {
                const cfg = STATUS_CFG[produto.status];
                return (
                  <tr
                    key={produto.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    {/* Produto */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50 shrink-0">
                          <Package className="w-4 h-4 text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">
                            {produto.nome}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{produto.marca}</p>
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {produto.categoria}
                      </span>
                    </td>

                    {/* Estoque */}
                    <td className="px-5 py-4">
                      {produto.estoque ? (
                        <div className="flex items-center gap-2">
                          <div className={clsx("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                          <span className="font-medium text-gray-900">
                            {produto.estoque.quantidadeAtual}{" "}
                            <span className="text-gray-400 font-normal">{produto.unidade}</span>
                          </span>
                          <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.cls)}>
                            {cfg.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Preço Médio */}
                    <td className="px-5 py-4">
                      {produto.precoMedio !== null ? (
                        <div>
                          <span className="font-medium text-gray-900">
                            R$ {produto.precoMedio.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-400">/{produto.unidade}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sem compras</span>
                      )}
                    </td>

                    {/* Diluições */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700">
                          {produto.dils.length}
                          <span className="text-gray-400 text-xs"> faixa{produto.dils.length !== 1 ? "s" : ""}</span>
                        </span>
                        {produto.dils.length === 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Sem diluição
                          </span>
                        )}
                      </div>
                      {/* Mini badges das faixas */}
                      {produto.dils.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {produto.dils.map((d) => (
                            <span
                              key={d.id}
                              className={clsx(
                                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                d.tipo === "Leve"   && "bg-emerald-50 text-emerald-700",
                                d.tipo === "Media"  && "bg-amber-50 text-amber-700",
                                d.tipo === "Pesada" && "bg-red-50 text-red-700"
                              )}
                            >
                              {d.tipo} {d.proporcao}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4">
                      <button 
                        onClick={() => setDetalhesId(produto.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Rodapé da tabela */}
        {produtosList.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Exibindo {produtosList.length} de {produtos.length} produto{produtos.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      <NovoProdutoModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <DetalhesProdutoModal 
        produtoId={detalhesId} 
        open={!!detalhesId} 
        onClose={() => setDetalhesId(null)} 
      />
    </div>
  );
}
