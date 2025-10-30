import React from "react";
import VipCTAButton from "./VipCTAButton";

export default function VipPromoModal() {
  return (
    <div className="space-y-4 my-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1 Mese (attivo) */}
        <div className="rounded-xl border border-zinc-700 p-4 bg-zinc-900/50">
          <div className="text-lg font-semibold mb-1">1 mese</div>
          <div className="text-2xl font-bold mb-3">€1</div>
          <VipCTAButton />
          <p className="text-xs text-zinc-400 mt-2">
            Pagamento su BuyMeACoffee, poi attiva il VIP su{" "}
            <code>/vip-confirm.html</code>
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

      <div className="text-xs text-zinc-500">
        Dopo il pagamento clicca il link di ritorno:
        <code> /vip-confirm.html?days=30 </code>
      </div>
    </div>
  );
}
