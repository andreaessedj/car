import React from "react";
import VipCTAButton from "./VipCTAButton";

type VipPromoModalProps = {
  onClose?: () => void;
};

export default function VipPromoModal({ onClose }: VipPromoModalProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* backdrop cliccabile per chiudere */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
      />
      {/* sheet */}
      <div className="relative mx-auto max-w-3xl">
        <div className="m-2 rounded-2xl border border-zinc-700 bg-zinc-900 text-white shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <h3 className="font-semibold">Scegli il tuo VIP</h3>
            <button
              onClick={onClose}
              className="rounded-lg border border-zinc-600 px-2 py-1 text-sm hover:bg-zinc-800"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* 1 Mese (attivo) */}
              <div className="rounded-xl border border-zinc-700 p-4 bg-zinc-900/50">
                <div className="text-lg font-semibold mb-1">1 mese</div>
                <div className="text-2xl font-bold mb-3">€1</div>
                <VipCTAButton />
                <p className="text-xs text-zinc-400 mt-2">
                  Pagamento su BuyMeACoffee
                </p>
              </div>

              {/* 6 Mesi (disattivato) */}
              <div className="rounded-xl border border-zinc-800 p-4 bg-zinc-950/40 opacity-60 pointer-events-none select-none">
                <div className="text-lg font-semibold mb-1">6 mesi</div>
                <div className="text-2xl font-bold mb-3">€5</div>
                <button
                  className="px-4 py-2 rounded-lg font-semibold border border-zinc-700 bg-zinc-800 text-zinc-300"
                  disabled
                >
                  Non disponibile
                </button>
              </div>

              {/* 12 Mesi (disattivato) */}
              <div className="rounded-xl border border-zinc-800 p-4 bg-zinc-950/40 opacity-60 pointer-events-none select-none">
                <div className="text-lg font-semibold mb-1">12 mesi</div>
                <div className="text-2xl font-bold mb-3">€9</div>
                <button
                  className="px-4 py-2 rounded-lg font-semibold border border-zinc-700 bg-zinc-800 text-zinc-300"
                  disabled
                >
                  Non disponibile
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 mt-3">
              Dopo il pagamento, sarai reindirizzato su questo sito
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
