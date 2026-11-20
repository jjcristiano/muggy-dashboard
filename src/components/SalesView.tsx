import React, { useMemo, useState } from 'react';
import {
  Box,
  CheckCircle,
  Edit3,
  Filter,
  PackageCheck,
  PackageX,
  PlusCircle,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import { Sale } from '../types';
import { computeStatsForSales } from '../utils/analytics';
import { formatARS, formatShortDate } from '../utils/formatters';
import { OrderStatusBadge, PaymentStatusBadge } from './StatusBadge';

interface SalesViewProps {
  onNewSale: () => void;
  onEditSale: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onNewSale,
  onEditSale,
}) => {
  const {
    visibleSales,
    products,
    settings,
    deleteSale,
    updateOrderStatus,
    updatePaymentStatus,
  } = useMuggy();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [packagingFilter, setPackagingFilter] = useState('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredSales = useMemo(() => {
    return visibleSales
      .filter((s) => {
        if (dateFrom && s.date < dateFrom) return false;
        if (dateTo && s.date > dateTo) return false;
        if (productFilter !== 'ALL' && s.productId !== productFilter)
          return false;
        if (orderStatusFilter !== 'ALL' && s.orderStatus !== orderStatusFilter)
          return false;
        if (
          paymentMethodFilter !== 'ALL' &&
          s.paymentMethod !== paymentMethodFilter
        )
          return false;
        if (
          paymentStatusFilter !== 'ALL' &&
          s.paymentStatus !== paymentStatusFilter
        )
          return false;
        if (packagingFilter !== 'ALL') {
          const mode = s.packagingMode || 'con_presentacion';
          if (packagingFilter === 'CON_PKG' && mode === 'sin_presentacion')
            return false;
          if (packagingFilter === 'SIN_PKG' && mode !== 'sin_presentacion')
            return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchClient = (s.clientName || '').toLowerCase().includes(q);
          const matchProd = s.productName.toLowerCase().includes(q);
          const matchVar = (s.variant || '').toLowerCase().includes(q);
          const matchNotes = (s.notes || '').toLowerCase().includes(q);
          if (!matchClient && !matchProd && !matchVar && !matchNotes)
            return false;
        }
        return true;
      })
      .sort((a, b) =>
        a.date !== b.date
          ? b.date.localeCompare(a.date)
          : b.createdAt.localeCompare(a.createdAt)
      );
  }, [
    visibleSales,
    dateFrom,
    dateTo,
    productFilter,
    orderStatusFilter,
    paymentMethodFilter,
    paymentStatusFilter,
    packagingFilter,
    searchQuery,
  ]);

  const filteredStats = useMemo(
    () =>
      computeStatsForSales(
        filteredSales.filter((s) =>
          settings.includeCancelledInStats ? true : s.orderStatus !== 'Cancelado'
        )
      ),
    [filteredSales, settings.includeCancelledInStats]
  );

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setProductFilter('ALL');
    setOrderStatusFilter('ALL');
    setPaymentMethodFilter('ALL');
    setPaymentStatusFilter('ALL');
    setPackagingFilter('ALL');
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-card">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            Registro y Gestión de Ventas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cada venta conserva el costo histórico de producto y packaging vigente cuando se vendió.
          </p>
        </div>

        <button
          onClick={onNewSale}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#FF3399] hover:from-[#E60073] hover:to-[#FF0080] text-white font-display font-bold text-sm shadow-muggy shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Cargar Nueva Venta
        </button>
      </div>

      {/* Tarjetas de Resumen de Ventas Filtradas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pedidos
          </span>
          <div className="font-display text-lg sm:text-xl font-bold text-slate-800 mt-0.5">
            {filteredStats.ordersCount} ({filteredStats.unitsSold} u.)
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-pink-100 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF0080]">
            Facturación
          </span>
          <div className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            {formatARS(filteredStats.revenue)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Costo Productos
          </span>
          <div className="font-display text-lg sm:text-xl font-bold text-slate-700 mt-0.5">
            {formatARS(filteredStats.productCost)}
          </div>
        </div>

        <div className="bg-sky-50/70 rounded-2xl p-3.5 border border-sky-200 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
            Costo Packaging
          </span>
          <div className="font-display text-lg sm:text-xl font-bold text-[#0088CC] mt-0.5">
            {formatARS(filteredStats.packagingCost)}
          </div>
        </div>

        <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Ganancia Neta Real
          </span>
          <div className="font-display text-lg sm:text-xl font-bold text-emerald-700 mt-0.5">
            {formatARS(filteredStats.profit)}
          </div>
        </div>

        <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-200 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Saldo a Cobrar
          </span>
          <div className="font-display text-lg sm:text-xl font-bold text-amber-800 mt-0.5">
            {formatARS(filteredStats.pendingBalance)}
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="w-4 h-4 text-[#FF0080]" />
            Buscador y Filtros
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#FF0080]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por cliente, producto, diseño..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#FF0080] outline-none text-sm"
            />
          </div>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Desde fecha"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Hasta fecha"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
          />

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="ALL">Todos los productos</option>
            {products
              .filter((p) => !p.isAddon)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>

          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="ALL">Todos los estados</option>
            {settings.orderStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <select
            value={packagingFilter}
            onChange={(e) => setPackagingFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Presentación: Todas</option>
            <option value="CON_PKG">Con presentación</option>
            <option value="SIN_PKG">Sin presentación (Mayorista)</option>
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Método pago: Todos</option>
            {settings.paymentMethods.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Cobro: Todos</option>
            <option value="Pagado">Pagado</option>
            <option value="Seña">Con Seña</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      {/* Listado de Ventas: Tarjetas Mobile-First en celular + Tabla en PC */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-3">
          <p className="text-slate-500 font-medium text-sm">
            No se encontraron ventas con los filtros seleccionados.
          </p>
          <button
            onClick={onNewSale}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-50 text-[#FF0080] font-bold text-xs hover:bg-pink-100"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar una venta ahora
          </button>
        </div>
      ) : (
        <>
          {/* VISTA CELULAR (Tarjetas adaptadas sin desplazamiento horizontal) */}
          <div className="lg:hidden space-y-3">
            {filteredSales.map((sale) => {
              const addonsCost = (sale.addons || []).reduce(
                (acc, a) => acc + a.quantity * a.unitCost,
                0
              );
              const prodCost =
                sale.totalProductCost !== undefined
                  ? sale.totalProductCost
                  : sale.quantity * sale.unitCost + addonsCost;
              const pkgCost =
                sale.totalPackagingCost !== undefined
                  ? sale.totalPackagingCost
                  : sale.quantity * (sale.unitPackagingCost || 0);
              const netProfit =
                sale.netProfit !== undefined ? sale.netProfit : sale.grossProfit;
              const isNoPkg = sale.packagingMode === 'sin_presentacion';

              return (
                <div
                  key={sale.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <span>{formatShortDate(sale.date)}</span>
                        <span>•</span>
                        <span>{sale.saleChannel}</span>
                        {sale.isDemo && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-800 font-bold">
                            DEMO
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-900 mt-0.5">
                        {sale.quantity}x {sale.productName}
                      </h3>
                      {sale.variant && (
                        <div className="text-xs text-slate-600">
                          Diseño: <strong>{sale.variant}</strong>
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        Cliente:{' '}
                        <strong className="text-slate-700">
                          {sale.clientName || 'Consumidor Final'}
                        </strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-slate-900">
                        {formatARS(sale.totalRevenue)}
                      </div>
                      <PaymentStatusBadge status={sale.paymentStatus} />
                    </div>
                  </div>

                  {/* Insignia de Presentación + Desglose de Costos Históricos */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Costo Prod.</span>
                      <strong className="text-slate-700">
                        {formatARS(prodCost)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        {isNoPkg ? 'Sin Packaging' : 'Packaging'}
                      </span>
                      <strong className="text-[#0088CC]">
                        {formatARS(pkgCost)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-700 font-bold block">
                        Ganancia Real
                      </span>
                      <strong className="text-emerald-700 text-xs">
                        {formatARS(netProfit)}
                      </strong>
                    </div>
                  </div>

                  {/* Controles rápidos de estado y cobro en la tarjeta móvil */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <select
                      value={sale.orderStatus}
                      onChange={(e) =>
                        updateOrderStatus(sale.id, e.target.value)
                      }
                      className="text-xs font-bold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800"
                    >
                      {settings.orderStatuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5">
                      {sale.pendingBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => updatePaymentStatus(sale.id, 'Pagado')}
                          className="px-2.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Saldar {formatARS(sale.pendingBalance)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditSale(sale)}
                        className="p-2 rounded-xl bg-pink-50 text-[#FF0080]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSale(sale.id)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA COMPUTADORA (Tabla completa con columnas de Producto y Packaging separados) */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 pl-5 pr-3">Fecha</th>
                    <th className="py-3.5 px-3">Cliente / Modalidad</th>
                    <th className="py-3.5 px-3">Producto y Presentación</th>
                    <th className="py-3.5 px-3 text-center">Cant.</th>
                    <th className="py-3.5 px-3 text-right">Venta Total</th>
                    <th className="py-3.5 px-3 text-right">Costo Prod.</th>
                    <th className="py-3.5 px-3 text-right">Packaging</th>
                    <th className="py-3.5 px-3 text-right">Ganancia Neta</th>
                    <th className="py-3.5 px-3">Cobro</th>
                    <th className="py-3.5 px-3">Estado</th>
                    <th className="py-3.5 pl-3 pr-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSales.map((sale) => {
                    const addonsCost = (sale.addons || []).reduce(
                      (acc, a) => acc + a.quantity * a.unitCost,
                      0
                    );
                    const prodCost =
                      sale.totalProductCost !== undefined
                        ? sale.totalProductCost
                        : sale.quantity * sale.unitCost + addonsCost;
                    const pkgCost =
                      sale.totalPackagingCost !== undefined
                        ? sale.totalPackagingCost
                        : sale.quantity * (sale.unitPackagingCost || 0);
                    const netProfit =
                      sale.netProfit !== undefined
                        ? sale.netProfit
                        : sale.grossProfit;
                    const isNoPkg = sale.packagingMode === 'sin_presentacion';

                    return (
                      <tr
                        key={sale.id}
                        className="hover:bg-pink-50/25 transition-colors"
                      >
                        <td className="py-3.5 pl-5 pr-3 whitespace-nowrap text-xs font-bold text-slate-700">
                          <div>{formatShortDate(sale.date)}</div>
                          {sale.isDemo && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-800 font-bold">
                              DEMO
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800 text-sm">
                            {sale.clientName || 'Consumidor Final'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {sale.saleModality || 'Minorista con presentación'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 max-w-xs">
                          <div className="font-bold text-slate-900 text-sm">
                            {sale.productName}
                          </div>
                          {sale.variant && (
                            <div className="text-xs text-slate-600">
                              Diseño: <strong>{sale.variant}</strong>
                            </div>
                          )}
                          <div className="mt-1">
                            {isNoPkg ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                <PackageX className="w-3 h-3" /> Sin presentación
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/70 text-[10px] font-bold">
                                <PackageCheck className="w-3 h-3" /> Con
                                presentación (
                                {formatARS(sale.unitPackagingCost || 0)} c/u)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-xs text-slate-800">
                            {sale.quantity} u.
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap font-bold text-slate-900">
                          {formatARS(sale.totalRevenue)}
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap text-xs font-semibold text-slate-600">
                          {formatARS(prodCost)}
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap text-xs font-bold text-[#0088CC]">
                          {formatARS(pkgCost)}
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl text-xs border border-emerald-200/60">
                            {formatARS(netProfit)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <PaymentStatusBadge status={sale.paymentStatus} />
                            <span className="text-[11px] text-slate-500">
                              {sale.paymentMethod}
                            </span>
                          </div>
                          {sale.pendingBalance > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[11px] font-bold text-rose-600">
                                Resta: {formatARS(sale.pendingBalance)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updatePaymentStatus(sale.id, 'Pagado')
                                }
                                className="text-[10px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold"
                              >
                                <CheckCircle className="w-3 h-3" /> Saldar
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <select
                            value={sale.orderStatus}
                            onChange={(e) =>
                              updateOrderStatus(sale.id, e.target.value)
                            }
                            className="text-xs font-semibold rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white"
                          >
                            {settings.orderStatuses.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditSale(sale)}
                              className="p-2 rounded-xl text-slate-600 hover:text-[#FF0080] hover:bg-pink-50"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {confirmDeleteId === sale.id ? (
                              <div className="inline-flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-xl border border-rose-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteSale(sale.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-[11px] font-bold text-rose-700"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[11px] text-slate-500 ml-1"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(sale.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
