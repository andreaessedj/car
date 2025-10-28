import React from 'react';

/**
 * StatusChip
 *
 * Piccolo badge con pallino verde/grigio + testo stato.
 *
 * Props:
 *  - label: stringa da mostrare ("Online", "Ultimo accesso X min fa")
 *  - online: boolean -> colora verde se true, grigio se false
 */
export function StatusChip({
  label,
  online,
}: {
  label: string;
  online: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        lineHeight: 1.2,
        padding: '2px 8px',
        borderRadius: '999px',
        backgroundColor: online
          ? 'rgba(0,200,0,0.15)'
          : 'rgba(128,128,128,0.15)',
        color: online ? 'rgb(0,140,0)' : '#666',
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: online ? 'rgb(0,200,0)' : '#999',
        }}
      />
      {label}
    </span>
  );
}
