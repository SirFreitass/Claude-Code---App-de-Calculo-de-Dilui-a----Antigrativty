"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
} from "react";
import type { CategoriaEntity, Produto, Diluicao, Estoque, Compra, MovimentoEstoque } from "@/types";
import {
  defaultCategorias,
  defaultProdutos,
  defaultDiluicoes,
  defaultEstoques,
  defaultCompras,
  defaultMovimentacoes,
} from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import {
  fetchAll,
  dbAddProduto,
  dbEditProduto,
  dbDeleteProduto,
  dbUpdateEstoque,
  dbAddCompra,
  dbUpdateCompra,
  dbDeleteCompra,
  dbAddMovimentacao,
  dbAddCategoria,
  dbEditCategoria,
  dbDeleteCategoria,
} from "@/lib/supabase-sync";

// ─────────────────────────────────────────────
// Estado unificado
// ─────────────────────────────────────────────

interface AppState {
  categorias: CategoriaEntity[];
  produtos: Produto[];
  diluicoes: Diluicao[];
  estoques: Estoque[];
  compras: Compra[];
  movimentacoes: MovimentoEstoque[];
}

const INITIAL_STATE: AppState = {
  categorias: defaultCategorias,
  produtos: defaultProdutos,
  diluicoes: defaultDiluicoes,
  estoques: defaultEstoques,
  compras: defaultCompras,
  movimentacoes: defaultMovimentacoes,
};

// ─────────────────────────────────────────────
// Tipos de entrada (sem IDs — gerados pelo reducer)
// ─────────────────────────────────────────────

export interface AddProdutoPayload {
  produto: Omit<Produto, "id" | "criadoEm">;
  diluicoes: Omit<Diluicao, "id" | "produtoId">[];
  estoque: Omit<Estoque, "id" | "produtoId">;
  compra?: Omit<Compra, "id" | "produtoId">;
}

export interface EditProdutoPayload {
  produto: Omit<Produto, "criadoEm">;
  diluicoes: Omit<Diluicao, "id" | "produtoId">[];
  estoque: Pick<Estoque, "alertaEstoqueMinimo">;
}

export interface RegistrarSaidaPayload {
  produtoId: string;
  /** Quantidade em unidade do produto (L, Kg, Un). */
  quantidade: number;
  motivo: string;
  responsavel: string;
}

export interface RegistrarEntradaPayload {
  produtoId: string;
  /** Quantidade em unidade do produto (L, Kg, Un). */
  quantidade: number;
  motivo: string;
  responsavel: string;
}

export interface AddCompraPayload {
  produtoId: string;
  precoUnitario: number;
  quantidade: number;
  fornecedor: string;
  notaFiscal?: string;
  data: string; // ISO 8601
}

export interface AddCategoriaPayload {
  nome: string;
  id?: string;
}

export interface EditCategoriaPayload {
  id: string;
  nome: string;
}

export interface UpdateCompraPayload {
  id: string;
  precoUnitario: number;
  quantidade: number;
  fornecedor: string;
  notaFiscal?: string;
}

export interface DeleteCompraPayload {
  id: string;
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

type AppAction =
  | { type: "ADD_PRODUTO"; payload: AddProdutoPayload }
  | { type: "EDIT_PRODUTO"; payload: EditProdutoPayload }
  | { type: "DELETE_PRODUTO"; payload: { id: string } }
  | { type: "REGISTRAR_SAIDA"; payload: RegistrarSaidaPayload }
  | { type: "REGISTRAR_ENTRADA"; payload: RegistrarEntradaPayload }
  | { type: "ADD_COMPRA"; payload: AddCompraPayload }
  | { type: "UPDATE_COMPRA"; payload: UpdateCompraPayload }
  | { type: "DELETE_COMPRA"; payload: DeleteCompraPayload }
  | { type: "ADD_CATEGORIA"; payload: AddCategoriaPayload }
  | { type: "EDIT_CATEGORIA"; payload: EditCategoriaPayload }
  | { type: "DELETE_CATEGORIA"; payload: { id: string } }
  | { type: "_HYDRATE"; payload: Partial<AppState> };

// ─────────────────────────────────────────────
// Gerador de ID único
// ─────────────────────────────────────────────

let idCounter = 0;
function genId(): string {
  return crypto.randomUUID(); // Isso gera um UUID v4 válido (ex: 123e4567-e89b...)
}

// ─────────────────────────────────────────────
// Reducer (transição atômica — um único "return")
// ─────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_PRODUTO": {
      const { produto: pData, diluicoes: dData, estoque: eData, compra: cData } =
        action.payload;

      const produtoId = genId();
      const now = new Date().toISOString();

      const novoProduto: Produto = { ...pData, id: produtoId, criadoEm: now };

      const novasDiluicoes: Diluicao[] = dData.map((d) => ({
        ...d,
        id: genId(),
        produtoId,
      }));

      const novoEstoque: Estoque = { ...eData, id: genId(), produtoId };

      const novaCompra: Compra | null = cData
        ? { ...cData, id: genId(), produtoId }
        : null;

      return {
        ...state,
        produtos: [...state.produtos, novoProduto],
        diluicoes: [...state.diluicoes, ...novasDiluicoes],
        estoques: [...state.estoques, novoEstoque],
        compras: novaCompra
          ? [...state.compras, novaCompra]
          : state.compras,
      };
    }

    case "EDIT_PRODUTO": {
      const { produto: pData, diluicoes: dData, estoque: eData } = action.payload;

      // 1. Atualizar dados básicos do Produto
      const produtos = state.produtos.map((p) =>
        p.id === pData.id ? { ...p, ...pData } : p
      );

      // 2. Substituir todas as diluições deste produto
      const diluicoesLimpas = state.diluicoes.filter((d) => d.produtoId !== pData.id);
      const novasDiluicoes: Diluicao[] = dData.map((d) => ({
        ...d,
        id: genId(),
        produtoId: pData.id,
      }));
      const diluicoes = [...diluicoesLimpas, ...novasDiluicoes];

      // 3. Atualizar Ponto de Pedido no Estoque (Preservando Quantidade)
      const estoques = state.estoques.map((e) =>
        e.produtoId === pData.id
          ? { ...e, alertaEstoqueMinimo: eData.alertaEstoqueMinimo }
          : e
      );

      return {
        ...state,
        produtos,
        diluicoes,
        estoques,
      };
    }

    case "DELETE_PRODUTO": {
      return {
        ...state,
        produtos: state.produtos.filter((p) => p.id !== action.payload.id),
      };
    }

    case "REGISTRAR_SAIDA": {
      const { produtoId, quantidade, motivo, responsavel } = action.payload;

      // Atualizar estoque: subtrair quantidade (mín. 0)
      const estoques = state.estoques.map((e) =>
        e.produtoId === produtoId
          ? { ...e, quantidadeAtual: Math.max(0, +(e.quantidadeAtual - quantidade).toFixed(4)) }
          : e
      );

      // Criar registro de movimentação
      const novaMovimentacao: MovimentoEstoque = {
        id: genId(),
        produtoId,
        tipo: "saida",
        quantidade,
        motivo,
        responsavel,
        data: new Date().toISOString(),
      };

      return {
        ...state,
        estoques,
        movimentacoes: [...state.movimentacoes, novaMovimentacao],
      };
    }

    case "REGISTRAR_ENTRADA": {
      const { produtoId, quantidade, motivo, responsavel } = action.payload;

      // Atualizar estoque: somar quantidade
      const estoques = state.estoques.map((e) =>
        e.produtoId === produtoId
          ? { ...e, quantidadeAtual: +(e.quantidadeAtual + quantidade).toFixed(4) }
          : e
      );

      // Criar registro de movimentação de entrada avulsa
      const novaMovimentacao: MovimentoEstoque = {
        id: genId(),
        produtoId,
        tipo: "entrada",
        quantidade,
        motivo,
        responsavel,
        data: new Date().toISOString(),
      };

      return {
        ...state,
        estoques,
        movimentacoes: [...state.movimentacoes, novaMovimentacao],
      };
    }

    case "ADD_COMPRA": {
      const { produtoId, precoUnitario, quantidade, fornecedor, notaFiscal, data } =
        action.payload;

      const compraId = genId();

      // Nova compra
      const novaCompra: Compra = {
        id: compraId,
        produtoId,
        precoUnitario,
        quantidade,
        fornecedor,
        data,
        ...(notaFiscal ? { notaFiscal } : {}),
      };

      // Somar ao estoque
      const estoques = state.estoques.map((e) =>
        e.produtoId === produtoId
          ? { ...e, quantidadeAtual: +(e.quantidadeAtual + quantidade).toFixed(4) }
          : e
      );

      // Movimentação de entrada
      const movEntrada: MovimentoEstoque = {
        id: genId(),
        produtoId,
        tipo: "entrada",
        quantidade,
        motivo: `Compra #${compraId} — ${fornecedor}`,
        responsavel: "Compras",
        data,
      };

      return {
        ...state,
        compras: [...state.compras, novaCompra],
        estoques,
        movimentacoes: [...state.movimentacoes, movEntrada],
      };
    }

    case "UPDATE_COMPRA": {
      const { id, precoUnitario, quantidade, fornecedor, notaFiscal } = action.payload;
      const compraOriginal = state.compras.find((c) => c.id === id);
      if (!compraOriginal) return state;

      const diff = quantidade - compraOriginal.quantidade;

      // Atualizar a compra
      const compras = state.compras.map((c) =>
        c.id === id
          ? { ...c, precoUnitario, quantidade, fornecedor, ...(notaFiscal !== undefined ? { notaFiscal } : {}) }
          : c
      );

      // Ajustar estoque com a diferença
      const estoques = state.estoques.map((e) =>
        e.produtoId === compraOriginal.produtoId
          ? { ...e, quantidadeAtual: Math.max(0, +(e.quantidadeAtual + diff).toFixed(4)) }
          : e
      );

      // Registrar movimentação apenas se houve diferença
      const movimentacoes = diff !== 0
        ? [
          ...state.movimentacoes,
          {
            id: genId(),
            produtoId: compraOriginal.produtoId,
            tipo: (diff > 0 ? "entrada" : "saida") as "entrada" | "saida",
            quantidade: Math.abs(diff),
            motivo: `Ajuste de Compra (Edição) — ${fornecedor}`,
            responsavel: "Compras",
            data: new Date().toISOString(),
          },
        ]
        : state.movimentacoes;

      return { ...state, compras, estoques, movimentacoes };
    }

    case "DELETE_COMPRA": {
      const compra = state.compras.find((c) => c.id === action.payload.id);
      if (!compra) return state;

      const estoqueAtual = state.estoques.find((e) => e.produtoId === compra.produtoId);
      // Bloquear se resultaria em estoque negativo
      if (estoqueAtual && estoqueAtual.quantidadeAtual < compra.quantidade) {
        return state; // Safety — caller deve validar antes
      }

      const compras = state.compras.filter((c) => c.id !== action.payload.id);
      const estoques = state.estoques.map((e) =>
        e.produtoId === compra.produtoId
          ? { ...e, quantidadeAtual: Math.max(0, +(e.quantidadeAtual - compra.quantidade).toFixed(4)) }
          : e
      );

      const movExclusao: MovimentoEstoque = {
        id: genId(),
        produtoId: compra.produtoId,
        tipo: "saida",
        quantidade: compra.quantidade,
        motivo: `Ajuste de Compra (Exclusão) — ${compra.fornecedor}`,
        responsavel: "Compras",
        data: new Date().toISOString(),
      };

      return {
        ...state,
        compras,
        estoques,
        movimentacoes: [...state.movimentacoes, movExclusao],
      };
    }

    case "ADD_CATEGORIA": {
      // Se o payload já trouxer um ID (vindo do Supabase), usamos ele. 
      // Se não, deixamos vazio para o banco gerar.
      const novaCategoria: CategoriaEntity = {
        id: action.payload.id || "",
        nome: action.payload.nome.trim(),
      };
      return { ...state, categorias: [...state.categorias, novaCategoria] };
    }

    case "EDIT_CATEGORIA": {
      const { id, nome } = action.payload;
      const nomeAnterior = state.categorias.find((c) => c.id === id)?.nome;

      // Atualizar a entidade de categoria
      const categorias = state.categorias.map((c) =>
        c.id === id ? { ...c, nome: nome.trim() } : c
      );

      // Propagar renomeação aos produtos que usam essa categoria
      const produtos = nomeAnterior
        ? state.produtos.map((p) =>
          p.categoria === nomeAnterior ? { ...p, categoria: nome.trim() } : p
        )
        : state.produtos;

      return { ...state, categorias, produtos };
    }

    case "DELETE_CATEGORIA": {
      return {
        ...state,
        categorias: state.categorias.filter((c) => c.id !== action.payload.id),
      };
    }

    case "_HYDRATE": {
      return { ...state, ...action.payload };
    }

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Contrato público do contexto
// ─────────────────────────────────────────────

interface AppContextValue extends AppState {
  dispatch: Dispatch<AppAction>;
  loading: boolean;
  addProduto: (payload: AddProdutoPayload) => void;
  editProduto: (payload: EditProdutoPayload) => void;
  deleteProduto: (id: string) => void;
  registrarSaida: (payload: RegistrarSaidaPayload) => void;
  registrarEntrada: (payload: RegistrarEntradaPayload) => void;
  addCompra: (payload: AddCompraPayload) => void;
  updateCompra: (payload: UpdateCompraPayload) => void;
  deleteCompra: (payload: DeleteCompraPayload) => void;
  addCategoria: (payload: AddCategoriaPayload) => void;
  editCategoria: (payload: EditCategoriaPayload) => void;
  deleteCategoria: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─────────────────────────────────────────────
// Provider (Supabase-backed)
// ─────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const stateRef = useRef(state);
  stateRef.current = state; // always up to date for async callbacks

  // ── Fetch inicial do Supabase ──
  useEffect(() => {
    fetchAll()
      .then((data) => {
        dispatch({ type: "_HYDRATE", payload: data });
      })
      .catch((err) => console.error("Fetch Supabase falhou:", err))
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers: resolver categoria nome→id (para FK no DB) ──
  const getCategoriaId = (nome: string): string => {
    const cat = stateRef.current.categorias.find((c) => c.nome === nome);
    return cat?.id ?? "";
  };

  // ── Actions com sync Supabase ──

  const addProduto = (payload: AddProdutoPayload) => {
    dispatch({ type: "ADD_PRODUTO", payload });
    setTimeout(async () => {
      const s = stateRef.current;
      const novoProduto = s.produtos[s.produtos.length - 1];
      if (!novoProduto) return;
      const novasDils = s.diluicoes.filter((d) => d.produtoId === novoProduto.id);
      const novoEstoque = s.estoques.find((e) => e.produtoId === novoProduto.id);
      const novaCompra = payload.compra ? s.compras.find((c) => c.produtoId === novoProduto.id) ?? null : null;
      const novaMov = s.movimentacoes.find((m) => m.produtoId === novoProduto.id && m.motivo.includes("Compra")) ?? null;
      const catId = getCategoriaId(novoProduto.categoria);
      
      const realId = await dbAddProduto(novoProduto, catId, novasDils, novoEstoque!, novaCompra, novaMov);
      if (realId) {
        fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
      }
    }, 0);
  };

  const editProduto = (payload: EditProdutoPayload) => {
    dispatch({ type: "EDIT_PRODUTO", payload });
    setTimeout(async () => {
      const s = stateRef.current;
      const prod = s.produtos.find((p) => p.id === payload.produto.id);
      if (!prod) return;
      const dils = s.diluicoes.filter((d) => d.produtoId === prod.id);
      const catId = getCategoriaId(prod.categoria);
      await dbEditProduto(prod, catId, dils, payload.estoque.alertaEstoqueMinimo);
      fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
    }, 0);
  };

  const deleteProduto = (id: string) => {
    dispatch({ type: "DELETE_PRODUTO", payload: { id } });
    setTimeout(async () => {
      await dbDeleteProduto(id);
      fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
    }, 0);
  };

  const registrarSaida = (payload: RegistrarSaidaPayload) => {
    dispatch({ type: "REGISTRAR_SAIDA", payload });
    setTimeout(async () => {
      const s = stateRef.current;
      const est = s.estoques.find((e) => e.produtoId === payload.produtoId);
      if (est) await dbUpdateEstoque(payload.produtoId, est.quantidadeAtual);
      const mov = s.movimentacoes[s.movimentacoes.length - 1];
      if (mov) await dbAddMovimentacao(mov);
      fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
    }, 0);
  };

  const registrarEntrada = (payload: RegistrarEntradaPayload) => {
    dispatch({ type: "REGISTRAR_ENTRADA", payload });
    setTimeout(async () => {
      const s = stateRef.current;
      const est = s.estoques.find((e) => e.produtoId === payload.produtoId);
      if (est) await dbUpdateEstoque(payload.produtoId, est.quantidadeAtual);
      const mov = s.movimentacoes[s.movimentacoes.length - 1];
      if (mov) await dbAddMovimentacao(mov);
      fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
    }, 0);
  };

  const addCompra = (payload: AddCompraPayload) => {
    dispatch({ type: "ADD_COMPRA", payload });
    setTimeout(async () => {
      const s = stateRef.current;
      const compra = s.compras[s.compras.length - 1];
      if (compra) await dbAddCompra(compra);
      const est = s.estoques.find((e) => e.produtoId === payload.produtoId);
      if (est) await dbUpdateEstoque(payload.produtoId, est.quantidadeAtual);
      const mov = s.movimentacoes[s.movimentacoes.length - 1];
      if (mov) await dbAddMovimentacao(mov);
      fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
    }, 0);
  };

  const updateCompra = (payload: UpdateCompraPayload) => {
    dispatch({ type: "UPDATE_COMPRA", payload });
    setTimeout(async () => {
      await dbUpdateCompra(payload);
      const s = stateRef.current;
      const compraOriginal = s.compras.find((c) => c.id === payload.id);
      if (compraOriginal) {
        const est = s.estoques.find((e) => e.produtoId === compraOriginal.produtoId);
        if (est) await dbUpdateEstoque(compraOriginal.produtoId, est.quantidadeAtual);
      }
      // Movimentação de ajuste (se houve diff)
      const mov = s.movimentacoes[s.movimentacoes.length - 1];
      if (mov && mov.motivo.includes("Ajuste de Compra")) await dbAddMovimentacao(mov);
      fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
    }, 0);
  };

  const deleteCompra = (payload: DeleteCompraPayload) => {
    const compra = stateRef.current.compras.find((c) => c.id === payload.id);
    dispatch({ type: "DELETE_COMPRA", payload });
    if (compra) {
      setTimeout(async () => {
        await dbDeleteCompra(payload.id);
        const s = stateRef.current;
        const est = s.estoques.find((e) => e.produtoId === compra.produtoId);
        if (est) await dbUpdateEstoque(compra.produtoId, est.quantidadeAtual);
        const mov = s.movimentacoes[s.movimentacoes.length - 1];
        if (mov && mov.motivo.includes("Ajuste de Compra")) await dbAddMovimentacao(mov);
        fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
      }, 0);
    }
  };

  const addCategoria = (payload: AddCategoriaPayload) => {
    dispatch({ type: "ADD_CATEGORIA", payload });
    setTimeout(async () => {
      const s = stateRef.current;
      const cat = s.categorias[s.categorias.length - 1];
      if (cat) {
        await dbAddCategoria(cat);
        fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
      }
    }, 0);
  };

  const editCategoria = (payload: EditCategoriaPayload) => {
    dispatch({ type: "EDIT_CATEGORIA", payload });
    setTimeout(async () => {
      await dbEditCategoria(payload.id, payload.nome);
      // Propagar renomeação nos produtos no DB
      const s = stateRef.current;
      const prodsAfetados = s.produtos.filter((p) => p.categoria === payload.nome.trim());
      for (const p of prodsAfetados) {
        await supabase.from("produtos").update({ categoria_id: payload.id }).eq("id", p.id);
      }
      fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
    }, 0);
  };

  const deleteCategoria = (id: string) => {
    dispatch({ type: "DELETE_CATEGORIA", payload: { id } });
    setTimeout(async () => {
      await dbDeleteCategoria(id);
      fetchAll().then(data => dispatch({ type: "_HYDRATE", payload: data }));
    }, 0);
  };

  return (
    <AppContext.Provider value={{
      ...state, dispatch, loading,
      addProduto, editProduto, deleteProduto, registrarSaida, registrarEntrada,
      addCompra, updateCompra, deleteCompra,
      addCategoria, editCategoria, deleteCategoria,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
