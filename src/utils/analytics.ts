import { Sale } from '../types';
import {
  addDaysStr,
  calcGrowthPercentage,
  getStartOfWeekStr,
  parseDateStr,
  toDateStr,
} from './formatters';

export interface PeriodStats {
  revenue: number;
  productCost: number; // Costo de compra de productos + adicionales (sin packaging)
  packagingCost: number; // Costo total de packaging en las ventas que lo incluyeron
  otherCosts: number; // Otros gastos registrados
  cost: number; // Costo total = productCost + packagingCost + otherCosts
  grossProfit: number; // Ganancia bruta = revenue - productCost - packagingCost
  profit: number; // Ganancia neta estimada = revenue - cost
  ordersCount: number;
  unitsSold: number;
  avgTicket: number;
  pendingBalance: number;
  // Porcentajes sobre la facturación total (Sección Resumen de Rentabilidad):
  productCostPct: number;
  packagingCostPct: number;
  otherCostsPct: number;
  profitPct: number;
}

export function computeStatsForSales(sales: Sale[]): PeriodStats {
  let revenue = 0;
  let productCost = 0;
  let packagingCost = 0;
  let otherCosts = 0;
  let unitsSold = 0;
  let pendingBalance = 0;

  for (const s of sales) {
    const rev = Number(s.totalRevenue) || 0;
    revenue += rev;
    unitsSold += Number(s.quantity) || 0;
    pendingBalance += Number(s.pendingBalance) || 0;

    // Respetar el snapshot histórico guardado en la venta (o calcular si es registro anterior)
    const addonsCost = (s.addons || []).reduce(
      (acc, a) => acc + (Number(a.quantity) || 0) * (Number(a.unitCost) || 0),
      0
    );
    const saleProdCost =
      s.totalProductCost !== undefined
        ? s.totalProductCost
        : (Number(s.quantity) || 0) * (Number(s.unitCost) || 0) + addonsCost;

    const salePkgCost =
      s.totalPackagingCost !== undefined
        ? s.totalPackagingCost
        : (Number(s.quantity) || 0) * (Number(s.unitPackagingCost) || 0);

    const saleOtherCost = Number(s.otherCosts) || 0;

    productCost += saleProdCost;
    packagingCost += salePkgCost;
    otherCosts += saleOtherCost;
  }

  const cost = productCost + packagingCost + otherCosts;
  const grossProfit = revenue - productCost - packagingCost;
  const profit = revenue - cost; // Ganancia neta estimada
  const ordersCount = sales.length;
  const avgTicket = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

  const round1 = (val: number) => Math.round(val * 10) / 10;

  const productCostPct = revenue > 0 ? round1((productCost / revenue) * 100) : 0;
  const packagingCostPct = revenue > 0 ? round1((packagingCost / revenue) * 100) : 0;
  const otherCostsPct = revenue > 0 ? round1((otherCosts / revenue) * 100) : 0;
  const profitPct = revenue > 0 ? round1((profit / revenue) * 100) : 0;

  return {
    revenue,
    productCost,
    packagingCost,
    otherCosts,
    cost,
    grossProfit,
    profit,
    ordersCount,
    unitsSold,
    avgTicket,
    pendingBalance,
    productCostPct,
    packagingCostPct,
    otherCostsPct,
    profitPct,
  };
}

/**
 * Filtra las ventas válidas para estadísticas (excluyendo Cancelados salvo configuración)
 */
export function filterValidSales(sales: Sale[], includeCancelled = false): Sale[] {
  if (includeCancelled) return sales;
  return sales.filter((s) => s.orderStatus !== 'Cancelado');
}

/**
 * Filtra ventas en un rango de fechas inclusivo [startDateStr, endDateStr]
 */
export function filterSalesByDateRange(
  sales: Sale[],
  startDateStr: string,
  endDateStr: string
): Sale[] {
  return sales.filter((s) => s.date >= startDateStr && s.date <= endDateStr);
}

/**
 * Obtiene rangos actual y anterior para Hoy, Semana, Mes y Año respecto a `todayStr`
 */
export function getDashboardComparisons(sales: Sale[], todayStr: string) {
  const todayDate = parseDateStr(todayStr);
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth() + 1;

  // 1. HOY vs AYER
  const yesterdayStr = addDaysStr(todayStr, -1);
  const todaySales = filterSalesByDateRange(sales, todayStr, todayStr);
  const yesterdaySales = filterSalesByDateRange(sales, yesterdayStr, yesterdayStr);

  // 2. ESTA SEMANA vs SEMANA ANTERIOR
  const startOfThisWeek = getStartOfWeekStr(todayStr);
  const endOfThisWeek = addDaysStr(startOfThisWeek, 6);
  const startOfPrevWeek = addDaysStr(startOfThisWeek, -7);
  const endOfPrevWeek = addDaysStr(startOfThisWeek, -1);

  const thisWeekSales = filterSalesByDateRange(sales, startOfThisWeek, endOfThisWeek);
  const prevWeekSales = filterSalesByDateRange(sales, startOfPrevWeek, endOfPrevWeek);

  // 3. ESTE MES vs MES ANTERIOR
  const startOfThisMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayThisMonth = toDateStr(new Date(year, month, 0, 12, 0, 0));

  const prevMonthDate = new Date(year, month - 2, 1, 12, 0, 0);
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth() + 1;
  const startOfPrevMonth = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}-01`;
  const endOfPrevMonth = toDateStr(new Date(prevMonthYear, prevMonthNum, 0, 12, 0, 0));

  const thisMonthSales = filterSalesByDateRange(sales, startOfThisMonth, lastDayThisMonth);
  const prevMonthSales = filterSalesByDateRange(sales, startOfPrevMonth, endOfPrevMonth);

  // 4. ESTE AÑO vs AÑO ANTERIOR
  const startOfThisYear = `${year}-01-01`;
  const endOfThisYear = `${year}-12-31`;
  const startOfPrevYear = `${year - 1}-01-01`;
  const endOfPrevYear = `${year - 1}-12-31`;

  const thisYearSales = filterSalesByDateRange(sales, startOfThisYear, endOfThisYear);
  const prevYearSales = filterSalesByDateRange(sales, startOfPrevYear, endOfPrevYear);

  const todayStats = computeStatsForSales(todaySales);
  const yesterdayStats = computeStatsForSales(yesterdaySales);

  const weekStats = computeStatsForSales(thisWeekSales);
  const prevWeekStats = computeStatsForSales(prevWeekSales);

  const monthStats = computeStatsForSales(thisMonthSales);
  const prevMonthStats = computeStatsForSales(prevMonthSales);

  const yearStats = computeStatsForSales(thisYearSales);
  const prevYearStats = computeStatsForSales(prevYearSales);

  return {
    today: {
      current: todayStats,
      previous: yesterdayStats,
      revenueGrowth: calcGrowthPercentage(todayStats.revenue, yesterdayStats.revenue),
      profitGrowth: calcGrowthPercentage(todayStats.profit, yesterdayStats.profit),
      ordersGrowth: calcGrowthPercentage(todayStats.ordersCount, yesterdayStats.ordersCount),
    },
    week: {
      current: weekStats,
      previous: prevWeekStats,
      revenueGrowth: calcGrowthPercentage(weekStats.revenue, prevWeekStats.revenue),
      profitGrowth: calcGrowthPercentage(weekStats.profit, prevWeekStats.profit),
      ordersGrowth: calcGrowthPercentage(weekStats.ordersCount, prevWeekStats.ordersCount),
      unitsGrowth: calcGrowthPercentage(weekStats.unitsSold, prevWeekStats.unitsSold),
    },
    month: {
      current: monthStats,
      previous: prevMonthStats,
      revenueGrowth: calcGrowthPercentage(monthStats.revenue, prevMonthStats.revenue),
      profitGrowth: calcGrowthPercentage(monthStats.profit, prevMonthStats.profit),
      ordersGrowth: calcGrowthPercentage(monthStats.ordersCount, prevMonthStats.ordersCount),
      unitsGrowth: calcGrowthPercentage(monthStats.unitsSold, prevMonthStats.unitsSold),
      ticketGrowth: calcGrowthPercentage(monthStats.avgTicket, prevMonthStats.avgTicket),
    },
    year: {
      current: yearStats,
      previous: prevYearStats,
      revenueGrowth: calcGrowthPercentage(yearStats.revenue, prevYearStats.revenue),
      profitGrowth: calcGrowthPercentage(yearStats.profit, prevYearStats.profit),
      ordersGrowth: calcGrowthPercentage(yearStats.ordersCount, prevYearStats.ordersCount),
      unitsGrowth: calcGrowthPercentage(yearStats.unitsSold, prevYearStats.unitsSold),
    },
  };
}

export interface ProductRankingItem {
  productId: string;
  productName: string;
  category: string;
  unitsSold: number;
  ordersCount: number;
  totalRevenue: number;
  totalProfit: number;
}

export function getTopProducts(sales: Sale[]): ProductRankingItem[] {
  const map = new Map<string, ProductRankingItem>();

  for (const s of sales) {
    const key = s.productId || s.productName;
    const existing = map.get(key);
    const saleProfit = s.netProfit !== undefined ? s.netProfit : s.grossProfit;
    if (existing) {
      existing.unitsSold += s.quantity;
      existing.ordersCount += 1;
      existing.totalRevenue += s.totalRevenue;
      existing.totalProfit += saleProfit;
    } else {
      map.set(key, {
        productId: s.productId,
        productName: s.productName,
        category: s.category,
        unitsSold: s.quantity,
        ordersCount: 1,
        totalRevenue: s.totalRevenue,
        totalProfit: saleProfit,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
    return b.totalRevenue - a.totalRevenue;
  });
}

const MONTH_NAMES_SHORT = [
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

const MONTH_NAMES_FULL = [
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

export interface ChartDataPoint {
  label: string;
  subLabel?: string;
  revenue: number;
  profit: number;
  orders: number;
  units: number;
}

/**
 * Genera puntos de gráfico interactivo según filtro: 'diario' | 'semanal' | 'mensual' | 'anual'
 */
export function buildSalesChartData(
  sales: Sale[],
  mode: 'diario' | 'semanal' | 'mensual' | 'anual',
  todayStr: string
): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];

  if (mode === 'diario') {
    for (let i = 13; i >= 0; i--) {
      const dStr = addDaysStr(todayStr, -i);
      const [, m, d] = dStr.split('-');
      const daySales = sales.filter((s) => s.date === dStr);
      const stats = computeStatsForSales(daySales);
      points.push({
        label: `${d}/${m}`,
        subLabel: dStr,
        revenue: stats.revenue,
        profit: stats.profit,
        orders: stats.ordersCount,
        units: stats.unitsSold,
      });
    }
    return points;
  }

  if (mode === 'semanal') {
    const currentWeekStart = getStartOfWeekStr(todayStr);
    for (let i = 7; i >= 0; i--) {
      const wStart = addDaysStr(currentWeekStart, -i * 7);
      const wEnd = addDaysStr(wStart, 6);
      const [, m1, d1] = wStart.split('-');
      const [, m2, d2] = wEnd.split('-');
      const weekSales = filterSalesByDateRange(sales, wStart, wEnd);
      const stats = computeStatsForSales(weekSales);
      points.push({
        label: `${d1}/${m1}`,
        subLabel: `Sem. ${d1}/${m1} al ${d2}/${m2}`,
        revenue: stats.revenue,
        profit: stats.profit,
        orders: stats.ordersCount,
        units: stats.unitsSold,
      });
    }
    return points;
  }

  if (mode === 'mensual') {
    const year = Number(todayStr.split('-')[0]);
    for (let m = 1; m <= 12; m++) {
      const prefix = `${year}-${String(m).padStart(2, '0')}`;
      const monthSales = sales.filter((s) => s.date.startsWith(prefix));
      const stats = computeStatsForSales(monthSales);
      points.push({
        label: MONTH_NAMES_SHORT[m - 1],
        subLabel: `${MONTH_NAMES_FULL[m - 1]} ${year}`,
        revenue: stats.revenue,
        profit: stats.profit,
        orders: stats.ordersCount,
        units: stats.unitsSold,
      });
    }
    return points;
  }

  const currentYear = Number(todayStr.split('-')[0]);
  for (let y = currentYear - 3; y <= currentYear; y++) {
    const prefix = `${y}-`;
    const yearSales = sales.filter((s) => s.date.startsWith(prefix));
    const stats = computeStatsForSales(yearSales);
    points.push({
      label: String(y),
      subLabel: `Año ${y}`,
      revenue: stats.revenue,
      profit: stats.profit,
      orders: stats.ordersCount,
      units: stats.unitsSold,
    });
  }
  return points;
}

/**
 * Calcula el Resumen Comercial Histórico / General
 */
export function getCommercialSummary(sales: Sale[]) {
  const topProducts = getTopProducts(sales);
  const bestProduct = topProducts[0] || null;

  const dayMap = new Map<string, number>();
  const monthMap = new Map<string, number>();

  let totalUnits = 0;
  let totalProfit = 0;
  let totalRevenue = 0;

  for (const s of sales) {
    totalUnits += s.quantity;
    totalProfit += s.netProfit !== undefined ? s.netProfit : s.grossProfit;
    totalRevenue += s.totalRevenue;

    dayMap.set(s.date, (dayMap.get(s.date) || 0) + s.totalRevenue);
    const ym = s.date.slice(0, 7);
    monthMap.set(ym, (monthMap.get(ym) || 0) + s.totalRevenue);
  }

  let bestDay: { date: string; revenue: number } | null = null;
  for (const [date, rev] of dayMap.entries()) {
    if (!bestDay || rev > bestDay.revenue) {
      bestDay = { date, revenue: rev };
    }
  }

  let bestMonth: { yearMonth: string; label: string; revenue: number } | null = null;
  for (const [ym, rev] of monthMap.entries()) {
    if (!bestMonth || rev > bestMonth.revenue) {
      const [y, m] = ym.split('-').map(Number);
      bestMonth = {
        yearMonth: ym,
        label: `${MONTH_NAMES_FULL[(m || 1) - 1]} ${y}`,
        revenue: rev,
      };
    }
  }

  return {
    bestProduct,
    bestDay,
    bestMonth,
    totalUnits,
    totalProfit,
    totalRevenue,
  };
}
