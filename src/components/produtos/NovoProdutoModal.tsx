"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Package,
  FlaskConical,
  Warehouse,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Droplets,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";
import type { Categoria, Unidade, TipoDiluicao } from "@/types";
import {
  parseProporcao,
  formatProporcao,
  rendimentoPorLitro,
  custoLitroDiluido,
} from "@/types";
import { useApp } from "@/contexts/AppContext";

// ─────────────────────────────────────────────
// Tipos internos do formulário
// ─────────────────────────────────────────────

interface DiluicaoForm {
  proporcao: string;
  instrucaoDeUso: string;
}

const EMPTY_DIL: DiluicaoForm = { proporcao: "", instrucaoDeUso: "" };

interface FormData {
  nome: string;
  marca: string;
  categoria: Categoria | "";
  unidade: Unidade | "";
  descricao: string;
  leve: DiluicaoForm;
  media: DiluicaoForm;
  pesada: DiluicaoForm;
  quantidadeInicial: string;
  estoqueMinimo: string;
  localizacao: string;
  precoUnitario: string;
  dataCompra: string;
  fornecedor: string;
}

type FormErrors = Partial<Record<keyof FormData | "diluicoes", string>>;

const INITIAL_FORM: FormData = {
  nome: "",
  marca: "",
  categoria: "",
  unidade: "",
  descricao: "",
  leve: { ...EMPTY_DIL },
  media: { ...EMPTY_DIL },
  pesada: { ...EMPTY_DIL },
  quantidadeInicial: "",
  estoqueMinimo: "",
  localizacao: "",
  precoUnitario: "",
  dataCompra: new Date().toISOString().slice(0, 10),
  fornecedor: "",
};

// ─────────────────────────────────────────────
// Dados de apoio
// ─────────────────────────────────────────────

// Removido categorias fixas para consumir do AppContext

const UNIDADES: { value: Unidade; label: string }[] = [
  { value: "L", label: "Litros (L)" },
  { value: "Kg", label: "Quilogramas (Kg)" },
  { value: "Un", label: "Unidades (Un)" },
];

const DIL_CONFIG = {
  leve: {
    label: "Leve",
    tipo: "Leve" as TipoDiluicao,
    desc: "Manutenção / uso diário",
    placeholder: "ex: 1:80",
    bg: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    ring: "focus:ring-emerald-400",
  },
  media: {
    label: "Média",
    tipo: "Media" as TipoDiluicao,
    desc: "Uso geral / rotina",
    placeholder: "ex: 1:40",
    bg: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    ring: "focus:ring-amber-400",
  },
  pesada: {
    label: "Pesada",
    tipo: "Pesada" as TipoDiluicao,
    desc: "Sujidade intensa / limpeza terminal",
    placeholder: "ex: 1:10",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-800",
    ring: "focus:ring-red-400",
  },
} as const;

// ─────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────

function FieldLabel({
  children,
  required,
  optional,
}: {
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {optional && (
        <span className="ml-1 text-[10px] font-normal normal-case text-gray-400">
          (opcional)
        </span>
      )}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {msg}
    </p>
  );
}

function SectionHeader({
  step,
  icon: Icon,
  title,
  subtitle,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function StyledInput({
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <>
      <input
        {...props}
        className={clsx(
          "w-full px-3 py-2.5 rounded-lg border text-sm bg-white",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition",
          error ? "border-red-300 bg-red-50/50" : "border-gray-200",
          className
        )}
      />
      <FieldError msg={error} />
    </>
  );
}

function StyledTextarea({
  error,
  rows = 2,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <>
      <textarea
        {...props}
        rows={rows}
        className={clsx(
          "w-full px-3 py-2.5 rounded-lg border text-sm bg-white resize-none",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition",
          error ? "border-red-300 bg-red-50/50" : "border-gray-200"
        )}
      />
      <FieldError msg={error} />
    </>
  );
}

// ─────────────────────────────────────────────
// Card de faixa de diluição (com preview de rendimento)
// ─────────────────────────────────────────────

function DiluicaoCard({
  tipo,
  value,
  precoUnitario,
  unidade,
  onChange,
}: {
  tipo: "leve" | "media" | "pesada";
  value: DiluicaoForm;
  precoUnitario: number | null;
  unidade: string;
  onChange: (field: keyof DiluicaoForm, val: string) => void;
}) {
  const cfg = DIL_CONFIG[tipo];
  const fator = parseProporcao(value.proporcao);
  const isFilled = fator !== null && value.instrucaoDeUso.trim().length > 0;
  const hasInput = value.proporcao.trim().length > 0;
  const isInvalidFormat = hasInput && fator === null;

  // Previews de rendimento e custo
  const rendimento = fator !== null ? rendimentoPorLitro(fator) : null;
  const custoDiluido =
    fator !== null && precoUnitario !== null && precoUnitario > 0
      ? custoLitroDiluido(precoUnitario, fator)
      : null;

  return (
    <div
      className={clsx(
        "rounded-xl border p-4 transition-shadow",
        cfg.bg,
        isFilled && "ring-1 ring-offset-1 ring-brand-300"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "text-xs font-bold px-2.5 py-1 rounded-full",
              cfg.badge
            )}
          >
            {cfg.label}
          </span>
          <span className="text-[11px] text-gray-500">{cfg.desc}</span>
        </div>
        {isFilled && (
          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Proporção</FieldLabel>
          <input
            type="text"
            value={value.proporcao}
            onChange={(e) => onChange("proporcao", e.target.value)}
            placeholder={cfg.placeholder}
            className={clsx(
              "w-full px-3 py-2 rounded-lg border text-sm bg-white",
              "focus:outline-none focus:ring-2 transition",
              cfg.ring,
              isInvalidFormat
                ? "border-red-300"
                : "border-gray-200 focus:border-brand-500"
            )}
          />
          {isInvalidFormat && (
            <p className="text-[11px] text-red-500 mt-1">
              Formato inválido — use concentrado:água (ex: 1:40)
            </p>
          )}
          {fator !== null && fator !== Math.round(fator) && (
            <p className="text-[11px] text-gray-500 mt-1">
              Normalizado: {formatProporcao(fator)}
            </p>
          )}
        </div>
        <div>
          <FieldLabel>Instrução de Uso</FieldLabel>
          <textarea
            value={value.instrucaoDeUso}
            onChange={(e) => onChange("instrucaoDeUso", e.target.value)}
            placeholder="Como aplicar esta diluição..."
            rows={2}
            className={clsx(
              "w-full px-3 py-2 rounded-lg border text-sm bg-white resize-none",
              "focus:outline-none focus:ring-2 transition",
              cfg.ring,
              "border-gray-200 focus:border-brand-500"
            )}
          />
        </div>
      </div>

      {/* Preview de rendimento e custo diluído */}
      {fator !== null && rendimento !== null && (
        <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-600 bg-white/60 rounded-lg px-3 py-2">
          <Droplets className="w-3.5 h-3.5 text-brand-500 shrink-0" />
          <span>
            1{unidade || "L"} concentrado → <strong>{rendimento}{unidade || "L"}</strong> de solução
          </span>
          {custoDiluido !== null && (
            <>
              <span className="text-gray-300">·</span>
              <span>
                Custo diluído: <strong className="text-brand-700">R$ {custoDiluido.toFixed(4)}/{unidade || "L"}</strong>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────

interface NovoProdutoModalProps {
  open: boolean;
  onClose: () => void;
}

export function NovoProdutoModal({ open, onClose }: NovoProdutoModalProps) {
  const { addProduto, categorias, addCategoria } = useApp();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // Estado para adicionar nova categoria em linha
  const [promptCatOpen, setPromptCatOpen] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState("");

  // Fechar com ESC + travar scroll do body
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = useCallback(
    <K extends keyof FormData>(key: K, val: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: val }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  const setDil = useCallback(
    (
      tipo: "leve" | "media" | "pesada",
      field: keyof DiluicaoForm,
      val: string
    ) => {
      setForm((prev) => ({ ...prev, [tipo]: { ...prev[tipo], [field]: val } }));
      setErrors((prev) => ({ ...prev, diluicoes: undefined }));
    },
    []
  );

  // ── Validação ──────────────────────────────

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!form.marca.trim()) errs.marca = "Marca é obrigatória";
    if (!form.categoria) errs.categoria = "Selecione uma categoria";
    if (!form.unidade) errs.unidade = "Selecione a unidade";

    // Diluições: ao menos 1 completa e com proporção válida
    const dilKeys = ["leve", "media", "pesada"] as const;
    const filledDils = dilKeys.filter((t) => {
      const d = form[t];
      return d.proporcao.trim() && d.instrucaoDeUso.trim();
    });

    if (filledDils.length === 0) {
      errs.diluicoes =
        "Preencha ao menos uma faixa de diluição completa (proporção + instrução)";
    } else {
      // Verificar se as preenchidas têm proporção válida
      const invalidDils = filledDils.filter(
        (t) => parseProporcao(form[t].proporcao) === null
      );
      if (invalidDils.length > 0) {
        const labels = invalidDils.map(
          (t) => DIL_CONFIG[t].label
        );
        errs.diluicoes = `Proporção inválida na faixa: ${labels.join(", ")}. Use o formato concentrado:água (ex: 1:40)`;
      }
    }

    // Verificar faixas parcialmente preenchidas (só proporção OU só instrução)
    for (const t of dilKeys) {
      const d = form[t];
      const hasProp = d.proporcao.trim().length > 0;
      const hasInstr = d.instrucaoDeUso.trim().length > 0;
      if (hasProp !== hasInstr) {
        errs.diluicoes =
          errs.diluicoes ||
          `Faixa "${DIL_CONFIG[t].label}" está incompleta — preencha proporção e instrução ou deixe ambos em branco`;
      }
    }

    const qty = Number(form.quantidadeInicial);
    if (form.quantidadeInicial === "" || isNaN(qty) || qty < 0)
      errs.quantidadeInicial = "Informe a quantidade inicial (mínimo 0)";

    const min = Number(form.estoqueMinimo);
    if (form.estoqueMinimo === "" || isNaN(min) || min < 0)
      errs.estoqueMinimo = "Informe o ponto de pedido (mínimo 0)";

    const preco = Number(form.precoUnitario);
    if (form.precoUnitario === "" || isNaN(preco) || preco <= 0)
      errs.precoUnitario = "Informe um preço unitário válido";

    if (!form.dataCompra) errs.dataCompra = "Informe a data da compra";
    if (!form.fornecedor.trim()) errs.fornecedor = "Informe o fornecedor";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────

  const handleSubmit = () => {
    if (!validate()) return;

    const tiposMap: Record<"leve" | "media" | "pesada", TipoDiluicao> = {
      leve: "Leve",
      media: "Media",
      pesada: "Pesada",
    };

    const diluicoesToAdd = (["leve", "media", "pesada"] as const)
      .filter((t) => form[t].proporcao.trim() && form[t].instrucaoDeUso.trim())
      .map((t) => {
        const fator = parseProporcao(form[t].proporcao)!; // validado acima
        return {
          tipo: tiposMap[t],
          proporcao: formatProporcao(fator),
          fatorDiluicao: fator,
          instrucaoDeUso: form[t].instrucaoDeUso.trim(),
        };
      });

    addProduto({
      produto: {
        nome: form.nome.trim(),
        marca: form.marca.trim(),
        categoria: form.categoria as Categoria,
        unidade: form.unidade as Unidade,
        descricao: form.descricao.trim() || undefined,
      },
      diluicoes: diluicoesToAdd,
      estoque: {
        quantidadeAtual: Number(form.quantidadeInicial),
        alertaEstoqueMinimo: Number(form.estoqueMinimo),
        localizacao: form.localizacao.trim() || undefined,
      },
      compra: {
        data: new Date(form.dataCompra + "T12:00:00Z").toISOString(),
        precoUnitario: Number(form.precoUnitario),
        quantidade: Number(form.quantidadeInicial),
        fornecedor: form.fornecedor.trim(),
      },
    });

    handleClose();
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setPromptCatOpen(false);
    setNovaCatNome("");
    onClose();
  };

  const handleAddCategoriaRapida = () => {
    const nome = novaCatNome.trim();
    if (!nome) {
      setPromptCatOpen(false);
      return;
    }
    // Verifica duplicação
    if (categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      alert("Essa categoria já existe!");
      return;
    }
    addCategoria({ nome });
    // Seleciona automaticamente
    set("categoria", nome);
    setPromptCatOpen(false);
    setNovaCatNome("");
  };

  if (!open) return null;

  const errorCount = Object.keys(errors).length;
  const precoNum =
    form.precoUnitario !== "" && !isNaN(Number(form.precoUnitario))
      ? Number(form.precoUnitario)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-100">
              <Package className="w-4 h-4 text-brand-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Novo Produto
              </h2>
              <p className="text-xs text-gray-400">
                Preencha as informações e ao menos uma diluição
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Corpo scrollável ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Banner de erros */}
          {errorCount > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700">
                  {errorCount} campo{errorCount > 1 ? "s" : ""} com erro —
                  verifique abaixo.
                </p>
              </div>
            </div>
          )}

          {/* ── Seção 1: Informações Básicas ── */}
          <section>
            <SectionHeader
              step={1}
              icon={Package}
              title="Informações Básicas"
              subtitle="Identificação e classificação do produto"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FieldLabel required>Nome do Produto</FieldLabel>
                <StyledInput
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="ex: Detergente Concentrado Multi-uso"
                  error={errors.nome}
                />
              </div>

              <div>
                <FieldLabel required>Marca</FieldLabel>
                <StyledInput
                  value={form.marca}
                  onChange={(e) => set("marca", e.target.value)}
                  placeholder="ex: Spartan"
                  error={errors.marca}
                />
              </div>

              <div>
                <FieldLabel required>Unidade de Medida</FieldLabel>
                <select
                  value={form.unidade}
                  onChange={(e) => set("unidade", e.target.value as Unidade)}
                  className={clsx(
                    "w-full px-3 py-2.5 rounded-lg border text-sm bg-white appearance-none",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition",
                    errors.unidade ? "border-red-300" : "border-gray-200"
                  )}
                >
                  <option value="">Selecionar...</option>
                  {UNIDADES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.unidade} />
              </div>

              <div className="col-span-2">
                <FieldLabel required>Categoria</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => set("categoria", cat.nome)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                        form.categoria === cat.nome
                          ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-700"
                      )}
                    >
                      {cat.nome}
                    </button>
                  ))}
                  
                  {/* Botão de adicionar nova categoria inline */}
                  {!promptCatOpen ? (
                    <button
                      type="button"
                      onClick={() => setPromptCatOpen(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:border-brand-400 hover:text-brand-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nova
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-white border border-brand-300 rounded-full pl-3 pr-1 py-1 shadow-sm">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Nome..."
                        value={novaCatNome}
                        onChange={(e) => setNovaCatNome(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCategoriaRapida();
                          }
                          if (e.key === "Escape") {
                            setPromptCatOpen(false);
                            setNovaCatNome("");
                          }
                        }}
                        className="w-24 text-xs font-medium text-gray-700 focus:outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategoriaRapida}
                        className="p-1 rounded-full bg-brand-100 text-brand-700 hover:bg-brand-200"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPromptCatOpen(false);
                          setNovaCatNome("");
                        }}
                        className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {categorias.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Nenhuma categoria cadastrada. Adicione uma para prosseguir.</p>
                )}
                <FieldError msg={errors.categoria} />
              </div>

              <div className="col-span-2">
                <FieldLabel optional>Descrição</FieldLabel>
                <StyledTextarea
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  placeholder="Descreva brevemente o produto e seus principais usos..."
                  rows={2}
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* ── Seção 2: Diluições ── */}
          <section>
            <SectionHeader
              step={2}
              icon={FlaskConical}
              title="Faixas de Diluição"
              subtitle="Preencha ao menos uma faixa. Proporção no formato concentrado:água (ex: 1:40)"
            />

            {errors.diluicoes && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{errors.diluicoes}</p>
              </div>
            )}

            <div className="space-y-3">
              {(["leve", "media", "pesada"] as const).map((tipo) => (
                <DiluicaoCard
                  key={tipo}
                  tipo={tipo}
                  value={form[tipo]}
                  precoUnitario={precoNum}
                  unidade={form.unidade || "L"}
                  onChange={(field, val) => setDil(tipo, field, val)}
                />
              ))}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* ── Seção 3: Estoque ── */}
          <section>
            <SectionHeader
              step={3}
              icon={Warehouse}
              title="Estoque Inicial"
              subtitle="Quantidade disponível agora e ponto de reposição"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>
                  Quantidade Inicial
                  {form.unidade ? ` (${form.unidade})` : ""}
                </FieldLabel>
                <StyledInput
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.quantidadeInicial}
                  onChange={(e) => set("quantidadeInicial", e.target.value)}
                  placeholder="ex: 10"
                  error={errors.quantidadeInicial}
                />
              </div>

              <div>
                <FieldLabel required>Ponto de Pedido (mínimo)</FieldLabel>
                <StyledInput
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.estoqueMinimo}
                  onChange={(e) => set("estoqueMinimo", e.target.value)}
                  placeholder="ex: 3"
                  error={errors.estoqueMinimo}
                />
              </div>

              <div className="col-span-2">
                <FieldLabel optional>Localização no Depósito</FieldLabel>
                <StyledInput
                  value={form.localizacao}
                  onChange={(e) => set("localizacao", e.target.value)}
                  placeholder="ex: Depósito A – Prateleira 2"
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* ── Seção 4: Compra ── */}
          <section>
            <SectionHeader
              step={4}
              icon={ShoppingCart}
              title="Dados da Compra"
              subtitle="Informações da compra inicial para histórico de preços"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>
                  Preço Unitário
                  {form.unidade ? ` (R$ por ${form.unidade})` : ""}
                </FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precoUnitario}
                    onChange={(e) => set("precoUnitario", e.target.value)}
                    placeholder="0,00"
                    className={clsx(
                      "w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm bg-white",
                      "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition",
                      errors.precoUnitario
                        ? "border-red-300 bg-red-50/50"
                        : "border-gray-200"
                    )}
                  />
                </div>
                <FieldError msg={errors.precoUnitario} />
                {precoNum !== null &&
                  precoNum > 0 &&
                  form.quantidadeInicial &&
                  Number(form.quantidadeInicial) > 0 && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Total da compra: R${" "}
                      {(precoNum * Number(form.quantidadeInicial)).toFixed(2)}
                    </p>
                  )}
              </div>

              <div>
                <FieldLabel required>Data da Compra</FieldLabel>
                <StyledInput
                  type="date"
                  value={form.dataCompra}
                  onChange={(e) => set("dataCompra", e.target.value)}
                  error={errors.dataCompra}
                />
              </div>

              <div className="col-span-2">
                <FieldLabel required>Fornecedor</FieldLabel>
                <StyledInput
                  value={form.fornecedor}
                  onChange={(e) => set("fornecedor", e.target.value)}
                  placeholder="ex: QuimicaPro Distribuidora"
                  error={errors.fornecedor}
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl shrink-0">
          <p className="text-xs text-gray-400">
            <span className="text-red-500">*</span> Campos obrigatórios
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition shadow-sm"
            >
              Cadastrar Produto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
