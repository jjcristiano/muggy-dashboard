export const AR_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Formatea un monto numérico en Pesos Argentinos (ARS)
 */
export function formatARS(amount: number): string {
  const rounded = Math.round(amount || 0);
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
  return formatted;
}

/**
 * Obtiene la fecha actual en zona horaria de Argentina (YYYY-MM-DD)
 */
export function getTodayAR(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: AR_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

/**
 * Parsea un string YYYY-MM-DD a objeto Date local seguro (mediodía para evitar desfasajes)
 */
export function parseDateStr(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

/**
 * Convierte un objeto Date a YYYY-MM-DD
 */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formatea YYYY-MM-DD a formato legible en español argentino (ej. "17 nov 2026" o "17/11/2026")
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatLongDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = parseDateStr(dateStr);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Calcula la diferencia en días desde dateStr1 hasta dateStr2 (dateStr2 - dateStr1)
 */
export function diffDays(fromDateStr: string, toDateStr: string): number {
  const d1 = parseDateStr(fromDateStr);
  const d2 = parseDateStr(toDateStr);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

/**
 * Suma o resta días a un YYYY-MM-DD
 */
export function addDaysStr(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/**
 * Obtiene el lunes de la semana de una fecha YYYY-MM-DD
 */
export function getStartOfWeekStr(dateStr: string): string {
  const d = parseDateStr(dateStr);
  const day = d.getDay(); // 0 (Dom) - 6 (Sáb)
  const diff = day === 0 ? -6 : 1 - day; // Lunes como primer día
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

/**
 * Obtiene el domingo de la semana de una fecha YYYY-MM-DD
 */
export function getEndOfWeekStr(dateStr: string): string {
  const start = getStartOfWeekStr(dateStr);
  return addDaysStr(start, 6);
}

/**
 * Calcula porcentaje de variación entre valor actual y valor anterior
 */
export function calcGrowthPercentage(current: number, previous: number): {
  percentage: number;
  isPositive: boolean;
  isNeutral: boolean;
  label: string;
} {
  if (previous === 0 && current === 0) {
    return { percentage: 0, isPositive: true, isNeutral: true, label: '0%' };
  }
  if (previous === 0 && current > 0) {
    return { percentage: 100, isPositive: true, isNeutral: false, label: '+100%' };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(pct * 10) / 10;
  return {
    percentage: rounded,
    isPositive: rounded >= 0,
    isNeutral: rounded === 0,
    label: `${rounded > 0 ? '+' : ''}${rounded}%`,
  };
}
