import React, { useMemo, useState } from 'react';
import {
  BellRing,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Gift,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import { EphemerisCategory, EphemerisRule, ResolvedEphemeris } from '../types';
import { resolveEphemerides } from '../utils/ephemerides';
import {
  addDaysStr,
  formatLongDate,
  formatShortDate,
  getStartOfWeekStr,
  getTodayAR,
  parseDateStr,
} from '../utils/formatters';

const MONTH_NAMES = [
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

const WEEKDAYS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const CATEGORY_COLORS: Record<EphemerisCategory, string> = {
  'Comercial Clave': 'bg-pink-100 text-[#FF0080] border-pink-300',
  'Feriado / Nacional': 'bg-sky-100 text-sky-800 border-sky-200',
  'Profesiones y Oficios': 'bg-amber-100 text-amber-800 border-amber-200',
  'Especial / Estacional': 'bg-purple-100 text-purple-800 border-purple-200',
  Personalizada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const CalendarView: React.FC = () => {
  const { ephemerides, addEphemeris, updateEphemeris, deleteEphemeris } = useMuggy();

  const todayStr = getTodayAR();
  const initialDate = parseDateStr(todayStr);

  const [viewMode, setViewMode] = useState<'mensual' | 'semanal' | 'proximas'>('mensual');
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() + 1); // 1-12
  const [weekRefDate, setWeekRefDate] = useState(todayStr);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [onlyCommercial, setOnlyCommercial] = useState(false);

  // Detalle o edición de efeméride seleccionada
  const [selectedEf, setSelectedEf] = useState<ResolvedEphemeris | null>(null);

  // Modal de agregar / editar efeméride
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EphemerisRule | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] =
    useState<EphemerisCategory>('Comercial Clave');
  const [formDateStr, setFormDateStr] = useState(todayStr);
  const [formDescription, setFormDescription] = useState('');
  const [formAnticipation, setFormAnticipation] = useState(25);
  const [formIsOpportunity, setFormIsOpportunity] = useState(true);
  const [formSuggestions, setFormSuggestions] = useState('');

  // Resolver todas las efemérides para el año visualizado
  const resolvedAll = useMemo(
    () => resolveEphemerides(ephemerides, viewYear, todayStr),
    [ephemerides, viewYear, todayStr]
  );

  const filteredEphemerides = useMemo(() => {
    return resolvedAll.filter((ef) => {
      if (categoryFilter !== 'ALL' && ef.category !== categoryFilter) return false;
      if (onlyCommercial && !ef.isCommercialOpportunity) return false;
      return true;
    });
  }, [resolvedAll, categoryFilter, onlyCommercial]);

  // Próximas efemérides ordenadas por cercanía desde hoy
  const upcomingList = useMemo(() => {
    return [...filteredEphemerides].sort((a, b) => a.daysUntil - b.daysUntil);
  }, [filteredEphemerides]);

  // Alertas activas (aquellas cuya anticipación recomendada ya empezó o faltan <= 35 días)
  const activeAlerts = useMemo(() => {
    return resolvedAll
      .filter(
        (ef) =>
          ef.isCommercialOpportunity &&
          ef.daysUntil >= 0 &&
          ef.daysUntil <= Math.max(ef.anticipationDays, 30)
      )
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [resolvedAll]);

  // Navegación mensual
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Construcción de celdas de calendario mensual (Lunes a Domingo)
  const monthGridCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1, 12, 0, 0);
    const totalDaysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo

    const cells: Array<{
      dateStr: string | null;
      dayNum: number | null;
      events: ResolvedEphemeris[];
    }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ dateStr: null, dayNum: null, events: [] });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      const evs = filteredEphemerides.filter((e) => e.resolvedDate === dStr);
      cells.push({ dateStr: dStr, dayNum: d, events: evs });
    }

    return cells;
  }, [viewYear, viewMonth, filteredEphemerides]);

  // Construcción de los 7 días de la vista semanal
  const weekDaysCells = useMemo(() => {
    const startW = getStartOfWeekStr(weekRefDate);
    return Array.from({ length: 7 }, (_, idx) => {
      const dStr = addDaysStr(startW, idx);
      const yr = Number(dStr.split('-')[0]);
      const evsForYear = resolveEphemerides(ephemerides, yr, todayStr).filter((ef) => {
        if (categoryFilter !== 'ALL' && ef.category !== categoryFilter) return false;
        if (onlyCommercial && !ef.isCommercialOpportunity) return false;
        return ef.resolvedDate === dStr;
      });
      return {
        weekdayName: WEEKDAYS_HEADER[idx],
        dateStr: dStr,
        events: evsForYear,
      };
    });
  }, [weekRefDate, ephemerides, todayStr, categoryFilter, onlyCommercial]);

  const openCreateModal = () => {
    setEditingRule(null);
    setFormName('');
    setFormCategory('Personalizada');
    setFormDateStr(todayStr);
    setFormDescription('');
    setFormAnticipation(25);
    setFormIsOpportunity(true);
    setFormSuggestions('Tazas personalizadas, Mates personalizados, Adicional golosinas');
    setIsModalOpen(true);
  };

  const openEditModal = (ef: ResolvedEphemeris) => {
    setEditingRule(ef);
    setFormName(ef.name);
    setFormCategory(ef.category);
    setFormDateStr(ef.resolvedDate);
    setFormDescription(ef.description);
    setFormAnticipation(ef.anticipationDays);
    setFormIsOpportunity(ef.isCommercialOpportunity);
    setFormSuggestions(ef.suggestions.join(', '));
    setIsModalOpen(true);
  };

  const handleSaveEphemeris = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const suggestions = formSuggestions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const [, m, d] = formDateStr.split('-').map(Number);

    if (editingRule) {
      const updatedFields: Partial<EphemerisRule> = {
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        anticipationDays: Number(formAnticipation) || 20,
        isCommercialOpportunity: formIsOpportunity,
        suggestions,
      };
      // Si es fija o personalizada, actualizar mes y día si cambió la fecha
      if (editingRule.ruleType === 'fixed' || editingRule.ruleType === 'custom_date') {
        updatedFields.ruleType = 'fixed';
        updatedFields.month = m;
        updatedFields.day = d;
      }
      updateEphemeris(editingRule.id, updatedFields);
      setSelectedEf(null);
    } else {
      addEphemeris({
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        anticipationDays: Number(formAnticipation) || 20,
        isCommercialOpportunity: formIsOpportunity,
        suggestions,
        ruleType: 'fixed',
        month: m,
        day: d,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-50 text-[#FF0080] text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Planificador Comercial Argentino
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Calendario de Efemérides y Oportunidades Muggy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fechas móviles argentinas auto-calculadas por año (Día del Padre, Madre, Niño, Pascuas), alertas de anticipación y qué promocionar.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#FF3399] hover:from-[#E60073] hover:to-[#FF0080] text-white font-bold text-sm shadow-muggy transition-all shrink-0"
        >
          <Plus className="w-5 h-5" />
          Agregar Fecha Personalizada
        </button>
      </div>

      {/* Panel de Alertas Comerciales Activas */}
      {activeAlerts.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-[#FFF5F9] via-[#FFFDF2] to-[#F0FAFF] border border-pink-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#FF0080] mb-3">
            <BellRing className="w-4 h-4 animate-bounce" />
            Alertas Comerciales Activas — ¡Momento de preparar campañas!
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {activeAlerts.map((al) => (
              <div
                key={al.id}
                onClick={() => setSelectedEf(al)}
                className="bg-white rounded-2xl p-4 border border-pink-200/70 shadow-sm hover:shadow-muggy cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FF0080] text-white">
                      {al.daysUntil === 0
                        ? '¡Es Hoy!'
                        : `Faltan ${al.daysUntil} días`}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {formatShortDate(al.nextOccurrenceDate)}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-slate-900 text-base mt-1">
                    {al.name}
                  </h3>
                  <p className="text-xs text-amber-800 font-semibold mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    {al.daysUntil <= 7
                      ? '¡Faltan pocos días para esta fecha comercial importante!'
                      : `Es momento de comenzar a preparar publicaciones (Anticipación sugerida: ${al.anticipationDays} días)`}
                  </p>
                </div>

                {al.suggestions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Ideas de productos recomendados:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {al.suggestions.slice(0, 3).map((sug, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-pink-50 text-pink-800 text-[11px] font-semibold"
                        >
                          {sug}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Controles de Vista y Filtros */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setViewMode('mensual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'mensual'
                ? 'bg-[#FF0080] text-white shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Vista Mensual
          </button>
          <button
            type="button"
            onClick={() => setViewMode('semanal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'semanal'
                ? 'bg-[#FF0080] text-white shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Vista Semanal
          </button>
          <button
            type="button"
            onClick={() => setViewMode('proximas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'proximas'
                ? 'bg-[#FF0080] text-white shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Próximas Efemérides ({upcomingList.length})
          </button>
        </div>

        {/* Navegador de Mes / Año o Semana */}
        {viewMode === 'mensual' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-display text-lg font-bold text-slate-900 min-w-[160px] text-center">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {viewMode === 'semanal' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekRefDate(addDaysStr(weekRefDate, -7))}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={weekRefDate}
              onChange={(e) => setWeekRefDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
            <button
              type="button"
              onClick={() => setWeekRefDate(addDaysStr(weekRefDate, 7))}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filtros por categoría y oportunidad comercial */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            <option value="ALL">Todas las categorías</option>
            <option value="Comercial Clave">Comercial Clave</option>
            <option value="Profesiones y Oficios">Profesiones y Oficios</option>
            <option value="Especial / Estacional">Especial / Estacional</option>
            <option value="Feriado / Nacional">Feriado / Nacional</option>
            <option value="Personalizada">Personalizada</option>
          </select>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-pink-700 bg-pink-50 px-3 py-2 rounded-xl border border-pink-200 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCommercial}
              onChange={(e) => setOnlyCommercial(e.target.checked)}
              className="rounded text-[#FF0080]"
            />
            Solo oportunidades de venta
          </label>
        </div>
      </div>

      {/* Contenido Principal + Panel Lateral de Oportunidad Comercial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          {/* VISTA MENSUAL */}
          {viewMode === 'mensual' && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-card">
              <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                {WEEKDAYS_HEADER.map((wd) => (
                  <div
                    key={wd}
                    className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {monthGridCells.map((cell, idx) => {
                  if (!cell.dateStr) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[88px] sm:min-h-[108px] rounded-2xl bg-slate-50/50 border border-transparent"
                      />
                    );
                  }

                  const isToday = cell.dateStr === todayStr;
                  const hasOpportunity = cell.events.some(
                    (e) => e.isCommercialOpportunity
                  );

                  return (
                    <div
                      key={cell.dateStr}
                      className={`min-h-[88px] sm:min-h-[108px] rounded-2xl p-2 border transition-all flex flex-col justify-between ${
                        isToday
                          ? 'bg-pink-50/70 border-[#FF0080] ring-2 ring-pink-200'
                          : hasOpportunity
                          ? 'bg-[#FFFDF9] border-amber-200/90 hover:border-pink-300'
                          : 'bg-white border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isToday
                              ? 'bg-[#FF0080] text-white'
                              : 'text-slate-700'
                          }`}
                        >
                          {cell.dayNum}
                        </span>
                        {hasOpportunity && (
                          <Gift className="w-3.5 h-3.5 text-[#FF0080]" />
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        {cell.events.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setSelectedEf(ev)}
                            className={`w-full text-left px-1.5 py-1 rounded-lg text-[10px] font-bold leading-tight border truncate transition-transform hover:scale-[1.02] ${
                              CATEGORY_COLORS[ev.category] ||
                              'bg-slate-100 text-slate-700'
                            }`}
                            title={ev.name}
                          >
                            {ev.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISTA SEMANAL */}
          {viewMode === 'semanal' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-3">
              {weekDaysCells.map((dayCell) => {
                const isToday = dayCell.dateStr === todayStr;
                return (
                  <div
                    key={dayCell.dateStr}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isToday
                        ? 'bg-pink-50/60 border-[#FF0080]'
                        : 'bg-slate-50/60 border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {dayCell.weekdayName}
                        </span>
                        <span className="font-display font-bold text-sm text-slate-900">
                          {dayCell.dateStr.split('-')[2]}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          {formatLongDate(dayCell.dateStr)}
                        </div>
                        <span className="text-xs text-slate-500">
                          {dayCell.events.length === 0
                            ? 'Sin efemérides registradas este día'
                            : `${dayCell.events.length} efeméride(s)`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {dayCell.events.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEf(ev)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                            CATEGORY_COLORS[ev.category]
                          }`}
                        >
                          {ev.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA PRÓXIMAS EFEMÉRIDES (LISTADO ANUAL COMPLETO) */}
          {viewMode === 'proximas' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card space-y-3">
              {upcomingList.map((ef) => (
                <div
                  key={ef.id}
                  onClick={() => setSelectedEf(ef)}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-pink-300 hover:bg-pink-50/20 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          CATEGORY_COLORS[ef.category]
                        }`}
                      >
                        {ef.category}
                      </span>
                      {ef.isCommercialOpportunity && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          ★ Oportunidad Comercial
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500">
                        Próxima fecha: {formatShortDate(ef.nextOccurrenceDate)}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-slate-900">
                      {ef.name}
                    </h3>
                    <p className="text-xs text-slate-600">{ef.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold">
                      {ef.daysUntil === 0
                        ? '¡HOY!'
                        : `En ${ef.daysUntil} días`}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Promocionar {ef.anticipationDays} días antes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Derecho: Detalle de Oportunidad Comercial y Sugerencias de Productos */}
        <div className="lg:col-span-4 space-y-4">
          {selectedEf ? (
            <div className="bg-white rounded-3xl p-6 border-2 border-[#FF0080]/30 shadow-muggy space-y-4 sticky top-6">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    CATEGORY_COLORS[selectedEf.category]
                  }`}
                >
                  {selectedEf.category}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEf(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  {selectedEf.name}
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-[#FF0080] mt-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatLongDate(selectedEf.resolvedDate)}</span>
                  <span>•</span>
                  <span>
                    {selectedEf.daysUntil === 0
                      ? '¡Es hoy!'
                      : `Faltan ${selectedEf.daysUntil} días`}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedEf.description}
              </p>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Anticipación recomendada: {selectedEf.anticipationDays} días antes
                </div>
                <p className="text-amber-800/90">
                  Comenzar historias, reels y toma de señas al menos{' '}
                  {selectedEf.anticipationDays} días antes de la fecha.
                </p>
              </div>

              {selectedEf.suggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200/80 space-y-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#FF0080] flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    Recomendaciones de Venta para Muggy
                  </div>
                  <ul className="space-y-1.5 text-xs font-semibold text-slate-800">
                    {selectedEf.suggestions.map((sug, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#FF0080] font-bold">•</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedEf)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar Sugerencias / Fecha
                </button>

                <button
                  type="button"
                  onClick={() => {
                    deleteEphemeris(selectedEf.id);
                    setSelectedEf(null);
                  }}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50"
                  title="Eliminar efeméride"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
              <div className="flex items-center gap-2 text-[#FF0080]">
                <Gift className="w-5 h-5" />
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Guía de Campañas Muggy
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hacé clic en cualquier efeméride del calendario para ver o editar las ideas de productos recomendados y los días de anticipación para publicar en Instagram y WhatsApp.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Próximas 4 fechas clave:
                </div>
                {upcomingList
                  .filter((e) => e.isCommercialOpportunity)
                  .slice(0, 4)
                  .map((ef) => (
                    <div
                      key={ef.id}
                      onClick={() => setSelectedEf(ef)}
                      className="p-3 rounded-2xl bg-[#FDF9F5] hover:bg-pink-50/60 border border-amber-200/70 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>{ef.name}</span>
                        <span className="text-[#FF0080]">
                          {ef.daysUntil} días
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {ef.suggestions.join(' • ')}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar / Editar Efeméride y Recomendaciones */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-pink-100 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-[#FF0080] to-[#00C2FF] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-display font-bold text-lg">
                {editingRule
                  ? `Editar Efeméride: ${editingRule.name}`
                  : 'Agregar Fecha Comercial / Personalizada'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEphemeris} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Nombre de la Fecha / Efeméride *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Feria Escolar José C. Paz / Aniversario Muggy"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as EphemerisCategory)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="Comercial Clave">Comercial Clave</option>
                    <option value="Profesiones y Oficios">Profesiones y Oficios</option>
                    <option value="Especial / Estacional">Especial / Estacional</option>
                    <option value="Feriado / Nacional">Feriado / Nacional</option>
                    <option value="Personalizada">Personalizada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formDateStr}
                    onChange={(e) => setFormDateStr(e.target.value)}
                    disabled={
                      editingRule?.ruleType === 'nth_weekday' ||
                      editingRule?.ruleType === 'easter_offset'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Días de anticipación alerta
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={formAnticipation}
                    onChange={(e) => setFormAnticipation(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-pink-700 pt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsOpportunity}
                    onChange={(e) => setFormIsOpportunity(e.target.checked)}
                    className="rounded text-[#FF0080]"
                  />
                  Destacar como oportunidad comercial
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#FF0080] mb-1">
                  Sugerencias de productos a promocionar (separados por coma)
                </label>
                <textarea
                  rows={3}
                  value={formSuggestions}
                  onChange={(e) => setFormSuggestions(e.target.value)}
                  placeholder="Ej: Tazas personalizadas, Mates de cerámica, Jarros térmicos, Packs de regalo"
                  className="w-full px-3.5 py-2 rounded-xl border border-pink-200 bg-pink-50/30 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF0080] text-white text-xs font-bold shadow-muggy"
                >
                  Guardar Fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
