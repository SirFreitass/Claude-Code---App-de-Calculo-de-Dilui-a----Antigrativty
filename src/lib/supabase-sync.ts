/**
 * supabase-sync.ts
 *
 * Camada de sincronização Supabase ↔ AppState.
 * Responsável pelo mapeamento snake_case (DB) ↔ camelCase (TS)
 * e todas as operações CRUD atômicas.
 */

import { supabase } from "./supabase";
import type {
  CategoriaEntity,
  Produto,
  Diluicao,
  Estoque,
  Compra,
  MovimentoEstoque,
} from "@/types";

// ─────────────────────────────────────────────
// Tipos de linha do DB (snake_case)
// ─────────────────────────────────────────────

interface DbProduto {
  id: string;
  nome: string;
  marca: string;
  categoria_id: string;
  unidade: string;
  descricao: string | null;
  ponto_pedido: number;
  created_at: string;
}

interface DbDiluicao {
  id: string;
  produto_id: string;
  tipo: string;
  proporcao: string;
  fator_diluicao: number;
  instrucao_de_uso: string;
}

interface DbEstoque {
  id: string;
  produto_id: string;
  quantidade_atual: number;
}

interface DbCompra {
  id: string;
  produto_id: string;
  data: string;
  preco_unitario: number;
  quantidade: number;
  fornecedor: string;
  nota_fiscal: string | null;
}

interface DbMovimentacao {
  id: string;
  produto_id: string;
  tipo: string;
  quantidade: number;
  motivo: string;
  responsavel: string;
  data: string;
}

// ─────────────────────────────────────────────
// Mapeadores DB → TS
// ─────────────────────────────────────────────

function mapCategoria(row: { id: string; nome: string }): CategoriaEntity {
  return { id: row.id, nome: row.nome };
}

function mapProduto(row: DbProduto, categoriaNome: string): Produto {
  return {
    id: row.id,
    nome: row.nome,
    marca: row.marca,
    categoria: categoriaNome,
    unidade: row.unidade as Produto["unidade"],
    descricao: row.descricao ?? undefined,
    criadoEm: row.created_at,
  };
}

function mapDiluicao(row: DbDiluicao): Diluicao {
  return {
    id: row.id,
    produtoId: row.produto_id,
    tipo: row.tipo as Diluicao["tipo"],
    proporcao: row.proporcao,
    fatorDiluicao: Number(row.fator_diluicao),
    instrucaoDeUso: row.instrucao_de_uso,
  };
}

/** Estoque TS inclui alertaEstoqueMinimo que mora em produtos.ponto_pedido no DB */
function mapEstoque(row: DbEstoque, pontoPedido: number): Estoque {
  return {
    id: row.id,
    produtoId: row.produto_id,
    quantidadeAtual: Number(row.quantidade_atual),
    alertaEstoqueMinimo: pontoPedido,
  };
}

function mapCompra(row: DbCompra): Compra {
  return {
    id: row.id,
    produtoId: row.produto_id,
    data: row.data,
    precoUnitario: Number(row.preco_unitario),
    quantidade: Number(row.quantidade),
    fornecedor: row.fornecedor,
    notaFiscal: row.nota_fiscal ?? undefined,
  };
}

function mapMovimentacao(row: DbMovimentacao): MovimentoEstoque {
  return {
    id: row.id,
    produtoId: row.produto_id,
    tipo: row.tipo as MovimentoEstoque["tipo"],
    quantidade: Number(row.quantidade),
    motivo: row.motivo,
    responsavel: row.responsavel,
    data: row.data,
  };
}

// ─────────────────────────────────────────────
// FETCH ALL — carregamento inicial
// ─────────────────────────────────────────────

export async function fetchAll() {
  const [catRes, prodRes, dilRes, estRes, compRes, movRes] = await Promise.all([
    supabase.from("categorias").select("*"),
    supabase.from("produtos").select("*"),
    supabase.from("diluicoes").select("*"),
    supabase.from("estoque").select("*"),
    supabase.from("compras").select("*").order("data", { ascending: false }),
    supabase.from("movimentacoes").select("*").order("data", { ascending: false }),
  ]);

  const categorias = (catRes.data ?? []).map(mapCategoria);

  // Mapa id→nome para resolver categoria_id
  const catMap = new Map(categorias.map((c) => [c.id, c.nome]));

  const prodRows = (prodRes.data ?? []) as DbProduto[];
  const produtos = prodRows.map((r) => mapProduto(r, catMap.get(r.categoria_id) ?? "Sem Categoria"));

  // Mapa produtoId → ponto_pedido para enriquecer estoque
  const pontoPedidoMap = new Map(prodRows.map((r) => [r.id, Number(r.ponto_pedido)]));

  const diluicoes = ((dilRes.data ?? []) as DbDiluicao[]).map(mapDiluicao);
  const estoques = ((estRes.data ?? []) as DbEstoque[]).map((r) =>
    mapEstoque(r, pontoPedidoMap.get(r.produto_id) ?? 0)
  );
  const compras = ((compRes.data ?? []) as DbCompra[]).map(mapCompra);
  const movimentacoes = ((movRes.data ?? []) as DbMovimentacao[]).map(mapMovimentacao);

  return { categorias, produtos, diluicoes, estoques, compras, movimentacoes };
}

// ─────────────────────────────────────────────
// WRITE — operações individuais
// ─────────────────────────────────────────────

// ── Categorias ──

export async function dbAddCategoria(cat: CategoriaEntity) {
  // REMOVEMOS o 'id' para o Supabase gerar o UUID automático
  const { error } = await supabase.from("categorias").insert({ nome: cat.nome });

  if (error) console.error("dbAddCategoria:", error);
}

export async function dbEditCategoria(id: string, nome: string) {
  const { error } = await supabase.from("categorias").update({ nome }).eq("id", id);
  if (error) console.error("dbEditCategoria:", error);
}

export async function dbDeleteCategoria(id: string) {
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) console.error("dbDeleteCategoria:", error);
}

// ── Produtos ──

export async function dbAddProduto(
  produto: Produto,
  categoriaId: string,
  diluicoes: Diluicao[],
  estoque: Estoque,
  compra: Compra | null,
  movimentacao: MovimentoEstoque | null
) {
  // 1. Inserir produto sem ID para que o DB gere o UUID
  const { data: pData, error: pErr } = await supabase.from("produtos").insert({
    nome: produto.nome,
    marca: produto.marca,
    categoria_id: categoriaId,
    unidade: produto.unidade,
    descricao: produto.descricao ?? null,
    ponto_pedido: estoque.alertaEstoqueMinimo,
  }).select().single();
  
  if (pErr || !pData) { console.error("dbAddProduto:", pErr); return null; }
  const novoProdutoId = pData.id;

  // 2. Criar estoque inicial com o novo ID gerado no DB
  const { error: eErr } = await supabase.from("estoque").insert({
    produto_id: novoProdutoId,
    quantidade_atual: estoque.quantidadeAtual,
  });
  if (eErr) console.error("dbAddProduto estoque:", eErr);

  // 3. Diluições (sem ID)
  if (diluicoes.length > 0) {
    const dilRows = diluicoes.map((d) => ({
      produto_id: novoProdutoId,
      tipo: d.tipo,
      proporcao: d.proporcao,
      fator_diluicao: d.fatorDiluicao,
      instrucao_de_uso: d.instrucaoDeUso,
    }));
    const { error: dErr } = await supabase.from("diluicoes").insert(dilRows);
    if (dErr) console.error("dbAddProduto diluicoes:", dErr);
  }

  // 4. Compra (se fornecida, sem ID e com novo produtoId)
  if (compra) {
    const { error: cErr } = await supabase.from("compras").insert({
      produto_id: novoProdutoId,
      data: compra.data,
      preco_unitario: compra.precoUnitario,
      quantidade: compra.quantidade,
      fornecedor: compra.fornecedor,
      nota_fiscal: compra.notaFiscal ?? null,
    });
    if (cErr) console.error("dbAddProduto compra:", cErr);
  }

  // 5. Movimentação (se fornecida, usando novo produtoId)
  if (movimentacao) {
    await supabase.from("movimentacoes").insert({
      produto_id: novoProdutoId,
      tipo: movimentacao.tipo,
      quantidade: movimentacao.quantidade,
      motivo: movimentacao.motivo,
      responsavel: movimentacao.responsavel,
      data: movimentacao.data,
    });
  }

  return novoProdutoId;
}

export async function dbEditProduto(
  produto: Produto,
  categoriaId: string,
  diluicoes: Diluicao[],
  alertaEstoqueMinimo: number
) {
  // 1. Atualizar produto + ponto_pedido
  await supabase.from("produtos").update({
    nome: produto.nome,
    marca: produto.marca,
    categoria_id: categoriaId,
    unidade: produto.unidade,
    descricao: produto.descricao ?? null,
    ponto_pedido: alertaEstoqueMinimo,
  }).eq("id", produto.id);

  // 2. Recriar diluições
  await supabase.from("diluicoes").delete().eq("produto_id", produto.id);
  if (diluicoes.length > 0) {
    await supabase.from("diluicoes").insert(
      diluicoes.map((d) => ({
        id: d.id,
        produto_id: d.produtoId,
        tipo: d.tipo,
        proporcao: d.proporcao,
        fator_diluicao: d.fatorDiluicao,
        instrucao_de_uso: d.instrucaoDeUso,
      }))
    );
  }
}

export async function dbDeleteProduto(id: string) {
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) console.error("dbDeleteProduto:", error);
}

// ── Estoque ──

export async function dbUpdateEstoque(produtoId: string, quantidadeAtual: number) {
  await supabase
    .from("estoque")
    .update({ quantidade_atual: quantidadeAtual })
    .eq("produto_id", produtoId);
}

// ── Compras ──

export async function dbAddCompra(compra: Compra) {
  const { data, error } = await supabase.from("compras").insert({
    produto_id: compra.produtoId,
    data: compra.data,
    preco_unitario: compra.precoUnitario,
    quantidade: compra.quantidade,
    fornecedor: compra.fornecedor,
    nota_fiscal: compra.notaFiscal ?? null,
  }).select().single();
  if (error) console.error("dbAddCompra:", error);
  return data;
}

export async function dbUpdateCompra(compra: { id: string; precoUnitario: number; quantidade: number; fornecedor: string; notaFiscal?: string }) {
  await supabase.from("compras").update({
    preco_unitario: compra.precoUnitario,
    quantidade: compra.quantidade,
    fornecedor: compra.fornecedor,
    nota_fiscal: compra.notaFiscal ?? null,
  }).eq("id", compra.id);
}

export async function dbDeleteCompra(id: string) {
  await supabase.from("compras").delete().eq("id", id);
}

// ── Movimentações ──

export async function dbAddMovimentacao(mov: MovimentoEstoque) {
  const { data, error } = await supabase.from("movimentacoes").insert({
    produto_id: mov.produtoId,
    tipo: mov.tipo,
    quantidade: mov.quantidade,
    motivo: mov.motivo,
    responsavel: mov.responsavel,
    data: mov.data,
  }).select().single();
  if (error) console.error("dbAddMovimentacao:", error);
  return data;
}
