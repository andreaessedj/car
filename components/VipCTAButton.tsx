import React from "react";

// ✅ METTI QUI il link esatto dell’Extra “VIP 1 mese – €1”
// Esempio (se non hai il link dell’Extra): usa la pagina generale degli Extra
const BMC_EXTRA_URL = "https://buymeacoffee.com/adultmeet/extras";

type VipCTAButtonProps = {
  days?: number; // per futuri piani
  className?: string;
};

export default function VipCTAButton({ days = 30, className = "" }: VipCTAButtonProps) {
  return (
    <a
      href={BMC_EXTRA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ||
        "inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold border-2 border-black bg-[#ffdd00] text-black hover:brightness-90 transition"
      }
      title="Diventa VIP - 1 mese"
    >
      🔥 Diventa VIP – 1€ / 1 mese
    </a>
  );
}
