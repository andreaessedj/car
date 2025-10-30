import React from 'react';

type VipCTAButtonProps = {
  days?: number; // default 30
  className?: string;
};

export default function VipCTAButton({ days = 30, className = '' }: VipCTAButtonProps) {
  const href = 'https://buymeacoffee.com/adultmeet';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className || 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold border-2 border-black bg-[#ffdd00] text-black hover:brightness-90 transition'}
      title="Diventa VIP - 1 mese"
    >
      🔥 Diventa VIP – 1€ / 1 mese
    </a>
  );
}
