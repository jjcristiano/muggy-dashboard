import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BellRing,
  Box,
  CalendarHeart,
  Coins,
  Flame,
  Package,
  PieChart,
  PlusCircle,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import { Sale, SectionId } from '../types';
import {
  buildSalesChartData,
  filterValidSales,
  getCommercialSummary,
  getDashboardComparisons,
  getTopProducts,
} from '../utils/analytics';
import { resolveEphemerides } from '../utils/ephemerides';
import {
  formatARS,
  formatLongDate,
  formatShortDate,
  getTodayAR,
} from '../utils/formatters';
import { InteractiveSalesChart } from './InteractiveSalesChart';
import { OrderStatusBadge, PaymentStatusBadge } from './StatusBadge';

interface DashboardViewProps {
  onNewSale: () => void;
  onEditSale: (sale: Sale) => void;
  onNavigate: (section: SectionId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNewSale,
  onEditSale,
  onNavigate,
}) => {
  const { visibleSales, ephemerides, settings } = useMuggy();
  const [chartPeriod, setChartPeriod] = useState<
    'diario' | 'semanal' | 'mensual' | 'anual'
  >('diario');
  const [kpiComparisonMode, setKpiComparisonMode] = useState<
    'month' | 'week' | 'year'
  >('month');
  const [profitabilityPeriod, setProfitabilityPeriod] = useState<
    'today' | 'week' | 'month' | 'year'
  >('month');

  const todayStr = getTodayAR();
  const currentYear = Number(todayStr.split('-')[0]) || 2026;

  const validSales = useMemo(
    () => filterValidSales(visibleSales, settings.includeCancelledInStats),
    [visibleSales, settings.includeCancelledInStats]
  );

  const comp = useMemo(
    () => getDashboardComparisons(validSales, todayStr),
    [validSales, todayStr]
  );

  const chartData = useMemo(
    () => buildSalesChartData(validSales, chartPeriod, todayStr),
    [validSales, chartPeriod, todayStr]
  );

  const topProducts = useMemo(
    () => getTopProducts(validSales).slice(0, 6),
    [validSales]
  );

  const commercialSummary = useMemo(
    () => getCommercialSummary(validSales),
    [validSales]
  );

  const recentSales = useMemo(
    () =>
      [...visibleSales]
        .sort((a, b) =>
          a.date !== b.date
            ? b.date.localeCompare(a.date)
            : b.createdAt.localeCompare(a.createdAt)
        )
        .slice(0, 6),
    [visibleSales]
  );

  const upcomingAlerts = useMemo(() => {
    const resolved = resolveEphemerides(ephemerides, currentYear, todayStr);
    return resolved
      .filter(
        (ef) =>
          ef.isCommercialOpportunity && ef.daysUntil >= 0 && ef.daysUntil <= 45
      )
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [ephemerides, currentYear, todayStr]);

  const activeKpiPeriod =
    kpiComparisonMode === 'week'
      ? {
          label: 'Esta Semana vs. Anterior',
          stats: comp.week.current,
          prevStats: comp.week.previous,
          ordersGrowth: comp.week.ordersGrowth,
          unitsGrowth: comp.week.unitsGrowth,
          profitGrowth: comp.week.profitGrowth,
          ticketGrowth: comp.month.ticketGrowth,
        }
      : kpiComparisonMode === 'year'
      ? {
          label: 'Este Año vs. Anterior',
          stats: comp.year.current,
          prevStats: comp.year.previous,
          ordersGrowth: comp.year.ordersGrowth,
          unitsGrowth: comp.year.unitsGrowth,
          profitGrowth: comp.year.profitGrowth,
          ticketGrowth: comp.month.ticketGrowth,
        }
      : {
          label: 'Este Mes vs. Anterior',
          stats: comp.month.current,
          prevStats: comp.month.previous,
          ordersGrowth: comp.month.ordersGrowth,
          unitsGrowth: comp.month.unitsGrowth,
          profitGrowth: comp.month.profitGrowth,
          ticketGrowth: comp.month.ticketGrowth,
        };

  const activeProfitabilityStats =
    profitabilityPeriod === 'today'
      ? comp.today.current
      : profitabilityPeriod === 'week'
      ? comp.week.current
      : profitabilityPeriod === 'year'
      ? comp.year.current
      : comp.month.current;

  return (
    <div className="space-y-5">
      {/* Banner Principal Mobile-First */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF6EC] via-[#FFEBF5] to-[#E6F9FF] border border-pink-200/70 p-4 sm:p-6 shadow-muggy">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <img
              src="/assets/muggy-mascot.png"
              alt="Mascota Muggy"
              className="w-14 h-14 sm:w-20 sm:h-20 object-contain drop-shadow-md shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-pink-200 text-[#FF0080] text-[11px] font-bold mb-1">
                <Sparkles className="w-3 h-3" />
                {formatLongDate(todayStr)}
              </div>
              <h1 className="font-display text-xl sm:text-3xl font-bold text-slate-900 leading-tight">
                Centro de Control <span className="text-[#FF0080]">Muggy</span>
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Costos de compra, packaging real y rentabilidad neta en ARS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewSale}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#FF3399] hover:from-[#E60073] hover:to-[#FF0080] text-white font-display font-bold text-sm shadow-muggy active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Nueva Venta
            </button>
            <button
              onClick={() => onNavigate('calendario')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3.5 rounded-2xl bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              <CalendarHeart className="w-4 h-4 text-[#00A8E8]" />
              <span className="hidden sm:inline">Efemérides</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas Principales: Hoy, Semana, Mes, Año */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Ventas de Hoy */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-card">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Hoy
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                comp.today.revenueGrowth.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {comp.today.revenueGrowth.isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {comp.today.revenueGrowth.label}
            </span>
          </div>
          <div className="font-display text-xl sm:text-3xl font-bold text-slate-900">
            {formatARS(comp.today.current.revenue)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-0.5">
            <span className="text-emerald-700 font-bold">
              Neta: {formatARS(comp.today.current.profit)}
            </span>
            <span className="text-slate-400">
              Ayer: {formatARS(comp.today.previous.revenue)}
            </span>
          </div>
        </div>

        {/* Ventas de la Semana */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-sky-100 shadow-card">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Semana
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                comp.week.revenueGrowth.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {comp.week.revenueGrowth.isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {comp.week.revenueGrowth.label}
            </span>
          </div>
          <div className="font-display text-xl sm:text-3xl font-bold text-slate-900">
            {formatARS(comp.week.current.revenue)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-0.5">
            <span className="text-emerald-700 font-bold">
              Neta: {formatARS(comp.week.current.profit)}
            </span>
            <span className="text-slate-400">
              Ant: {formatARS(comp.week.previous.revenue)}
            </span>
          </div>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-amber-200/80 shadow-card">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Mes Actual
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                comp.month.revenueGrowth.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {comp.month.revenueGrowth.isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {comp.month.revenueGrowth.label}
            </span>
          </div>
          <div className="font-display text-xl sm:text-3xl font-bold text-slate-900">
            {formatARS(comp.month.current.revenue)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-0.5">
            <span className="text-emerald-700 font-bold">
              Neta: {formatARS(comp.month.current.profit)}
            </span>
            <span className="text-slate-400">
              Ant: {formatARS(comp.month.previous.revenue)}
            </span>
          </div>
        </div>

        {/* Ventas del Año */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-card">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Año {currentYear}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                comp.year.revenueGrowth.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {comp.year.revenueGrowth.isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {comp.year.revenueGrowth.label}
            </span>
          </div>
          <div className="font-display text-xl sm:text-3xl font-bold text-slate-900">
            {formatARS(comp.year.current.revenue)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-0.5">
            <span className="text-emerald-700 font-bold">
              Neta: {formatARS(comp.year.current.profit)}
            </span>
            <span className="text-slate-400">
              {currentYear - 1}: {formatARS(comp.year.previous.revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN 8: RESUMEN DE RENTABILIDAD (Desglose de Facturación, Productos, Packaging, Otros Gastos y Ganancia) */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-pink-100 shadow-muggy space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#FF0080] flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                Resumen de Rentabilidad y Estructura de Costos
              </h2>
              <p className="text-xs text-slate-500">
                ¿A dónde va cada peso facturado? Desglose entre compra de productos, packaging y ganancia real
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold self-start sm:self-auto">
            {(
              [
                { id: 'today', label: 'Hoy' },
                { id: 'week', label: 'Semana' },
                { id: 'month', label: 'Mes' },
                { id: 'year', label: 'Año' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfitabilityPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  profitabilityPeriod === p.id
                    ? 'bg-[#FF0080] text-white shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Tarjetas del Resumen de Rentabilidad */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Facturación Total
            </span>
            <span className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-0.5 block">
              {formatARS(activeProfitabilityStats.revenue)}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              100% de ingresos
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
              Costo Productos
            </span>
            <span className="font-display text-lg sm:text-xl font-bold text-amber-900 mt-0.5 block">
              {formatARS(activeProfitabilityStats.productCost)}
            </span>
            <span className="text-[11px] font-bold text-amber-700">
              {activeProfitabilityStats.productCostPct}% de la venta
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80">
            <span className="text-[10px] font-extrabold uppercase text-sky-800 flex items-center gap-1">
              <Box className="w-3 h-3" /> Costo Packaging
            </span>
            <span className="font-display text-lg sm:text-xl font-bold text-[#0088CC] mt-0.5 block">
              {formatARS(activeProfitabilityStats.packagingCost)}
            </span>
            <span className="text-[11px] font-bold text-sky-700">
              {activeProfitabilityStats.packagingCostPct}% de la venta
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
              Otros Gastos
            </span>
            <span className="font-display text-lg sm:text-xl font-bold text-slate-700 mt-0.5 block">
              {formatARS(activeProfitabilityStats.otherCosts)}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {activeProfitabilityStats.otherCostsPct}% de la venta
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-200/80">
            <span className="text-[10px] font-extrabold uppercase text-[#FF0080] block">
              Ganancia Bruta
            </span>
            <span className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-0.5 block">
              {formatARS(activeProfitabilityStats.grossProfit)}
            </span>
            <span className="text-[11px] text-slate-500">
              Venta - Prod - Pkg
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300/80">
            <span className="text-[10px] font-extrabold uppercase text-emerald-800 flex items-center gap-1">
              <Coins className="w-3 h-3" /> Ganancia Neta
            </span>
            <span className="font-display text-lg sm:text-xl font-bold text-emerald-700 mt-0.5 block">
              {formatARS(activeProfitabilityStats.profit)}
            </span>
            <span className="text-[11px] font-extrabold text-emerald-700">
              {activeProfitabilityStats.profitPct}% libre real
            </span>
          </div>
        </div>

        {/* Barra de Distribución Porcentual de la Facturación */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="font-bold text-slate-700">
              Distribución porcentual sobre la facturación:
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Productos: {activeProfitabilityStats.productCostPct}%
              </span>
              <span className="flex items-center gap-1 text-sky-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A8E8] inline-block" />
                Packaging: {activeProfitabilityStats.packagingCostPct}%
              </span>
              {activeProfitabilityStats.otherCostsPct > 0 && (
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                  Otros: {activeProfitabilityStats.otherCostsPct}%
                </span>
              )}
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Ganancia Neta: {activeProfitabilityStats.profitPct}%
              </span>
            </div>
          </div>

          <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200">
            {activeProfitabilityStats.revenue > 0 ? (
              <>
                <div
                  style={{
                    width: `${Math.max(0, activeProfitabilityStats.productCostPct)}%`,
                  }}
                  className="h-full bg-amber-400 first:rounded-l-full"
                  title={`Compra de productos: ${activeProfitabilityStats.productCostPct}%`}
                />
                <div
                  style={{
                    width: `${Math.max(0, activeProfitabilityStats.packagingCostPct)}%`,
                  }}
                  className="h-full bg-[#00A8E8]"
                  title={`Packaging: ${activeProfitabilityStats.packagingCostPct}%`}
                />
                <div
                  style={{
                    width: `${Math.max(0, activeProfitabilityStats.otherCostsPct)}%`,
                  }}
                  className="h-full bg-slate-400"
                  title={`Otros gastos: ${activeProfitabilityStats.otherCostsPct}%`}
                />
                <div
                  style={{
                    width: `${Math.max(0, activeProfitabilityStats.profitPct)}%`,
                  }}
                  className="h-full bg-emerald-500 last:rounded-r-full"
                  title={`Ganancia neta: ${activeProfitabilityStats.profitPct}%`}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                Sin ventas registradas en este período
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertas Comerciales Próximas */}
      {upcomingAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {upcomingAlerts.map((alert) => {
            const isUrgent = alert.daysUntil <= 10;
            return (
              <div
                key={alert.id}
                onClick={() => onNavigate('calendario')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-start gap-3 ${
                  isUrgent
                    ? 'bg-gradient-to-br from-pink-50 to-amber-50 border-pink-300 shadow-sm'
                    : 'bg-white border-sky-200/80 shadow-card'
                }`}
              >
                <div
                  className={`p-2.5 rounded-2xl shrink-0 ${
                    isUrgent
                      ? 'bg-[#FF0080] text-white'
                      : 'bg-sky-100 text-[#0088CC]'
                  }`}
                >
                  <BellRing className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF0080]">
                      {alert.daysUntil === 0
                        ? '¡ES HOY!'
                        : `Faltan ${alert.daysUntil} días`}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {formatShortDate(alert.nextOccurrenceDate)}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm truncate mt-0.5">
                    {alert.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                    Sugerido: {alert.suggestions.slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Indicadores Operativos (Pedidos, Unidades, Ganancia, Ticket Promedio) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/70 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF0080]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Indicadores Operativos ({activeKpiPeriod.label})
            </span>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {(['week', 'month', 'year'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setKpiComparisonMode(m)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  kpiComparisonMode === m
                    ? 'bg-white text-[#FF0080] shadow-sm font-bold'
                    : 'text-slate-600'
                }`}
              >
                {m === 'week' ? 'Semanal' : m === 'month' ? 'Mensual' : 'Anual'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FDF9F5] border border-amber-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">
                Pedidos
              </span>
              <div className="font-display text-xl sm:text-2xl font-bold text-slate-800">
                {activeKpiPeriod.stats.ordersCount}
              </div>
              <span className="text-[10px] text-slate-500">
                Ant: {activeKpiPeriod.prevStats.ordersCount} (
                {activeKpiPeriod.ordersGrowth.label})
              </span>
            </div>
            <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0" />
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">
                Unidades
              </span>
              <div className="font-display text-xl sm:text-2xl font-bold text-slate-800">
                {activeKpiPeriod.stats.unitsSold} u.
              </div>
              <span className="text-[10px] text-slate-500">
                Ant: {activeKpiPeriod.prevStats.unitsSold} u.
              </span>
            </div>
            <Package className="w-5 h-5 text-sky-600 shrink-0" />
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-800">
                Ganancia Neta
              </span>
              <div className="font-display text-xl sm:text-2xl font-bold text-emerald-700">
                {formatARS(activeKpiPeriod.stats.profit)}
              </div>
              <span className="text-[10px] text-emerald-700">
                {activeKpiPeriod.profitGrowth.label} vs ant.
              </span>
            </div>
            <Coins className="w-5 h-5 text-emerald-600 shrink-0" />
          </div>

          <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">
                Ticket Prom.
              </span>
              <div className="font-display text-xl sm:text-2xl font-bold text-slate-800">
                {formatARS(activeKpiPeriod.stats.avgTicket)}
              </div>
              <span className="text-[10px] text-slate-500">Por pedido</span>
            </div>
            <Receipt className="w-5 h-5 text-[#FF0080] shrink-0" />
          </div>
        </div>
      </div>

      {/* Gráfico de Evolución + Ranking de Productos Más Vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Evolución de Ventas y Ganancias
              </h2>
              <p className="text-xs text-slate-500">
                Facturación (rosa) vs. Ganancia Neta libre de producto y packaging (celeste)
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {(['diario', 'semanal', 'mensual', 'anual'] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setChartPeriod(mode)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg capitalize transition-all ${
                      chartPeriod === mode
                        ? 'bg-[#FF0080] text-white shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                )
              )}
            </div>
          </div>

          <InteractiveSalesChart data={chartData} height={240} />
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="font-display text-lg font-bold text-slate-900">
                Más Vendidos
              </h2>
            </div>
            <button
              onClick={() => onNavigate('productos')}
              className="text-xs font-bold text-[#FF0080] hover:underline"
            >
              Catálogo
            </button>
          </div>

          {topProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center py-8">
              Aún no hay ventas registradas.
            </div>
          ) : (
            <div className="space-y-3.5 flex-1">
              {topProducts.map((prod, idx) => {
                const maxUnits = topProducts[0]?.unitsSold || 1;
                const barWidth = Math.max(
                  12,
                  Math.round((prod.unitsSold / maxUnits) * 100)
                );

                return (
                  <div key={prod.productId || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-pink-50 text-[#FF0080] flex items-center justify-center font-bold text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 truncate">
                          {prod.productName}
                        </span>
                      </div>
                      <span className="font-extrabold text-[#FF0080] shrink-0 ml-2">
                        {prod.unitsSold} u.
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#FF0080] to-[#00C2FF]"
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Venta: {formatARS(prod.totalRevenue)}</span>
                      <span className="text-emerald-600 font-semibold">
                        Ganancia: {formatARS(prod.totalProfit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actividad Reciente (Tarjetas en Celular + Tabla en PC) y Resumen Comercial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Actividad Reciente
              </h2>
              <p className="text-xs text-slate-500">
                Tocá cualquier pedido para editarlo o ver su costo histórico
              </p>
            </div>
            <button
              onClick={() => onNavigate('ventas')}
              className="text-xs font-bold text-[#FF0080] hover:underline"
            >
              Ver todas →
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No hay ventas registradas todavía.
            </div>
          ) : (
            <>
              {/* Vista Mobile: Tarjetas sin scroll horizontal */}
              <div className="md:hidden space-y-2.5">
                {recentSales.map((sale) => {
                  const netP =
                    sale.netProfit !== undefined
                      ? sale.netProfit
                      : sale.grossProfit;
                  return (
                    <div
                      key={sale.id}
                      onClick={() => onEditSale(sale)}
                      className="p-3.5 rounded-2xl bg-slate-50/80 active:bg-pink-50/50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-500">
                          {formatShortDate(sale.date)} • {sale.quantity} u.
                        </span>
                        <OrderStatusBadge status={sale.orderStatus} />
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        {sale.productName}
                        {sale.variant ? ` (${sale.variant})` : ''}
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="font-bold text-slate-900">
                            {formatARS(sale.totalRevenue)}
                          </span>{' '}
                          <PaymentStatusBadge status={sale.paymentStatus} />
                        </div>
                        <span className="font-bold text-emerald-700">
                          Ganancia: {formatARS(netP)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vista Desktop: Tabla completa */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 pr-3">Fecha</th>
                      <th className="py-2.5 px-3">Producto / Presentación</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Importe</th>
                      <th className="py-2.5 px-3 text-right">Ganancia Neta</th>
                      <th className="py-2.5 pl-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {recentSales.map((sale) => {
                      const netP =
                        sale.netProfit !== undefined
                          ? sale.netProfit
                          : sale.grossProfit;
                      return (
                        <tr
                          key={sale.id}
                          onClick={() => onEditSale(sale)}
                          className="hover:bg-pink-50/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 pr-3 whitespace-nowrap text-xs font-semibold text-slate-600">
                            {formatShortDate(sale.date)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800 text-sm">
                              {sale.productName}
                              {sale.variant && (
                                <span className="text-slate-500 font-normal">
                                  {' '}
                                  — {sale.variant}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {sale.clientName || 'Consumidor Final'} •{' '}
                              {sale.packagingMode === 'sin_presentacion'
                                ? 'Sin packaging'
                                : 'Con presentación'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700 text-xs">
                            {sale.quantity} u.
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {formatARS(sale.totalRevenue)}
                            </div>
                            <PaymentStatusBadge status={sale.paymentStatus} />
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-emerald-600">
                            {formatARS(netP)}
                          </td>
                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            <OrderStatusBadge status={sale.orderStatus} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Resumen Comercial */}
        <div className="lg:col-span-4 bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-300 mb-1">
              <Award className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Resumen Comercial Muggy
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-4">
              Hitos del Negocio
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                <div className="text-[11px] uppercase tracking-wider text-pink-300 font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Producto Más Vendido
                </div>
                <div className="font-display font-bold text-base mt-0.5 text-white">
                  {commercialSummary.bestProduct
                    ? `${commercialSummary.bestProduct.productName} (${commercialSummary.bestProduct.unitsSold} u.)`
                    : 'Sin registros'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-sky-300 font-bold uppercase">
                    Día Récord
                  </div>
                  <div className="font-display font-bold text-sm mt-1">
                    {commercialSummary.bestDay
                      ? formatShortDate(commercialSummary.bestDay.date)
                      : '-'}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {commercialSummary.bestDay
                      ? formatARS(commercialSummary.bestDay.revenue)
                      : '$0'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-amber-300 font-bold uppercase">
                    Mejor Mes
                  </div>
                  <div className="font-display font-bold text-sm mt-1 truncate">
                    {commercialSummary.bestMonth
                      ? commercialSummary.bestMonth.label
                      : '-'}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {commercialSummary.bestMonth
                      ? formatARS(commercialSummary.bestMonth.revenue)
                      : '$0'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">
                    Ganancia Neta Acumulada
                  </div>
                  <div className="font-display text-2xl font-bold text-emerald-300 mt-0.5">
                    {formatARS(commercialSummary.totalProfit)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-300 block">Unidades</span>
                  <span className="font-display text-xl font-bold text-white">
                    {commercialSummary.totalUnits} u.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reportes')}
            className="mt-5 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            Abrir Reportes y Exportar →
          </button>
        </div>
      </div>
    </div>
  );
};
