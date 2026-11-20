import React from 'react';
import { PaymentStatus } from '../types';

export const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'Pendiente de diseño': 'bg-amber-100 text-amber-800 border-amber-200',
    'Esperando aprobación': 'bg-purple-100 text-purple-800 border-purple-200',
    'En producción': 'bg-sky-100 text-sky-800 border-sky-200',
    'Listo para retirar': 'bg-pink-100 text-pink-800 border-pink-200',
    Enviado: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Entregado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Cancelado: 'bg-rose-100 text-rose-700 border-rose-200 line-through',
  };

  const cls = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {status}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const styles: Record<PaymentStatus, string> = {
    Pagado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Seña: 'bg-amber-50 text-amber-700 border-amber-200',
    Pendiente: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
        styles[status] || styles.Pendiente
      }`}
    >
      {status}
    </span>
  );
};
