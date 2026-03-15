"use client";

import { useState, useMemo } from "react";
import {
  Settings,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Package,
  Search,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { categorias, produtos, addCategoria, editCategoria, deleteCategoria } = useApp();

  const [novaCategoria, setNovaCategoria] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Contagem de produtos por categoria
  const contagem = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of produtos) {
      map[p.categoria] = (map[p.categoria] || 0) + 1;
    }
    return map;
  }, [produtos]);

  // Categorias filtradas
  const categoriasFiltradas = useMemo(() => {
    if (!search.trim()) return categorias;
    const q = search.toLowerCase();
    return categorias.filter((c) => c.nome.toLowerCase().includes(q));
  }, [categorias, search]);

  // ── Handlers ──

  function handleAdd() {
    const nome = novaCategoria.trim();
    if (!nome) {
      setAddError("Informe o nome da categoria.");
      return;
    }
    if (categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      setAddError("Já existe uma categoria com esse nome.");
      return;
    }
    addCategoria({ nome });
    setNovaCategoria("");
    setAddError("");
  }

  function handleStartEdit(id: string, nome: string) {
    setEditingId(id);
    setEditingNome(nome);
    setEditError("");
    setConfirmDeleteId(null);
  }

  function handleSaveEdit() {
    if (!editingId) return;
    const nome = editingNome.trim();
    if (!nome) {
      setEditError("O nome não pode ficar vazio.");
      return;
    }
    if (categorias.some((c) => c.id !== editingId && c.nome.toLowerCase() === nome.toLowerCase())) {
      setEditError("Já existe outra categoria com esse nome.");
      return;
    }
    editCategoria({ id: editingId, nome });
    setEditingId(null);
    setEditingNome("");
    setEditError("");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingNome("");
    setEditError("");
  }

  function handleDelete(id: string) {
    const cat = categorias.find((c) => c.id === id);
    if (!cat) return;
    const count = contagem[cat.nome] || 0;
    if (count > 0) {
      // Não permite excluir se há produtos usando
      return;
    }
    deleteCategoria(id);
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* ── Cabeçalho ── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50">
            <Settings className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-sm text-gray-500">
              Gerencie as categorias de produtos do sistema
            </p>
          </div>
        </div>
      </div>

      {/* ── Card de Categorias ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header do card */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50">
                <Tag className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Categorias de Produto</h2>
                <p className="text-xs text-gray-400">
                  {categorias.length} categoria{categorias.length !== 1 ? "s" : ""} cadastrada{categorias.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Busca */}
            {categorias.length > 5 && (
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Formulário para adicionar nova categoria */}
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Nova Categoria
          </p>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={novaCategoria}
                onChange={(e) => {
                  setNovaCategoria(e.target.value);
                  if (addError) setAddError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Nome da categoria (ex: Detergente)"
                className={clsx(
                  "w-full px-4 py-2.5 border rounded-xl text-sm transition",
                  "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                  addError ? "border-red-300 bg-red-50/50" : "border-gray-200 bg-white"
                )}
              />
              {addError && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3" /> {addError}
                </p>
              )}
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </div>

        {/* Lista de categorias */}
        <div className="divide-y divide-gray-50">
          {categoriasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100">
                <Tag className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {search ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}
              </p>
            </div>
          ) : (
            categoriasFiltradas.map((cat) => {
              const count = contagem[cat.nome] || 0;
              const isEditing = editingId === cat.id;
              const isConfirmingDelete = confirmDeleteId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={clsx(
                    "flex items-center gap-4 px-6 py-3.5 transition-colors",
                    isEditing ? "bg-brand-50/50" : "hover:bg-gray-50/80"
                  )}
                >
                  {/* Ícone / Badge */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 shrink-0">
                    <Tag className="w-3.5 h-3.5 text-gray-500" />
                  </div>

                  {/* Nome */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={editingNome}
                          onChange={(e) => {
                            setEditingNome(e.target.value);
                            if (editError) setEditError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          autoFocus
                          className={clsx(
                            "w-full px-3 py-1.5 border rounded-lg text-sm transition",
                            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                            editError ? "border-red-300 bg-red-50/50" : "border-gray-200 bg-white"
                          )}
                        />
                        {editError && (
                          <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                            <AlertCircle className="w-3 h-3" /> {editError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {cat.nome}
                      </p>
                    )}
                  </div>

                  {/* Contagem de produtos */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {count} produto{count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                          title="Salvar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : isConfirmingDelete ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 font-medium">Excluir?</span>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition"
                          title="Confirmar exclusão"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(cat.id, cat.nome)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (count > 0) return; // Desabilitado se tem produtos
                            setConfirmDeleteId(cat.id);
                          }}
                          disabled={count > 0}
                          className={clsx(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition",
                            count > 0
                              ? "text-gray-200 cursor-not-allowed"
                              : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                          )}
                          title={count > 0 ? `Não é possível excluir — ${count} produto(s) usando esta categoria` : "Excluir"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        {categorias.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Categorias vinculadas a produtos não podem ser excluídas.
              Renomear uma categoria atualiza todos os produtos automaticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
