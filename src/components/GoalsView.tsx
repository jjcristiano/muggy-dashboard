import React, { useMemo, useState } from 'react';
import {
  Check,
  Coins,
  Edit3,
  Flame,
  Package,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import {
  buildSalesChartData,
  filterValidSales,
  getDashboardComparisons,
} from '../utils/analytics';
import { formatARS, getTodayAR } from '../utils/formatters';
import { InteractiveSalesChart } from './InteractiveSalesChart';

export const GoalsView: React.FC = () => {
  const { visibleSales, goals, settings, updateGoals } = useMuggy();

  const [isEditing, setIsEditing] = useState(false);
  const [dailyRev, setDailyRev] = useState(goals.dailyRevenue);
  const [weeklyRev, setWeeklyRev] = useState(goals.weeklyRevenue);
  const [monthlyRev, setMonthlyRev] = useState(goals.monthlyRevenue);
  const [annualRev, setAnnualRev] = useState(goals.annualRevenue);
  const [monthlyProfit, setMonthlyProfit] = useState(goals.monthlyProfitGoal);
  const [monthlyUnits, setMonthlyUnits] = useState(goals.monthlyUnitsGoal);

  const todayStr = getTodayAR();

  const validSales = useMemo(
    () => filterValidSales(visibleSales, settings.includeCancelledInStats),
    [visibleSales, settings.includeCancelledInStats]
  );

  const comp = useMemo(
    () => getDashboardComparisons(validSales, todayStr),
    [validSales, todayStr]
  );

  const monthlyChartData = useMemo(
    () => buildSalesChartData(validSales, 'mensual', todayStr),
    [validSales, todayStr]
  );

  const openEditor = () => {
    setDailyRev(goals.dailyRevenue);
    setWeeklyRev(goals.weeklyRevenue);
    setMonthlyRev(goals.monthlyRevenue);
    setAnnualRev(goals.annualRevenue);
    setMonthlyProfit(goals.monthlyProfitGoal);
    setMonthlyUnits(goals.monthlyUnitsGoal);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoals({
      dailyRevenue: Number(dailyRev) || 0,
      weeklyRevenue: Number(weeklyRev) || 0,
      monthlyRevenue: Number(monthlyRev) || 0,
      annualRevenue: Number(annualRev) || 0,
      monthlyProfitGoal: Number(monthlyProfit) || 0,
      monthlyUnitsGoal: Number(monthlyUnits) || 0,
    });
    setIsEditing(false);
  };

  const goalCards = [
    {
      id: 'daily',
      title: 'Objetivo Diario de Facturación',
      subtitle: 'Meta para las ventas de hoy',
      target: goals.dailyRevenue,
      achieved: comp.today.current.revenue,
      profitAchieved: comp.today.current.profit,
      colorFrom: 'from-[#FF0080]',
      colorTo: 'to-[#FF66B2]',
      badgeBg: 'bg-pink-50 text-[#FF0080]',
    },
    {
      id: 'weekly',
      title: 'Objetivo Semanal de Facturación',
      subtitle: 'Meta de lunes a domingo actual',
      target: goals.weeklyRevenue,
      achieved: comp.week.current.revenue,
      profitAchieved: comp.week.current.profit,
      colorFrom: 'from-[#00A8E8]',
      colorTo: 'to-[#38D6FF]',
      badgeBg: 'bg-sky-50 text-sky-700',
    },
    {
      id: 'monthly',
      title: 'Objetivo Mensual de Facturación',
      subtitle: 'Meta del mes en curso',
      target: goals.monthlyRevenue,
      achieved: comp.month.current.revenue,
      profitAchieved: comp.month.current.profit,
      colorFrom: 'from-amber-500',
      colorTo: 'to-yellow-400',
      badgeBg: 'bg-amber-50 text-amber-800',
    },
    {
      id: 'annual',
      title: 'Objetivo Anual de Facturación',
      subtitle: `Meta acumulada del año ${todayStr.slice(0, 4)}`,
      target: goals.annualRevenue,
      achieved: comp.year.current.revenue,
      profitAchieved: comp.year.current.profit,
      colorFrom: 'from-purple-600',
      colorTo: 'to-pink-500',
      badgeBg: 'bg-purple-50 text-purple-800',
    },
  ];

  const profitPct =
    goals.monthlyProfitGoal > 0
      ? Math.min(100, Math.round((comp.month.current.profit / goals.monthlyProfitGoal) * 100))
      : 0;
  const unitsPct =
    goals.monthlyUnitsGoal > 0
      ? Math.min(100, Math.round((comp.month.current.unitsSold / goals.monthlyUnitsGoal) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-1">
            <Target className="w-3.5 h-3.5" />
            Metas y Crecimiento Muggy
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Objetivos y Evolución del Negocio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Seguimiento en tiempo real de tus metas diarias, semanales, mensuales y anuales con barras de progreso.
          </p>
        </div>

        <button
          type="button"
          onClick={openEditor}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shrink-0"
        >
          <Edit3 className="w-4 h-4 text-pink-400" />
          Configurar Metas en ARS
        </button>
      </div>

      {/* Formulario desplegable de edición de metas */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-gradient-to-r from-[#FFF6EC] to-[#FFEBF5] rounded-3xl p-6 border border-pink-200 shadow-muggy space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF0080]" />
              Actualizar Objetivos Comerciales de Muggy
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Objetivo Diario Venta (ARS)
              </label>
              <input
                type="number"
                min={0}
                value={dailyRev}
                onChange={(e) => setDailyRev(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Objetivo Semanal Venta (ARS)
              </label>
              <input
                type="number"
                min={0}
                value={weeklyRev}
                onChange={(e) => setWeeklyRev(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Objetivo Mensual Venta (ARS)
              </label>
              <input
                type="number"
                min={0}
                value={monthlyRev}
                onChange={(e) => setMonthlyRev(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Objetivo Anual Venta (ARS)
              </label>
              <input
                type="number"
                min={0}
                value={annualRev}
                onChange={(e) => setAnnualRev(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-emerald-800 mb-1">
                Meta de Ganancia Neta Mensual (ARS)
              </label>
              <input
                type="number"
                min={0}
                value={monthlyProfit}
                onChange={(e) => setMonthlyProfit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white font-bold text-sm text-emerald-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-sky-800 mb-1">
                Meta de Unidades Vendidas al Mes
              </label>
              <input
                type="number"
                min={1}
                value={monthlyUnits}
                onChange={(e) => setMonthlyUnits(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-300 bg-white font-bold text-sm text-sky-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF0080] text-white text-xs font-bold shadow-muggy"
            >
              <Check className="w-4 h-4" />
              Guardar Objetivos
            </button>
          </div>
        </form>
      )}

      {/* Tarjetas Principales de Objetivos de Facturación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goalCards.map((card) => {
          const rawPct =
            card.target > 0 ? Math.round((card.achieved / card.target) * 100) : 0;
          const barPct = Math.min(100, Math.max(0, rawPct));
          const remaining = Math.max(0, card.target - card.achieved);
          const isCompleted = card.achieved >= card.target && card.target > 0;

          return (
            <div
              key={card.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${card.badgeBg}`}
                  >
                    {card.subtitle}
                  </span>
                  <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                    {card.title}
                  </h2>
                </div>

                <div className="text-right">
                  <span
                    className={`font-display text-2xl font-bold ${
                      isCompleted ? 'text-emerald-600' : 'text-[#FF0080]'
                    }`}
                  >
                    {rawPct}%
                  </span>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Cumplimiento
                  </span>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  style={{ width: `${barPct}%` }}
                  className={`h-full rounded-full bg-gradient-to-r ${card.colorFrom} ${card.colorTo} transition-all duration-500`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Objetivo Establecido
                  </span>
                  <span className="font-display font-bold text-sm sm:text-base text-slate-800">
                    {formatARS(card.target)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-pink-50/50">
                  <span className="text-[10px] font-bold uppercase text-[#FF0080] block">
                    Alcanzado
                  </span>
                  <span className="font-display font-bold text-sm sm:text-base text-slate-900">
                    {formatARS(card.achieved)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">
                    {isCompleted ? '¡Superado por!' : 'Falta para la meta'}
                  </span>
                  <span className="font-display font-bold text-sm sm:text-base text-amber-900">
                    {isCompleted
                      ? `+${formatARS(card.achieved - card.target)}`
                      : formatARS(remaining)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Ganancia real acumulada en este período:{' '}
                  <strong className="text-emerald-700">
                    {formatARS(card.profitAchieved)}
                  </strong>
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <Trophy className="w-4 h-4" /> ¡Objetivo logrado!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Metas Complementarias: Ganancia Neta Mensual y Unidades Vendidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase">
              <Coins className="w-4 h-4" />
              Meta de Ganancia Neta (Bolsillo) del Mes
            </div>
            <span className="font-display text-2xl font-bold text-emerald-300">
              {profitPct}%
            </span>
          </div>

          <div className="font-display text-2xl font-bold">
            {formatARS(comp.month.current.profit)}{' '}
            <span className="text-sm font-normal text-emerald-200/80">
              de {formatARS(goals.monthlyProfitGoal)} objetivo
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              style={{ width: `${profitPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
            />
          </div>

          <p className="text-xs text-emerald-200/80">
            {comp.month.current.profit >= goals.monthlyProfitGoal
              ? '¡Superaste tu meta de ganancia neta mensual!'
              : `Te faltan ${formatARS(
                  goals.monthlyProfitGoal - comp.month.current.profit
                )} de ganancia limpia este mes.`}
          </p>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase">
              <Package className="w-4 h-4" />
              Meta de Unidades Personalizadas del Mes
            </div>
            <span className="font-display text-2xl font-bold text-sky-300">
              {unitsPct}%
            </span>
          </div>

          <div className="font-display text-2xl font-bold">
            {comp.month.current.unitsSold} unidades{' '}
            <span className="text-sm font-normal text-slate-300">
              de {goals.monthlyUnitsGoal} u. objetivo
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              style={{ width: `${unitsPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#00C2FF] to-[#FF0080]"
            />
          </div>

          <p className="text-xs text-slate-300">
            {comp.month.current.unitsSold >= goals.monthlyUnitsGoal
              ? '¡Excelente ritmo de producción superando la meta mensual!'
              : `Faltan vender ${
                  goals.monthlyUnitsGoal - comp.month.current.unitsSold
                } unidades para alcanzar el objetivo de producción mensual.`}
          </p>
        </div>
      </div>

      {/* Gráfico de Evolución Mensual del Negocio */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-[#FF0080]" />
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Evolución Anual Mes a Mes ({todayStr.slice(0, 4)})
            </h2>
            <p className="text-xs text-slate-500">
              Visualización del crecimiento mensual de Muggy en facturación y ganancia
            </p>
          </div>
        </div>
        <InteractiveSalesChart data={monthlyChartData} height={240} />
      </div>
    </div>
  );
};
