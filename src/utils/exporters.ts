import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale } from '../types';
import { formatARS, formatShortDate, getTodayAR } from './formatters';
import { computeStatsForSales, getTopProducts } from './analytics';

function mapSalesToRows(sales: Sale[]) {
  return sales.map((s) => {
    const addonsRev = (s.addons || []).reduce(
      (a, ad) => a + ad.quantity * ad.unitPrice,
      0
    );
    const addonsCost = (s.addons || []).reduce(
      (a, ad) => a + ad.quantity * ad.unitCost,
      0
    );
    const prodCost =
      s.totalProductCost !== undefined
        ? s.totalProductCost
        : s.quantity * s.unitCost + addonsCost;
    const pkgCost =
      s.totalPackagingCost !== undefined
        ? s.totalPackagingCost
        : s.quantity * (s.unitPackagingCost || 0);
    const netProfit = s.netProfit !== undefined ? s.netProfit : s.grossProfit;

    return {
      Fecha: formatShortDate(s.date),
      Cliente: s.clientName || 'Consumidor Final',
      Modalidad: s.saleModality || 'Minorista con presentación',
      Presentación:
        s.packagingMode === 'sin_presentacion'
          ? 'Sin presentación ($0)'
          : s.packagingMode === 'personalizada'
          ? 'Presentación personalizada'
          : 'Con presentación',
      Producto: s.productName,
      Categoría: s.category,
      Variante: s.variant || '-',
      Cantidad: s.quantity,
      'Precio Unit. (ARS)': s.unitPrice,
      'Adicionales (ARS)': addonsRev,
      'Descuento (ARS)': s.discount,
      'Facturación Total (ARS)': s.totalRevenue,
      'Costo Productos (ARS)': prodCost,
      'Costo Packaging (ARS)': pkgCost,
      'Otros Costos (ARS)': s.otherCosts || 0,
      'Costo Total (ARS)': s.totalCost,
      'Ganancia Bruta (ARS)': s.grossProfit,
      'Ganancia Neta (ARS)': netProfit,
      'Método de Pago': s.paymentMethod,
      'Estado de Pago': s.paymentStatus,
      'Saldo Pendiente (ARS)': s.pendingBalance,
      'Estado del Pedido': s.orderStatus,
      'Medio de Venta': s.saleChannel,
      Observaciones: s.notes || '',
    };
  });
}

export function exportSalesToCSV(sales: Sale[], periodLabel: string) {
  const rows = mapSalesToRows(sales);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Muggy_Reporte_${periodLabel.replace(/\s+/g, '_')}_${getTodayAR()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSalesToExcel(sales: Sale[], periodLabel: string) {
  const stats = computeStatsForSales(sales);
  const topProducts = getTopProducts(sales);

  const summaryRows = [
    { Indicador: 'Período Consultado', Valor: periodLabel },
    { Indicador: 'Fecha de Exportación', Valor: formatShortDate(getTodayAR()) },
    { Indicador: 'Total Pedidos', Valor: stats.ordersCount },
    { Indicador: 'Total Unidades Vendidas', Valor: stats.unitsSold },
    { Indicador: 'Facturación Total (ARS)', Valor: stats.revenue },
    {
      Indicador: `Costo de Compra de Productos (${stats.productCostPct}%)`,
      Valor: stats.productCost,
    },
    {
      Indicador: `Costo Total de Packaging (${stats.packagingCostPct}%)`,
      Valor: stats.packagingCost,
    },
    {
      Indicador: `Otros Gastos Registrados (${stats.otherCostsPct}%)`,
      Valor: stats.otherCosts,
    },
    { Indicador: 'Costo Total Acumulado (ARS)', Valor: stats.cost },
    { Indicador: 'Ganancia Bruta (ARS)', Valor: stats.grossProfit },
    {
      Indicador: `Ganancia Neta Estimada (${stats.profitPct}%)`,
      Valor: stats.profit,
    },
    { Indicador: 'Ticket Promedio (ARS)', Valor: stats.avgTicket },
    { Indicador: 'Saldo Pendiente de Cobro (ARS)', Valor: stats.pendingBalance },
  ];

  const rankingRows = topProducts.map((p, idx) => ({
    Posición: idx + 1,
    Producto: p.productName,
    Categoría: p.category,
    'Unidades Vendidas': p.unitsSold,
    'Cant. Pedidos': p.ordersCount,
    'Facturación (ARS)': p.totalRevenue,
    'Ganancia Neta (ARS)': p.totalProfit,
  }));

  const detailRows = mapSalesToRows(sales);

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  const wsRanking = XLSX.utils.json_to_sheet(rankingRows);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Rentabilidad');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle de Ventas');
  XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking Productos');

  XLSX.writeFile(
    wb,
    `Muggy_Reporte_${periodLabel.replace(/\s+/g, '_')}_${getTodayAR()}.xlsx`
  );
}

export function exportSalesToPDF(sales: Sale[], periodLabel: string) {
  const stats = computeStatsForSales(sales);
  const topProducts = getTopProducts(sales).slice(0, 8);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFillColor(255, 0, 128);
  doc.rect(0, 0, 297, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MUGGY — Sublimación & Bazar | Reporte de Rentabilidad y Ventas', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Período: ${periodLabel}   |   Generado: ${formatShortDate(getTodayAR())}`,
    14,
    18
  );

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'Resumen de Rentabilidad (Facturación, Costo de Productos, Packaging y Ganancia Real)',
    14,
    31
  );

  autoTable(doc, {
    startY: 34,
    head: [
      [
        'Facturación',
        'Costo Productos',
        'Costo Packaging',
        'Otros Gastos',
        'Ganancia Bruta',
        'Ganancia Neta',
        'Pedidos / Unid.',
      ],
    ],
    body: [
      [
        formatARS(stats.revenue),
        `${formatARS(stats.productCost)} (${stats.productCostPct}%)`,
        `${formatARS(stats.packagingCost)} (${stats.packagingCostPct}%)`,
        `${formatARS(stats.otherCosts)} (${stats.otherCostsPct}%)`,
        formatARS(stats.grossProfit),
        `${formatARS(stats.profit)} (${stats.profitPct}%)`,
        `${stats.ordersCount} ped. / ${stats.unitsSold} u.`,
      ],
    ],
    headStyles: { fillColor: [0, 194, 255], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontStyle: 'bold', fontSize: 9.5 },
    theme: 'grid',
  });

  const afterSummaryY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;

  if (topProducts.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Productos Más Vendidos en el Período', 14, afterSummaryY);

    autoTable(doc, {
      startY: afterSummaryY + 3,
      head: [
        [
          '#',
          'Producto',
          'Categoría',
          'Unidades',
          'Pedidos',
          'Facturación',
          'Ganancia',
        ],
      ],
      body: topProducts.map((p, i) => [
        String(i + 1),
        p.productName,
        p.category,
        String(p.unitsSold),
        String(p.ordersCount),
        formatARS(p.totalRevenue),
        formatARS(p.totalProfit),
      ]),
      headStyles: { fillColor: [255, 0, 128], textColor: 255 },
      styles: { fontSize: 8.5 },
      theme: 'striped',
    });
  }

  const afterTopY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Ventas y Costos Históricos Registrados', 14, afterTopY);

  autoTable(doc, {
    startY: afterTopY + 3,
    head: [
      [
        'Fecha',
        'Cliente',
        'Producto',
        'Cant.',
        'Presentación',
        'Facturación',
        'Costo Prod.',
        'Packaging',
        'Ganancia Neta',
        'Estado',
      ],
    ],
    body: sales.map((s) => {
      const addonsCost = (s.addons || []).reduce(
        (a, ad) => a + ad.quantity * ad.unitCost,
        0
      );
      const prodCost =
        s.totalProductCost !== undefined
          ? s.totalProductCost
          : s.quantity * s.unitCost + addonsCost;
      const pkgCost =
        s.totalPackagingCost !== undefined
          ? s.totalPackagingCost
          : s.quantity * (s.unitPackagingCost || 0);
      const netProfit = s.netProfit !== undefined ? s.netProfit : s.grossProfit;

      return [
        formatShortDate(s.date),
        s.clientName || 'Consumidor Final',
        s.variant ? `${s.productName} (${s.variant})` : s.productName,
        String(s.quantity),
        s.packagingMode === 'sin_presentacion' ? 'Sin pkg' : 'Con pkg',
        formatARS(s.totalRevenue),
        formatARS(prodCost),
        formatARS(pkgCost),
        formatARS(netProfit),
        s.orderStatus,
      ];
    }),
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    styles: { fontSize: 7.5 },
    theme: 'striped',
  });

  doc.save(
    `Muggy_Reporte_${periodLabel.replace(/\s+/g, '_')}_${getTodayAR()}.pdf`
  );
}
