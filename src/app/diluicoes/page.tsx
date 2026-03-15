"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FlaskConical,
  Droplets,
  Beaker,
  CircleDollarSign,
  Info,
  ChevronDown,
  RotateCcw,
  Sparkles,
  PackageMinus,
  Check,
  AlertTriangle,
  Warehouse,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/contexts/AppContext";
import {
  precoMedioPonderado,
  custoLitroDiluido,
  rendimentoPorLitro,
  getStatusEstoque,
  type TipoDiluicao,
} from "@/types";

// ─────────────────────────────────────────────
// Configuração visual dos níveis
// ─────────────────────────────────────────────

const NIVEL_CFG: Record<
  TipoDiluicao,
  {
    label: string;
    descricao: string;
    color: string;
    bgActive: string;
    bgIdle: string;
    border: string;
    ring: string;
    dot: string;
  }
> = {
  Leve: {
    label: "Leve",
    descricao: "Manutenção diária",
    color: "text-emerald-700",
    bgActive: "bg-emerald-50",
    bgIdle: "bg-white",
    border: "border-emerald-300",
    ring: "ring-4 ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
  Media: {
    label: "Média",
    descricao: "Limpeza de rotina",
    color: "text-amber-700",
    bgActive: "bg-amber-50",
    bgIdle: "bg-white",
    border: "border-amber-300",
    ring: "ring-4 ring-amber-500/30",
    dot: "bg-amber-500",
  },
  Pesada: {
    label: "Pesada",
    descricao: "Sujidade intensa",
    color: "text-red-700",
    bgActive: "bg-red-50",
    bgIdle: "bg-white",
    border: "border-red-300",
    ring: "ring-4 ring-red-500/30",
    dot: "bg-red-500",
  },
};

// Presets de volume comuns no operacional
const VOLUME_PRESETS = [5, 10, 20, 50];

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function DiluicoesPage() {
  const { produtos, diluicoes, compras, estoques, registrarSaida } = useApp();

  const [produtoId, setProdutoId] = useState<string>("");
  const [nivel, setNivel] = useState<TipoDiluicao | "">("");
  const [volumeStr, setVolumeStr] = useState<string>("");
  const [retiradaFeita, setRetiradaFeita] = useState(false);

  // ── Produto selecionado ──
  const produtoSelecionado = useMemo(
    () => produtos.find((p) => p.id === produtoId) ?? null,
    [produtos, produtoId]
  );

  // ── Diluições do produto ──
  const dilsDisponiveis = useMemo(
    () => (produtoId ? diluicoes.filter((d) => d.produtoId === produtoId) : []),
    [diluicoes, produtoId]
  );

  // ── Diluição ativa ──
  const dilAtiva = useMemo(
    () => (nivel ? dilsDisponiveis.find((d) => d.tipo === nivel) ?? null : null),
    [dilsDisponiveis, nivel]
  );

  // ── Preço médio ponderado do produto ──
  const precoMedio = useMemo(() => {
    if (!produtoId) return null;
    const pCompras = compras.filter((c) => c.produtoId === produtoId);
    return precoMedioPonderado(pCompras);
  }, [compras, produtoId]);

  // ── Cálculos de resultado ──
  const volume = parseFloat(volumeStr) || 0;

  const resultado = useMemo(() => {
    if (!dilAtiva || volume <= 0) return null;

    const fator = dilAtiva.fatorDiluicao;
    const totalPartes = 1 + fator; // 1 parte conc + fator partes água

    const concentradoLitros = volume / totalPartes;
    const concentradoMl = concentradoLitros * 1000;
    const aguaLitros = volume - concentradoLitros;

    const custoPreparacao =
      precoMedio !== null ? concentradoLitros * precoMedio : null;

    const custoLitro =
      precoMedio !== null ? custoLitroDiluido(precoMedio, fator) : null;

    const rendimento = rendimentoPorLitro(fator);

    return {
      concentradoMl,
      concentradoLitros,
      aguaLitros,
      custoPreparacao,
      custoLitro,
      rendimento,
    };
  }, [dilAtiva, volume, precoMedio]);

  // ── Estoque do produto selecionado ──
  const estoqueProduto = useMemo(
    () => (produtoId ? estoques.find((e) => e.produtoId === produtoId) ?? null : null),
    [estoques, produtoId]
  );

  const estoqueInsuficiente = resultado && estoqueProduto
    ? estoqueProduto.quantidadeAtual < resultado.concentradoLitros
    : false;

  // ── Handlers ──
  function handleSelectProduto(id: string) {
    setProdutoId(id);
    setNivel("");
    setVolumeStr("");
    setRetiradaFeita(false);
  }

  function handleReset() {
    setProdutoId("");
    setNivel("");
    setVolumeStr("");
    setRetiradaFeita(false);
  }

  const handleRegistrarRetirada = useCallback(() => {
    if (!resultado || !dilAtiva || !produtoSelecionado || retiradaFeita) return;

    const unidade = produtoSelecionado.unidade;
    const qtdDisplay = resultado.concentradoMl < 1000
      ? `${resultado.concentradoMl.toFixed(0)}ml`
      : `${resultado.concentradoLitros.toFixed(2)}${unidade}`;

    registrarSaida({
      produtoId: produtoSelecionado.id,
      quantidade: resultado.concentradoLitros,
      motivo: `Diluição ${dilAtiva.tipo} ${dilAtiva.proporcao} — ${volume}L solução (${qtdDisplay} concentrado)`,
      responsavel: "Operador",
    });

    setRetiradaFeita(true);
  }, [resultado, dilAtiva, produtoSelecionado, volume, retiradaFeita, registrarSaida]);

  // Quando trocar o nível, verificar se existe diluição para ele
  function handleSelectNivel(tipo: TipoDiluicao) {
    const existe = dilsDisponiveis.some((d) => d.tipo === tipo);
    if (existe) {
      setNivel(tipo);
      setRetiradaFeita(false);
    }
  }

  // Quando o volume muda, reset do estado de retirada
  function handleVolumeChange(val: string) {
    setVolumeStr(val);
    setRetiradaFeita(false);
  }

  // ── Quantos passos já concluídos (p/ progress indicator) ──
  const stepsCompleted =
    (produtoId ? 1 : 0) + (nivel ? 1 : 0) + (volume > 0 ? 1 : 0);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Calculadora de Diluição
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Prepare a solução na medida certa — escolha o produto, nível e
            volume desejado.
          </p>
        </div>
        {stepsCompleted > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={clsx(
              "h-1.5 flex-1 rounded-full transition-all duration-500",
              step <= stepsCompleted ? "bg-brand-500" : "bg-gray-200"
            )}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          PASSO 1 — Seleção de Produto
          ══════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50">
            <FlaskConical className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              1. Escolha o produto
            </p>
            <p className="text-xs text-gray-400">
              Selecione o concentrado que vai utilizar
            </p>
          </div>
        </div>
        <div className="p-5">
          <div className="relative">
            <select
              value={produtoId}
              onChange={(e) => handleSelectProduto(e.target.value)}
              className={clsx(
                "w-full appearance-none px-4 py-3.5 pr-10 border rounded-xl text-sm transition",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                produtoId
                  ? "border-brand-300 bg-brand-50/50 text-gray-900 font-medium"
                  : "border-gray-200 bg-white text-gray-500"
              )}
            >
              <option value="">Selecione um produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.marca}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Info do produto selecionado */}
          {produtoSelecionado && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                {produtoSelecionado.categoria}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                {produtoSelecionado.unidade}
              </span>
              {precoMedio !== null && (
                <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">
                  R$ {precoMedio.toFixed(2)}/{produtoSelecionado.unidade} (média)
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-medium">
                {dilsDisponiveis.length} faixa{dilsDisponiveis.length !== 1 ? "s" : ""} de diluição
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PASSO 2 — Seleção de Nível
          ══════════════════════════════════════════════ */}
      <section
        className={clsx(
          "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300",
          produtoId
            ? "border-gray-200 opacity-100"
            : "border-gray-100 opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
            <Beaker className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              2. Nível de diluição
            </p>
            <p className="text-xs text-gray-400">
              Escolha a intensidade da limpeza
            </p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3">
            {(["Leve", "Media", "Pesada"] as TipoDiluicao[]).map((tipo) => {
              const cfg = NIVEL_CFG[tipo];
              const dil = dilsDisponiveis.find((d) => d.tipo === tipo);
              const isActive = nivel === tipo;
              const isDisabled = !dil;

              return (
                <button
                  key={tipo}
                  onClick={() => handleSelectNivel(tipo)}
                  disabled={isDisabled}
                  className={clsx(
                    "relative flex flex-col items-center gap-2 px-3 py-5 sm:py-6 rounded-xl border-2 transition-all duration-200",
                    "focus:outline-none",
                    isDisabled && "opacity-35 cursor-not-allowed border-gray-200 bg-gray-50",
                    !isDisabled && !isActive && [
                      cfg.bgIdle,
                      "border-gray-200 hover:border-gray-300",
                      "hover:shadow-sm active:scale-[0.97]",
                    ],
                    !isDisabled && isActive && [
                      cfg.bgActive,
                      cfg.border,
                      "shadow-sm",
                      cfg.ring,
                    ]
                  )}
                >
                  {/* Dot indicador */}
                  <div
                    className={clsx(
                      "w-3 h-3 rounded-full transition-all",
                      isActive ? cfg.dot : "bg-gray-300",
                      isActive && "scale-110"
                    )}
                  />

                  {/* Label */}
                  <span
                    className={clsx(
                      "text-sm sm:text-base font-bold transition-colors",
                      isActive ? cfg.color : "text-gray-700",
                      isDisabled && "text-gray-400"
                    )}
                  >
                    {cfg.label}
                  </span>

                  {/* Proporção */}
                  {dil ? (
                    <span
                      className={clsx(
                        "text-lg sm:text-xl font-black tracking-tight transition-colors",
                        isActive ? cfg.color : "text-gray-900"
                      )}
                    >
                      {dil.proporcao}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Não cadastrada
                    </span>
                  )}

                  {/* Descrição */}
                  <span className="text-[11px] text-gray-400 text-center leading-tight">
                    {cfg.descricao}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PASSO 3 — Volume Desejado
          ══════════════════════════════════════════════ */}
      <section
        className={clsx(
          "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300",
          nivel
            ? "border-gray-200 opacity-100"
            : "border-gray-100 opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
            <Droplets className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              3. Volume de solução pronta
            </p>
            <p className="text-xs text-gray-400">
              Quantos litros deseja preparar?
            </p>
          </div>
        </div>
        <div className="p-5">
          {/* Input */}
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              value={volumeStr}
              onChange={(e) => handleVolumeChange(e.target.value)}
              placeholder="Ex: 10"
              className={clsx(
                "w-full px-4 py-3.5 pr-14 border rounded-xl text-lg font-semibold transition",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                volume > 0
                  ? "border-brand-300 bg-brand-50/50 text-gray-900"
                  : "border-gray-200 bg-white text-gray-900"
              )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
              litros
            </span>
          </div>

          {/* Presets rápidos */}
          <div className="flex flex-wrap gap-2 mt-3">
            {VOLUME_PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => handleVolumeChange(v.toString())}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95",
                  volume === v
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {v}L
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          RESULTADO
          ══════════════════════════════════════════════ */}
      {resultado && dilAtiva && (
        <section className="animate-slide-up-fade">
          {/* Card principal de resultado */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header do resultado */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700/50">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <p className="text-sm font-semibold text-white">
                Receita para {volume}L de solução
              </p>
              <span
                className={clsx(
                  "ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full",
                  nivel === "Leve" && "bg-emerald-500/20 text-emerald-400",
                  nivel === "Media" && "bg-amber-500/20 text-amber-400",
                  nivel === "Pesada" && "bg-red-500/20 text-red-400"
                )}
              >
                {dilAtiva.proporcao}
              </span>
            </div>

            {/* Métricas grandes */}
            <div className="grid grid-cols-2 gap-px bg-gray-700/30">
              {/* Concentrado */}
              <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-gray-900/50">
                <FlaskConical className="w-6 h-6 text-brand-400 mb-2" />
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {resultado.concentradoMl < 1000
                    ? `${resultado.concentradoMl.toFixed(0)}`
                    : `${resultado.concentradoLitros.toFixed(2)}`}
                </p>
                <p className="text-sm font-medium text-gray-400 mt-1">
                  {resultado.concentradoMl < 1000 ? "ml" : "litros"} de
                  concentrado
                </p>
              </div>

              {/* Água */}
              <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-gray-900/50">
                <Droplets className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {resultado.aguaLitros.toFixed(2)}
                </p>
                <p className="text-sm font-medium text-gray-400 mt-1">
                  litros de água
                </p>
              </div>
            </div>

            {/* Custo */}
            {resultado.custoPreparacao !== null && (
              <div className="px-5 py-4 bg-gray-800/50 border-t border-gray-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-gray-400">
                      Custo desta preparação
                    </span>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    R$ {resultado.custoPreparacao.toFixed(2)}
                  </span>
                </div>
                {resultado.custoLitro !== null && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    R$ {resultado.custoLitro.toFixed(4)}/litro pronto
                    {" · "}
                    1L de concentrado rende {resultado.rendimento}L de solução
                  </p>
                )}
              </div>
            )}

            {/* Sem preço disponível */}
            {resultado.custoPreparacao === null && (
              <div className="px-5 py-3 bg-gray-800/50 border-t border-gray-700/30">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  Sem compras registradas — custo indisponível
                </p>
              </div>
            )}
          </div>

          {/* Barra visual de proporção */}
          <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Proporção visual
            </p>
            <div className="flex h-5 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 transition-all duration-700"
                style={{
                  width: `${Math.max(
                    (resultado.concentradoLitros / volume) * 100,
                    2
                  )}%`,
                }}
              />
              <div
                className="bg-blue-200 transition-all duration-700"
                style={{
                  width: `${(resultado.aguaLitros / volume) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px]">
              <span className="text-brand-600 font-semibold">
                Concentrado ({((resultado.concentradoLitros / volume) * 100).toFixed(1)}%)
              </span>
              <span className="text-blue-500 font-semibold">
                Água ({((resultado.aguaLitros / volume) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Instrução de uso */}
          <div className="mt-3 bg-amber-50 rounded-xl border border-amber-200 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Instrução de Uso — {NIVEL_CFG[dilAtiva.tipo].label}
                </p>
                <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                  {dilAtiva.instrucaoDeUso}
                </p>
              </div>
            </div>
          </div>

          {/* ── Retirada de Estoque ── */}
          <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            {/* Info de estoque atual */}
            {estoqueProduto && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Estoque atual:{" "}
                    <span className={clsx(
                      "font-bold",
                      getStatusEstoque(estoqueProduto) === "ok" && "text-gray-900",
                      getStatusEstoque(estoqueProduto) === "baixo" && "text-amber-600",
                      getStatusEstoque(estoqueProduto) === "critico" && "text-orange-600",
                      getStatusEstoque(estoqueProduto) === "zerado" && "text-red-600",
                    )}>
                      {estoqueProduto.quantidadeAtual} {produtoSelecionado?.unidade}
                    </span>
                  </span>
                </div>
                {resultado && (
                  <span className="text-xs text-gray-400">
                    Precisa de {resultado.concentradoMl < 1000
                      ? `${resultado.concentradoMl.toFixed(0)}ml`
                      : `${resultado.concentradoLitros.toFixed(2)}L`}
                  </span>
                )}
              </div>
            )}

            {/* Alerta de estoque insuficiente */}
            {estoqueInsuficiente && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700">
                  <span className="font-semibold">Estoque insuficiente.</span>{" "}
                  Faltam {((resultado?.concentradoLitros ?? 0) - (estoqueProduto?.quantidadeAtual ?? 0)).toFixed(2)}{" "}
                  {produtoSelecionado?.unidade} para esta preparação.
                </p>
              </div>
            )}

            {/* Botão de retirada */}
            {!retiradaFeita ? (
              <button
                onClick={handleRegistrarRetirada}
                disabled={estoqueInsuficiente || (estoqueProduto?.quantidadeAtual === 0)}
                className={clsx(
                  "w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]",
                  estoqueInsuficiente || (estoqueProduto?.quantidadeAtual === 0)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow"
                )}
              >
                <PackageMinus className="w-4.5 h-4.5" />
                Registrar Retirada de Estoque
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <Check className="w-4.5 h-4.5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">
                  Retirada registrada com sucesso!
                </span>
              </div>
            )}

            {/* Saldo após retirada */}
            {retiradaFeita && estoqueProduto && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Novo saldo: <span className="font-semibold">{estoqueProduto.quantidadeAtual} {produtoSelecionado?.unidade}</span>
                {getStatusEstoque(estoqueProduto) !== "ok" && (
                  <span className={clsx(
                    "ml-2 font-semibold",
                    getStatusEstoque(estoqueProduto) === "baixo" && "text-amber-600",
                    getStatusEstoque(estoqueProduto) === "critico" && "text-orange-600",
                    getStatusEstoque(estoqueProduto) === "zerado" && "text-red-600",
                  )}>
                    — Atenção: estoque {getStatusEstoque(estoqueProduto) === "zerado" ? "zerado" : "abaixo do mínimo"}!
                  </span>
                )}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Estado vazio: convite para começar ── */}
      {stepsCompleted === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50">
            <FlaskConical className="w-7 h-7 text-brand-500" />
          </div>
          <p className="text-sm text-gray-500 max-w-xs">
            Selecione um produto acima para começar a calcular a diluição ideal.
          </p>
          <p className="text-xs text-gray-400">
            {produtos.length} produto{produtos.length !== 1 ? "s" : ""}{" "}
            disponíve{produtos.length !== 1 ? "is" : "l"} ·{" "}
            {diluicoes.length} faixa{diluicoes.length !== 1 ? "s" : ""} de
            diluição cadastrada{diluicoes.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
