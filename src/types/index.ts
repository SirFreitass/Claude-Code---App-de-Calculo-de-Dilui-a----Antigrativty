// ─────────────────────────────────────────────
// Enums / Literals
// ─────────────────────────────────────────────

export type Unidade = "L" | "Kg" | "Un";

export type TipoDiluicao = "Leve" | "Media" | "Pesada";

// Categoria agora é uma entidade dinâmica (CRUD via contexto)
export interface CategoriaEntity {
  id: string;
  nome: string;
}

/** Continua como string para compatibilidade — valor = CategoriaEntity.nome */
export type Categoria = string;

// ─────────────────────────────────────────────
// Entidades principais
// ─────────────────────────────────────────────

export interface Produto {
  id: string;
  nome: string;
  marca: string;
  categoria: Categoria;
  unidade: Unidade;
  descricao?: string;
  criadoEm: string; // ISO 8601
}

export interface Diluicao {
  id: string;
  produtoId: string;
  tipo: TipoDiluicao;
  /** Formato display "1:X", ex: "1:40". Derivado de fatorDiluicao. */
  proporcao: string;
  /**
   * Parte de diluente (água) para 1 parte de concentrado.
   * Ex: para "1:40", fatorDiluicao = 40.
   * É o dado computável — `proporcao` é apenas display.
   */
  fatorDiluicao: number;
  instrucaoDeUso: string;
}

export interface Estoque {
  id: string;
  produtoId: string;
  quantidadeAtual: number;
  alertaEstoqueMinimo: number;
  localizacao?: string;
}

export interface Compra {
  id: string;
  produtoId: string;
  data: string; // ISO 8601
  /**
   * Preço por unidade individual (R$/L, R$/Kg, R$/Un).
   * Se pagou R$144,50 por 5L → precoUnitario = 28.90
   */
  precoUnitario: number;
  quantidade: number;
  fornecedor: string;
  notaFiscal?: string;
}

// ─────────────────────────────────────────────
// Movimentação de Estoque
// ─────────────────────────────────────────────

export type TipoMovimentacao = "entrada" | "saida";

export interface MovimentoEstoque {
  id: string;
  produtoId: string;
  tipo: TipoMovimentacao;
  /** Quantidade em unidade do produto (L, Kg, Un). */
  quantidade: number;
  /** Motivo legível: "Diluição Leve 1:80 — 10L solução", "Compra #c7", etc. */
  motivo: string;
  /** Quem realizou (por enquanto texto livre). */
  responsavel: string;
  data: string; // ISO 8601
}

// ─────────────────────────────────────────────
// Tipos compostos (para uso na UI / queries)
// ─────────────────────────────────────────────

export interface ProdutoCompleto extends Produto {
  estoque: Estoque;
  diluicoes: Diluicao[];
  ultimaCompra?: Compra;
}

export interface ResumoEstoque {
  totalProdutos: number;
  produtosAbaixoMinimo: number;
  produtosEmFalta: number;
  valorTotalEstoque: number;
}

export interface ResumoCompras {
  totalComprasMes: number;
  gastoMes: number;
  gastoMesAnterior: number;
  variacaoPercentual: number;
}

// ─────────────────────────────────────────────
// Helpers de UI — Estoque
// ─────────────────────────────────────────────

export type StatusEstoque = "ok" | "baixo" | "critico" | "zerado";

export function getStatusEstoque(estoque: Estoque): StatusEstoque {
  if (estoque.quantidadeAtual === 0) return "zerado";
  if (estoque.quantidadeAtual <= estoque.alertaEstoqueMinimo * 0.5) return "critico";
  if (estoque.quantidadeAtual <= estoque.alertaEstoqueMinimo) return "baixo";
  return "ok";
}

// ─────────────────────────────────────────────
// Helpers de cálculo — Diluição
// ─────────────────────────────────────────────

/**
 * Extrai o fator numérico de uma string "A:B".
 * Normaliza para a base "1:X" → retorna X/A (a parte de diluente por 1 parte de concentrado).
 *
 * "1:40"  → 40
 * "2:80"  → 40  (normalizado)
 * "1:0"   → null (inválido — sem diluente)
 * "abc"   → null
 */
export function parseProporcao(raw: string): number | null {
  const match = raw.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const concentrado = parseFloat(match[1]);
  const diluente = parseFloat(match[2]);

  if (concentrado <= 0 || diluente < 0) return null;
  if (!Number.isFinite(concentrado) || !Number.isFinite(diluente)) return null;

  return diluente / concentrado;
}

/**
 * Gera a string de proporção normalizada a partir de um fator numérico.
 * 40 → "1:40"
 */
export function formatProporcao(fator: number): string {
  if (fator <= 0 || !Number.isFinite(fator)) return "—";
  // Se o fator é inteiro, mostra sem decimais
  const display = Number.isInteger(fator) ? fator.toString() : fator.toFixed(1);
  return `1:${display}`;
}

/**
 * Quantos litros de solução pronta 1L de concentrado rende.
 *
 * fatorDiluicao = 40 → 1L concentrado + 40L água = 41L de solução
 */
export function rendimentoPorLitro(fatorDiluicao: number): number {
  return 1 + fatorDiluicao;
}

// ─────────────────────────────────────────────
// Helpers de cálculo — Custo
// ─────────────────────────────────────────────

/**
 * Custo por litro de solução diluída.
 *
 * Ex: concentrado a R$28,90/L, diluição 1:40
 *     → 28.90 / (1 + 40) = R$0.7049 por litro pronto
 */
export function custoLitroDiluido(
  precoUnitario: number,
  fatorDiluicao: number
): number | null {
  if (precoUnitario < 0 || fatorDiluicao < 0) return null;
  const rendimento = rendimentoPorLitro(fatorDiluicao);
  if (rendimento === 0) return null;
  return precoUnitario / rendimento;
}

/**
 * Preço médio ponderado por quantidade comprada.
 *
 * Compra A: 2L a R$30/L → peso = 2
 * Compra B: 8L a R$25/L → peso = 8
 * Resultado: (2×30 + 8×25) / (2+8) = R$26,00/L
 */
export function precoMedioPonderado(compras: Compra[]): number | null {
  if (compras.length === 0) return null;

  let somaValor = 0;
  let somaQuantidade = 0;

  for (const c of compras) {
    somaValor += c.precoUnitario * c.quantidade;
    somaQuantidade += c.quantidade;
  }

  if (somaQuantidade === 0) return null;
  return somaValor / somaQuantidade;
}

/**
 * Custo total de uma compra (derivado, nunca armazenado).
 */
export function custoTotalCompra(compra: Compra): number {
  return compra.precoUnitario * compra.quantidade;
}
