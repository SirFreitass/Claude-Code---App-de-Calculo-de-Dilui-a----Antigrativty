import type {
  CategoriaEntity,
  Produto,
  Diluicao,
  Estoque,
  Compra,
  MovimentoEstoque,
} from "@/types";

// ─────────────────────────────────────────────
// Categorias padrão  (o único seed que mantemos)
// ─────────────────────────────────────────────

export const defaultCategorias: CategoriaEntity[] = [
  { id: "cat1", nome: "Limpeza Geral" },
  { id: "cat2", nome: "Desengraxantes" },
  { id: "cat3", nome: "Desinfetantes" },
  { id: "cat4", nome: "Sanitizantes" },
  { id: "cat5", nome: "Desincrustantes" },
  { id: "cat6", nome: "Aromatizantes" },
];

// ─────────────────────────────────────────────
// Arrays vazios  (app limpo — dados reais via UI)
// ─────────────────────────────────────────────

export const defaultProdutos: Produto[] = [];
export const defaultDiluicoes: Diluicao[] = [];
export const defaultEstoques: Estoque[] = [];
export const defaultCompras: Compra[] = [];
export const defaultMovimentacoes: MovimentoEstoque[] = [];
