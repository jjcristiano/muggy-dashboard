import React, { useState } from 'react';
import { ChartDataPoint } from '../utils/analytics';
import { formatARS } from '../utils/formatters';

interface InteractiveSalesChartProps {
  data: ChartDataPoint[];
  height?: number;
  showProfitComparison?: boolean;
}

export const InteractiveSalesChart: React.FC<InteractiveSalesChartProps> = ({
  data,
  height = 260,
  showProfitComparison = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-slate-400 text-sm">
        Sin datos para este período
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.revenue, d.profit)), 10000);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxVal * t));

  return (
    <div className="w-full select-none">
      {/* Leyenda superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gradient-to-t from-[#FF0080] to-[#FF66B2] inline-block shadow-sm" />
            <span className="font-semibold text-slate-700">Facturación (Venta)</span>
          </div>
          {showProfitComparison && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gradient-to-t from-[#00A3D9] to-[#33D1FF] inline-block shadow-sm" />
              <span className="font-semibold text-slate-700">Ganancia Real</span>
            </div>
          )}
        </div>

        {hoveredIdx !== null && data[hoveredIdx] ? (
          <div className="flex items-center gap-3 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs shadow-md animate-fadeIn">
            <span className="font-bold text-amber-300">
              {data[hoveredIdx].subLabel || data[hoveredIdx].label}:
            </span>
            <span>
              Venta: <strong className="text-pink-300">{formatARS(data[hoveredIdx].revenue)}</strong>
            </span>
            <span>
              Ganancia:{' '}
              <strong className="text-sky-300">{formatARS(data[hoveredIdx].profit)}</strong>
            </span>
            <span className="text-slate-300">
              ({data[hoveredIdx].orders} ped. / {data[hoveredIdx].units} u.)
            </span>
          </div>
        ) : (
          <span className="text-slate-400 italic">
            Pasá el cursor o tocá una barra para ver el detalle exacto
          </span>
        )}
      </div>

      {/* Contenedor del gráfico */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Líneas guía horizontales */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
          {[...yTicks].reverse().map((tick, idx) => (
            <div key={idx} className="flex items-center w-full">
              <span className="w-16 text-[10px] font-medium text-slate-400 text-right pr-2 shrink-0">
                {tick === 0 ? '$0' : `$${Math.round(tick / 1000)}k`}
              </span>
              <div className="flex-1 border-b border-dashed border-slate-200/80" />
            </div>
          ))}
        </div>

        {/* Barras interactivas */}
        <div className="absolute inset-0 pl-16 pb-7 pt-2 flex items-end justify-between gap-1.5 sm:gap-2.5">
          {data.map((point, idx) => {
            const revPct = Math.max((point.revenue / maxVal) * 100, point.revenue > 0 ? 4 : 0);
            const profPct = Math.max((point.profit / maxVal) * 100, point.profit > 0 ? 4 : 0);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx === hoveredIdx ? null : idx)}
                className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
              >
                {/* Fondo resaltado en hover */}
                <div
                  className={`absolute inset-x-0 top-0 bottom-0 rounded-xl transition-colors -z-0 ${
                    isHovered ? 'bg-pink-50/70 ring-1 ring-pink-200/60' : 'group-hover:bg-slate-50/60'
                  }`}
                />

                {/* Par de barras */}
                <div className="w-full h-full flex items-end justify-center gap-0.5 sm:gap-1 px-0.5 z-10">
                  {/* Barra Facturación */}
                  <div
                    style={{ height: `${revPct}%` }}
                    className={`w-full max-w-[22px] rounded-t-lg transition-all duration-300 ${
                      point.revenue > 0
                        ? 'bg-gradient-to-t from-[#FF0080] to-[#FF5CAD] shadow-sm group-hover:brightness-110'
                        : 'h-[2px] bg-slate-200'
                    }`}
                  />
                  {/* Barra Ganancia */}
                  {showProfitComparison && (
                    <div
                      style={{ height: `${profPct}%` }}
                      className={`w-full max-w-[22px] rounded-t-lg transition-all duration-300 ${
                        point.profit > 0
                          ? 'bg-gradient-to-t from-[#00A8E8] to-[#38D6FF] shadow-sm group-hover:brightness-110'
                          : 'h-[2px] bg-slate-200'
                      }`}
                    />
                  )}
                </div>

                {/* Etiqueta eje X */}
                <span
                  className={`absolute -bottom-6 text-[10px] sm:text-[11px] font-semibold truncate max-w-full transition-colors ${
                    isHovered ? 'text-[#FF0080] font-bold' : 'text-slate-500'
                  }`}
                >
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
