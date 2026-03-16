"use client";

import { useEffect, useState, useRef } from "react";
import { X, Printer, Download, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface GerarEtiquetaModalProps {
  produtoId: string | null;
  produtoNome: string | null;
  open: boolean;
  onClose: () => void;
}

export function GerarEtiquetaModal({
  produtoId,
  produtoNome,
  open,
  onClose,
}: GerarEtiquetaModalProps) {
  const [qrUrl, setQrUrl] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && produtoId && typeof window !== "undefined") {
      setQrUrl(`${window.location.origin}/diluicoes?id=${produtoId}`);
    }
  }, [open, produtoId]);

  if (!open) return null;

  const handleImprimir = () => {
    window.print();
  };

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `etiqueta-${produtoNome?.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 print:bg-white print:p-0">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden print:w-[300px] print:shadow-none print:border print:border-gray-200">
        {/* Cabeçalho - Visível apenas na tela */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50">
              <QrCode className="w-4 h-4 text-brand-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Etiqueta QR Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo da Etiqueta */}
        <div className="p-8 flex flex-col items-center justify-center gap-6" ref={qrRef}>
          {/* Logo Fantasia - Dona Help */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-black text-brand-600 tracking-tight">Dona Help</span>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              Gestão de Produtos
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl w-full flex justify-center">
            {qrUrl && (
              <QRCodeCanvas
                value={qrUrl}
                size={180}
                bgColor={"#ffffff"}
                fgColor={"#111827"}
                level={"H"} // Alta correção de erro para durabilidade em ambientes operacionais
                includeMargin={false}
              />
            )}
          </div>

          <div className="text-center w-full">
            <p className="text-sm font-bold text-gray-900 leading-snug px-4">
              {produtoNome}
            </p>
            <p className="text-xs text-gray-500 mt-1.5">
              Escaneie para preparar a diluição
            </p>
          </div>
        </div>

        {/* Ações - Visível apenas na tela */}
        <div className="flex items-center gap-3 px-6 py-5 bg-gray-50/50 border-t border-gray-100 print:hidden">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            Salvar
          </button>
          <button
            onClick={handleImprimir}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>

        {/* CSS para Impressão */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:bg-white, .print\\:bg-white * {
              visibility: visible;
            }
            .print\\:bg-white {
              position: absolute;
              left: 0;
              top: 0;
              margin: 0;
              padding: 0;
            }
          }
        `}} />
      </div>
    </div>
  );
}
