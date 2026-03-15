import type {
  CategoriaEntity,
  Produto,
  Diluicao,
  Estoque,
  Compra,
  MovimentoEstoque,
} from "@/types";

// ─────────────────────────────────────────────
// Categorias (dinâmicas)
// ─────────────────────────────────────────────

export const mockCategorias: CategoriaEntity[] = [
  { id: "cat1", nome: "Limpeza Geral" },
  { id: "cat2", nome: "Desengordurante" },
  { id: "cat3", nome: "Desinfetante" },
  { id: "cat4", nome: "Sanitizante" },
  { id: "cat5", nome: "Desincrustante" },
  { id: "cat6", nome: "Aromatizante" },
  { id: "cat7", nome: "Outro" },
];

// ─────────────────────────────────────────────
// Produtos
// ─────────────────────────────────────────────

export const mockProdutos: Produto[] = [
  {
    id: "p1",
    nome: "Detergente Concentrado Multi-uso",
    marca: "Spartan",
    categoria: "Limpeza Geral",
    unidade: "L",
    descricao: "Detergente alcalino de alto desempenho para limpeza pesada de superfícies.",
    criadoEm: "2024-01-10T10:00:00Z",
  },
  {
    id: "p2",
    nome: "Desengordurante Industrial",
    marca: "Diversey",
    categoria: "Desengordurante",
    unidade: "L",
    descricao: "Remove gorduras, óleos e graxas em cozinhas industriais e equipamentos.",
    criadoEm: "2024-01-15T10:00:00Z",
  },
  {
    id: "p3",
    nome: "Desinfetante Quaternário",
    marca: "Ecolab",
    categoria: "Desinfetante",
    unidade: "L",
    descricao: "Bactericida e fungicida de amplo espectro para pisos e superfícies.",
    criadoEm: "2024-02-01T10:00:00Z",
  },
  {
    id: "p4",
    nome: "Desincrustante Ácido",
    marca: "Spartan",
    categoria: "Desincrustante",
    unidade: "L",
    descricao: "Remove cálcio, ferrugem e depósitos minerais de banheiros e reservatórios.",
    criadoEm: "2024-02-10T10:00:00Z",
  },
  {
    id: "p5",
    nome: "Aromatizante Lavanda",
    marca: "Bom Ar Pro",
    categoria: "Aromatizante",
    unidade: "L",
    descricao: "Concentrado de fragrância lavanda para ambientes e após limpeza de pisos.",
    criadoEm: "2024-03-05T10:00:00Z",
  },
  {
    id: "p6",
    nome: "Sanitizante Alimentar",
    marca: "Ecolab",
    categoria: "Sanitizante",
    unidade: "L",
    descricao: "Sanitizante aprovado para superfícies em contato com alimentos.",
    criadoEm: "2024-03-20T10:00:00Z",
  },
];

// ─────────────────────────────────────────────
// Diluições  (agora com fatorDiluicao numérico)
// ─────────────────────────────────────────────

export const mockDiluicoes: Diluicao[] = [
  // Detergente Multi-uso (p1)
  { id: "d1",  produtoId: "p1", tipo: "Leve",   proporcao: "1:80",  fatorDiluicao: 80,  instrucaoDeUso: "Uso diário em pisos e bancadas. Não requer enxágue." },
  { id: "d2",  produtoId: "p1", tipo: "Media",  proporcao: "1:40",  fatorDiluicao: 40,  instrucaoDeUso: "Limpeza de manutenção em áreas de alto tráfego." },
  { id: "d3",  produtoId: "p1", tipo: "Pesada", proporcao: "1:20",  fatorDiluicao: 20,  instrucaoDeUso: "Limpeza terminal ou sujidade pesada. Enxaguar após 5 min." },
  // Desengordurante (p2)
  { id: "d4",  produtoId: "p2", tipo: "Leve",   proporcao: "1:30",  fatorDiluicao: 30,  instrucaoDeUso: "Equipamentos com gordura leve. Borrifar e enxaguar." },
  { id: "d5",  produtoId: "p2", tipo: "Media",  proporcao: "1:15",  fatorDiluicao: 15,  instrucaoDeUso: "Coifas e fritadeiras. Aplicar, aguardar 3 min e enxaguar." },
  { id: "d6",  produtoId: "p2", tipo: "Pesada", proporcao: "1:5",   fatorDiluicao: 5,   instrucaoDeUso: "Gordura carbonizada. Usar EPI. Aguardar 10 min." },
  // Desinfetante Quaternário (p3)
  { id: "d7",  produtoId: "p3", tipo: "Leve",   proporcao: "1:200", fatorDiluicao: 200, instrucaoDeUso: "Manutenção de superfícies já limpas." },
  { id: "d8",  produtoId: "p3", tipo: "Media",  proporcao: "1:100", fatorDiluicao: 100, instrucaoDeUso: "Desinfecção rotineira de banheiros e vestiários." },
  { id: "d9",  produtoId: "p3", tipo: "Pesada", proporcao: "1:50",  fatorDiluicao: 50,  instrucaoDeUso: "Desinfecção terminal ou em surtos. Aguardar 10 min." },
  // Desincrustante Ácido (p4)
  { id: "d10", produtoId: "p4", tipo: "Leve",   proporcao: "1:20",  fatorDiluicao: 20,  instrucaoDeUso: "Manchas leves de calcário em azulejos." },
  { id: "d11", produtoId: "p4", tipo: "Media",  proporcao: "1:10",  fatorDiluicao: 10,  instrucaoDeUso: "Vasos sanitários e pias com incrustações moderadas." },
  { id: "d12", produtoId: "p4", tipo: "Pesada", proporcao: "1:3",   fatorDiluicao: 3,   instrucaoDeUso: "Incrustações severas. Obrigatório EPI. Enxaguar abundantemente." },
  // Aromatizante (p5)
  { id: "d13", produtoId: "p5", tipo: "Leve",   proporcao: "1:100", fatorDiluicao: 100, instrucaoDeUso: "Borrifar no ar para aromatização de ambientes." },
  { id: "d14", produtoId: "p5", tipo: "Media",  proporcao: "1:50",  fatorDiluicao: 50,  instrucaoDeUso: "Adicionar à água de limpeza de pisos." },
  // Sanitizante Alimentar (p6)
  { id: "d15", produtoId: "p6", tipo: "Leve",   proporcao: "1:500", fatorDiluicao: 500, instrucaoDeUso: "Superfícies em contato com alimentos. Não enxaguar." },
  { id: "d16", produtoId: "p6", tipo: "Media",  proporcao: "1:200", fatorDiluicao: 200, instrucaoDeUso: "Utensílios e equipamentos de cozinha. Enxaguar após 2 min." },
];

// ─────────────────────────────────────────────
// Estoque
// ─────────────────────────────────────────────

export const mockEstoques: Estoque[] = [
  { id: "e1", produtoId: "p1", quantidadeAtual: 12, alertaEstoqueMinimo: 5,  localizacao: "Depósito A - Prateleira 1" },
  { id: "e2", produtoId: "p2", quantidadeAtual: 3,  alertaEstoqueMinimo: 5,  localizacao: "Depósito A - Prateleira 2" },
  { id: "e3", produtoId: "p3", quantidadeAtual: 8,  alertaEstoqueMinimo: 4,  localizacao: "Depósito B - Prateleira 1" },
  { id: "e4", produtoId: "p4", quantidadeAtual: 1,  alertaEstoqueMinimo: 3,  localizacao: "Depósito B - Prateleira 2" },
  { id: "e5", produtoId: "p5", quantidadeAtual: 6,  alertaEstoqueMinimo: 2,  localizacao: "Depósito A - Prateleira 3" },
  { id: "e6", produtoId: "p6", quantidadeAtual: 0,  alertaEstoqueMinimo: 3,  localizacao: "Depósito B - Prateleira 3" },
];

// ─────────────────────────────────────────────
// Compras  (precoPago → precoUnitario)
// ─────────────────────────────────────────────

export const mockCompras: Compra[] = [
  { id: "c1",  produtoId: "p1", data: "2026-01-05T00:00:00Z", precoUnitario: 28.90,  quantidade: 5,  fornecedor: "QuimicaPro Distribuidora" },
  { id: "c2",  produtoId: "p2", data: "2026-01-12T00:00:00Z", precoUnitario: 54.00,  quantidade: 5,  fornecedor: "CleanMax Suprimentos" },
  { id: "c3",  produtoId: "p3", data: "2026-01-20T00:00:00Z", precoUnitario: 45.50,  quantidade: 4,  fornecedor: "QuimicaPro Distribuidora" },
  { id: "c4",  produtoId: "p4", data: "2026-01-28T00:00:00Z", precoUnitario: 38.00,  quantidade: 3,  fornecedor: "SuprHigiêne LTDA" },
  { id: "c5",  produtoId: "p5", data: "2026-02-03T00:00:00Z", precoUnitario: 22.00,  quantidade: 4,  fornecedor: "CleanMax Suprimentos" },
  { id: "c6",  produtoId: "p6", data: "2026-02-10T00:00:00Z", precoUnitario: 67.90,  quantidade: 3,  fornecedor: "QuimicaPro Distribuidora" },
  { id: "c7",  produtoId: "p1", data: "2026-02-18T00:00:00Z", precoUnitario: 27.50,  quantidade: 7,  fornecedor: "QuimicaPro Distribuidora" },
  { id: "c8",  produtoId: "p2", data: "2026-02-25T00:00:00Z", precoUnitario: 53.00,  quantidade: 3,  fornecedor: "CleanMax Suprimentos" },
  { id: "c9",  produtoId: "p3", data: "2026-03-02T00:00:00Z", precoUnitario: 44.00,  quantidade: 5,  fornecedor: "QuimicaPro Distribuidora" },
  { id: "c10", produtoId: "p4", data: "2026-03-08T00:00:00Z", precoUnitario: 39.50,  quantidade: 2,  fornecedor: "SuprHigiêne LTDA" },
];

// ─────────────────────────────────────────────
// Movimentações de Estoque (histórico inicial)
// ─────────────────────────────────────────────

export const mockMovimentacoes: MovimentoEstoque[] = [
  { id: "m1",  produtoId: "p1", tipo: "entrada",  quantidade: 5,    motivo: "Compra #c1 — QuimicaPro Distribuidora",                   responsavel: "Carlos",  data: "2026-01-05T08:30:00Z" },
  { id: "m2",  produtoId: "p2", tipo: "entrada",  quantidade: 5,    motivo: "Compra #c2 — CleanMax Suprimentos",                       responsavel: "Carlos",  data: "2026-01-12T09:00:00Z" },
  { id: "m3",  produtoId: "p1", tipo: "saida",    quantidade: 0.25, motivo: "Diluição Leve 1:80 — 20L solução (pisos térreo)",          responsavel: "Maria",   data: "2026-02-20T07:15:00Z" },
  { id: "m4",  produtoId: "p3", tipo: "saida",    quantidade: 0.1,  motivo: "Diluição Media 1:100 — 10L solução (banheiros 2º andar)",  responsavel: "João",    data: "2026-02-22T14:00:00Z" },
  { id: "m5",  produtoId: "p1", tipo: "entrada",  quantidade: 7,    motivo: "Compra #c7 — QuimicaPro Distribuidora",                   responsavel: "Carlos",  data: "2026-02-18T10:00:00Z" },
  { id: "m6",  produtoId: "p2", tipo: "saida",    quantidade: 0.5,  motivo: "Diluição Pesada 1:5 — 3L solução (cozinha industrial)",    responsavel: "Maria",   data: "2026-03-01T06:45:00Z" },
  { id: "m7",  produtoId: "p4", tipo: "saida",    quantidade: 0.25, motivo: "Diluição Media 1:10 — 2.5L solução (banheiro térreo)",     responsavel: "João",    data: "2026-03-05T08:00:00Z" },
  { id: "m8",  produtoId: "p3", tipo: "entrada",  quantidade: 5,    motivo: "Compra #c9 — QuimicaPro Distribuidora",                   responsavel: "Carlos",  data: "2026-03-02T09:30:00Z" },
  { id: "m9",  produtoId: "p5", tipo: "saida",    quantidade: 0.1,  motivo: "Diluição Leve 1:100 — 10L solução (recepção)",             responsavel: "Ana",     data: "2026-03-10T07:30:00Z" },
  { id: "m10", produtoId: "p2", tipo: "saida",    quantidade: 1.0,  motivo: "Diluição Media 1:15 — 16L solução (coifas refeitório)",    responsavel: "Maria",   data: "2026-03-12T15:00:00Z" },
];
