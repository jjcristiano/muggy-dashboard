import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Coins,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import {
  ChartDataPoint,
  computeStatsForSales,
  filterSalesByDateRange,
  filterValidSales,
  getTopProducts,
} from '../utils/analytics';
import {
  exportSalesToCSV,
  exportSalesToExcel,
  exportSalesToPDF,
} from '../utils/exporters';
import {
  addDaysStr,
  calcGrowthPercentage,
  formatARS,
  formatShortDate,
  getStartOfWeekStr,
  getTodayAR,
  toDateStr,
} from '../utils/formatters';
import { InteractiveSalesChart } from './InteractiveSalesChart';

type ReportTab = 'diario' | 'semanal' | 'mensual' | 'anual' | 'personalizado';

const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const ReportsView: React.FC = () => {
  const { visibleSales, products, settings } = useMuggy();

  const todayStr = getTodayAR();
  const [currentYearNum, currentMonthNum] = todayStr.split('-').map(Number);

  const [activeTab, setActiveTab] = useState<ReportTab>('mensual');

  // Selectores por pestaña
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [selectedWeekRef, setSelectedWeekRef] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentYearNum}-${String(currentMonthNum).padStart(2, '0')}`
  );
  const [selectedYear, setSelectedYear] = useState(currentYearNum);
  const [customStart, setCustomStart] = useState(
    `${currentYearNum}-${String(currentMonthNum).padStart(2, '0')}-01`
  );
  const [customEnd, setCustomEnd] = useState(todayStr);

  // Filtros adicionales de segmentación
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [saleChannelFilter, setSaleChannelFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Aplicar filtros de segmentación sobre las ventas
  const segmentedSales = useMemo(() => {
    const base = filterValidSales(
      visibleSales,
      orderStatusFilter === 'Cancelado' || settings.includeCancelledInStats
    );

    return base.filter((s) => {
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
      if (productFilter !== 'ALL' && s.productId !== productFilter) return false;
      if (paymentMethodFilter !== 'ALL' && s.paymentMethod !== paymentMethodFilter)
        return false;
      if (saleChannelFilter !== 'ALL' && s.saleChannel !== saleChannelFilter)
        return false;
      if (orderStatusFilter !== 'ALL' && s.orderStatus !== orderStatusFilter)
        return false;
      return true;
    });
  }, [
    visibleSales,
    settings.includeCancelledInStats,
    categoryFilter,
    productFilter,
    paymentMethodFilter,
    saleChannelFilter,
    orderStatusFilter,
  ]);

  // Calcular rango actual, rango anterior y puntos de gráfico según la pestaña activa
  const reportData = useMemo(() => {
    let startStr = todayStr;
    let endStr = todayStr;
    let prevStartStr = addDaysStr(todayStr, -1);
    let prevEndStr = addDaysStr(todayStr, -1);
    let periodLabel = '';
    let prevPeriodLabel = '';
    const chartPoints: ChartDataPoint[] = [];

    if (activeTab === 'diario') {
      startStr = selectedDay;
      endStr = selectedDay;
      prevStartStr = addDaysStr(selectedDay, -1);
      prevEndStr = prevStartStr;
      periodLabel = `Día ${formatShortDate(selectedDay)}`;
      prevPeriodLabel = `Día anterior (${formatShortDate(prevStartStr)})`;

      // Evolución últimos 7 días hasta el día elegido
      for (let i = 6; i >= 0; i--) {
        const d = addDaysStr(selectedDay, -i);
        const [, m, day] = d.split('-');
        const ds = filterSalesByDateRange(segmentedSales, d, d);
        const st = computeStatsForSales(ds);
        chartPoints.push({
          label: `${day}/${m}`,
          subLabel: formatShortDate(d),
          revenue: st.revenue,
          profit: st.profit,
          orders: st.ordersCount,
          units: st.unitsSold,
        });
      }
    } else if (activeTab === 'semanal') {
      startStr = getStartOfWeekStr(selectedWeekRef);
      endStr = addDaysStr(startStr, 6);
      prevStartStr = addDaysStr(startStr, -7);
      prevEndStr = addDaysStr(startStr, -1);
      periodLabel = `Semana ${formatShortDate(startStr)} al ${formatShortDate(endStr)}`;
      prevPeriodLabel = `Semana anterior (${formatShortDate(prevStartStr)} al ${formatShortDate(prevEndStr)})`;

      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      for (let i = 0; i < 7; i++) {
        const d = addDaysStr(startStr, i);
        const [, m, day] = d.split('-');
        const ds = filterSalesByDateRange(segmentedSales, d, d);
        const st = computeStatsForSales(ds);
        chartPoints.push({
          label: `${dayNames[i]} ${day}`,
          subLabel: `${dayNames[i]} ${day}/${m}`,
          revenue: st.revenue,
          profit: st.profit,
          orders: st.ordersCount,
          units: st.unitsSold,
        });
      }
    } else if (activeTab === 'mensual') {
      const [y, m] = selectedMonth.split('-').map(Number);
      startStr = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const prevDate = new Date(y, m - 2, 1, 12, 0, 0);
      const py = prevDate.getFullYear();
      const pm = prevDate.getMonth() + 1;
      prevStartStr = `${py}-${String(pm).padStart(2, '0')}-01`;
      prevEndStr = toDateStr(new Date(py, pm, 0, 12, 0, 0));

      periodLabel = `${MONTH_LABELS[(m || 1) - 1]} ${y}`;
      prevPeriodLabel = `${MONTH_LABELS[(pm || 1) - 1]} ${py}`;

      // Dividir el mes por días o bloques para el gráfico
      for (let d = 1; d <= lastDay; d++) {
        const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const ds = filterSalesByDateRange(segmentedSales, dStr, dStr);
        const st = computeStatsForSales(ds);
        chartPoints.push({
          label: String(d),
          subLabel: formatShortDate(dStr),
          revenue: st.revenue,
          profit: st.profit,
          orders: st.ordersCount,
          units: st.unitsSold,
        });
      }
    } else if (activeTab === 'anual') {
      startStr = `${selectedYear}-01-01`;
      endStr = `${selectedYear}-12-31`;
      prevStartStr = `${selectedYear - 1}-01-01`;
      prevEndStr = `${selectedYear - 1}-12-31`;
      periodLabel = `Año ${selectedYear}`;
      prevPeriodLabel = `Año ${selectedYear - 1}`;

      const shortMonths = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ];
      for (let m = 1; m <= 12; m++) {
        const prefix = `${selectedYear}-${String(m).padStart(2, '0')}`;
        const ms = segmentedSales.filter((s) => s.date.startsWith(prefix));
        const st = computeStatsForSales(ms);
        chartPoints.push({
          label: shortMonths[m - 1],
          subLabel: `${MONTH_LABELS[m - 1]} ${selectedYear}`,
          revenue: st.revenue,
          profit: st.profit,
          orders: st.ordersCount,
          units: st.unitsSold,
        });
      }
    } else {
      // Personalizado
      startStr = customStart <= customEnd ? customStart : customEnd;
      endStr = customEnd >= customStart ? customEnd : customStart;
      periodLabel = `Del ${formatShortDate(startStr)} al ${formatShortDate(endStr)}`;
      prevPeriodLabel = 'Período personalizado';

      // Agrupar por fecha con ventas en el rango
      const salesInRange = filterSalesByDateRange(segmentedSales, startStr, endStr);
      const uniqueDates = Array.from(new Set(salesInRange.map((s) => s.date))).sort();
      for (const dStr of uniqueDates) {
        const [, m, d] = dStr.split('-');
        const ds = salesInRange.filter((s) => s.date === dStr);
        const st = computeStatsForSales(ds);
        chartPoints.push({
          label: `${d}/${m}`,
          subLabel: formatShortDate(dStr),
          revenue: st.revenue,
          profit: st.profit,
          orders: st.ordersCount,
          units: st.unitsSold,
        });
      }
    }

    const periodSales = filterSalesByDateRange(segmentedSales, startStr, endStr);
    const prevSales =
      activeTab === 'personalizado'
        ? []
        : filterSalesByDateRange(segmentedSales, prevStartStr, prevEndStr);

    const currentStats = computeStatsForSales(periodSales);
    const prevStats = computeStatsForSales(prevSales);

    const revenueGrowth = calcGrowthPercentage(currentStats.revenue, prevStats.revenue);
    const profitGrowth = calcGrowthPercentage(currentStats.profit, prevStats.profit);

    const topProducts = getTopProducts(periodSales);

    return {
      periodLabel,
      prevPeriodLabel,
      periodSales,
      currentStats,
      prevStats,
      revenueGrowth,
      profitGrowth,
      topProducts,
      chartPoints,
    };
  }, [
    activeTab,
    selectedDay,
    selectedWeekRef,
    selectedMonth,
    selectedYear,
    customStart,
    customEnd,
    segmentedSales,
    todayStr,
  ]);

  return (
    <div className="space-y-6">
      {/* Encabezado y Botones de Exportación */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Reportes y Estadísticas Comerciales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Analizá facturación, costos y ganancia real por período y descargá reportes en Excel, CSV o PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportSalesToExcel(reportData.periodSales, reportData.periodLabel)
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={() =>
              exportSalesToCSV(reportData.periodSales, reportData.periodLabel)
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() =>
              exportSalesToPDF(reportData.periodSales, reportData.periodLabel)
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF0080] hover:bg-[#E60073] text-white text-xs font-bold shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Selector de Tipo de Reporte + Selector de Período */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex flex-wrap rounded-2xl bg-slate-100 p-1.5 gap-1">
            {(
              [
                { id: 'diario', label: 'Reporte Diario' },
                { id: 'semanal', label: 'Reporte Semanal' },
                { id: 'mensual', label: 'Reporte Mensual' },
                { id: 'anual', label: 'Reporte Anual' },
                { id: 'personalizado', label: 'Rango Personalizado' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-[#FF0080] to-[#FF3399] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Control de fecha según el tab */}
          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[#FF0080]" />
            {activeTab === 'diario' && (
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            )}

            {activeTab === 'semanal' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Día de la semana:
                </span>
                <input
                  type="date"
                  value={selectedWeekRef}
                  onChange={(e) => setSelectedWeekRef(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            )}

            {activeTab === 'mensual' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            )}

            {activeTab === 'anual' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                {[currentYearNum - 2, currentYearNum - 1, currentYearNum, currentYearNum + 1].map(
                  (y) => (
                    <option key={y} value={y}>
                      Año {y}
                    </option>
                  )
                )}
              </select>
            )}

            {activeTab === 'personalizado' && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <span className="text-xs text-slate-400">hasta</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>
            )}
          </div>
        </div>

        {/* Segmentación adicional */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
            >
              <option value="ALL">Categoría: Todas</option>
              {settings.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Producto: Todos</option>
            {products
              .filter((p) => !p.isAddon)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Pago: Todos</option>
            {settings.paymentMethods.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>

          <select
            value={saleChannelFilter}
            onChange={(e) => setSaleChannelFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Medio de venta: Todos</option>
            {settings.saleChannels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>

          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Estado pedido: Activos</option>
            {settings.orderStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de Indicadores del Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Facturación ({reportData.periodLabel})
            </span>
            {activeTab !== 'personalizado' && (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                  reportData.revenueGrowth.isPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {reportData.revenueGrowth.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {reportData.revenueGrowth.label}
              </span>
            )}
          </div>
          <div className="font-display text-3xl font-bold text-slate-900">
            {formatARS(reportData.currentStats.revenue)}
          </div>
          {activeTab !== 'personalizado' && (
            <div className="text-xs text-slate-400 mt-1.5">
              {reportData.prevPeriodLabel}: {formatARS(reportData.prevStats.revenue)}
            </div>
          )}
        </div>

        <div className="bg-emerald-50/70 rounded-3xl p-5 border border-emerald-200 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              Ganancia Real del Período
            </span>
            {activeTab !== 'personalizado' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-emerald-700">
                {reportData.profitGrowth.label}
              </span>
            )}
          </div>
          <div className="font-display text-3xl font-bold text-emerald-700">
            {formatARS(reportData.currentStats.profit)}
          </div>
          <div className="text-xs text-emerald-800/80 mt-1.5">
            Costo descontado: {formatARS(reportData.currentStats.cost)}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pedidos y Unidades
            </span>
            <ShoppingBag className="w-4 h-4 text-[#00A8E8]" />
          </div>
          <div className="font-display text-3xl font-bold text-slate-900">
            {reportData.currentStats.ordersCount}{' '}
            <span className="text-base font-medium text-slate-500">pedidos</span>
          </div>
          <div className="text-xs font-semibold text-sky-700 mt-1.5 flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {reportData.currentStats.unitsSold} unidades entregadas/vendidas
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ticket Promedio
            </span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-display text-3xl font-bold text-slate-900">
            {formatARS(reportData.currentStats.avgTicket)}
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            Saldo pendiente cobro: {formatARS(reportData.currentStats.pendingBalance)}
          </div>
        </div>
      </div>

      {/* Gráfico de Evolución del Período + Ranking de Productos del Período */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#FF0080]" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Evolución de Ventas — {reportData.periodLabel}
              </h2>
              <p className="text-xs text-slate-500">
                Desglose visual de facturación y ganancia neta en el período
              </p>
            </div>
          </div>

          <InteractiveSalesChart data={reportData.chartPoints} height={260} />
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">
            Productos Vendidos en el Período
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Ranking ordenado por unidades vendidas y rentabilidad aportada
          </p>

          {reportData.topProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No se registran productos vendidos en este período.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase">
                    <th className="py-2 pr-2">Producto</th>
                    <th className="py-2 px-2 text-center">Unid.</th>
                    <th className="py-2 px-2 text-right">Venta</th>
                    <th className="py-2 pl-2 text-right">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.topProducts.map((p, idx) => (
                    <tr key={p.productId || idx}>
                      <td className="py-2.5 pr-2 font-bold text-slate-800">
                        {idx + 1}. {p.productName}
                      </td>
                      <td className="py-2.5 px-2 text-center font-extrabold text-[#FF0080]">
                        {p.unitsSold} u.
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-700">
                        {formatARS(p.totalRevenue)}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-bold text-emerald-700">
                        {formatARS(p.totalProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
