"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type { CategoriaEntity, Produto, Diluicao, Estoque, Compra, MovimentoEstoque } from "@/types";
import {
  mockCategorias,
  mockProdutos,
  mockDiluicoes,
  mockEstoques,
  mockCompras,
  mockMovimentacoes,
} from "@/lib/mock-data";

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
  categorias: mockCategorias,
  produtos: mockProdutos,
  diluicoes: mockDiluicoes,
  estoques: mockEstoques,
  compras: mockCompras,
  movimentacoes: mockMovimentacoes,
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

export interface RegistrarSaidaPayload {
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
}

export interface EditCategoriaPayload {
  id: string;
  nome: string;
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

type AppAction =
  | { type: "ADD_PRODUTO"; payload: AddProdutoPayload }
  | { type: "REGISTRAR_SAIDA"; payload: RegistrarSaidaPayload }
  | { type: "ADD_COMPRA"; payload: AddCompraPayload }
  | { type: "ADD_CATEGORIA"; payload: AddCategoriaPayload }
  | { type: "EDIT_CATEGORIA"; payload: EditCategoriaPayload }
  | { type: "DELETE_CATEGORIA"; payload: { id: string } };

// ─────────────────────────────────────────────
// Gerador de ID único
// ─────────────────────────────────────────────

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─────────────────────────────────────────────
// Reducer (transição atômica — um único "return")
// ─────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_PRODUTO": {
      const { produto: pData, diluicoes: dData, estoque: eData, compra: cData } =
        action.payload;

      const produtoId = genId("p");
      const now = new Date().toISOString();

      const novoProduto: Produto = { ...pData, id: produtoId, criadoEm: now };

      const novasDiluicoes: Diluicao[] = dData.map((d) => ({
        ...d,
        id: genId("d"),
        produtoId,
      }));

      const novoEstoque: Estoque = { ...eData, id: genId("e"), produtoId };

      const novaCompra: Compra | null = cData
        ? { ...cData, id: genId("c"), produtoId }
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
        id: genId("m"),
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

    case "ADD_COMPRA": {
      const { produtoId, precoUnitario, quantidade, fornecedor, notaFiscal, data } =
        action.payload;

      const compraId = genId("c");

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
        id: genId("m"),
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

    case "ADD_CATEGORIA": {
      const novaCategoria: CategoriaEntity = {
        id: genId("cat"),
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

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Contrato público do contexto
// ─────────────────────────────────────────────

interface AppContextValue extends AppState {
  dispatch: Dispatch<AppAction>;
  /** Atalho semântico — despacha ADD_PRODUTO. */
  addProduto: (payload: AddProdutoPayload) => void;
  /** Atalho semântico — despacha REGISTRAR_SAIDA (retirada de estoque). */
  registrarSaida: (payload: RegistrarSaidaPayload) => void;
  /** Atalho semântico — despacha ADD_COMPRA (entrada de mercadoria). */
  addCompra: (payload: AddCompraPayload) => void;
  /** Atalho semântico — despacha ADD_CATEGORIA. */
  addCategoria: (payload: AddCategoriaPayload) => void;
  /** Atalho semântico — despacha EDIT_CATEGORIA. */
  editCategoria: (payload: EditCategoriaPayload) => void;
  /** Atalho semântico — despacha DELETE_CATEGORIA. */
  deleteCategoria: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  const addProduto = (payload: AddProdutoPayload) => {
    dispatch({ type: "ADD_PRODUTO", payload });
  };

  const registrarSaida = (payload: RegistrarSaidaPayload) => {
    dispatch({ type: "REGISTRAR_SAIDA", payload });
  };

  const addCompra = (payload: AddCompraPayload) => {
    dispatch({ type: "ADD_COMPRA", payload });
  };

  const addCategoria = (payload: AddCategoriaPayload) => {
    dispatch({ type: "ADD_CATEGORIA", payload });
  };

  const editCategoria = (payload: EditCategoriaPayload) => {
    dispatch({ type: "EDIT_CATEGORIA", payload });
  };

  const deleteCategoria = (id: string) => {
    dispatch({ type: "DELETE_CATEGORIA", payload: { id } });
  };

  return (
    <AppContext.Provider value={{ ...state, dispatch, addProduto, registrarSaida, addCompra, addCategoria, editCategoria, deleteCategoria }}>
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
