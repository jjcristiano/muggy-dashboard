export type SectionId =
  | 'dashboard'
  | 'ventas'
  | 'reportes'
  | 'productos'
  | 'clientes'
  | 'calendario'
  | 'objetivos'
  | 'configuracion';

export interface PriceHistoryItem {
  id: string;
  date: string; // YYYY-MM-DD
  unitPrice: number;
  bulkPrice: number | null;
  unitCost: number;
  note?: string;
}

export interface PackagingCostHistoryItem {
  id: string;
  date: string; // YYYY-MM-DD
  unitCost: number;
  note?: string;
}

export interface PackagingComponent {
  id: string;
  name: string;
  unitCost: number;
  active: boolean;
  defaultIncluded: boolean; // True si forma parte de la presentación habitual de Muggy ($950)
  costHistory: PackagingCostHistoryItem[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unitPrice: number; // 0 if 'customPrice' is true
  bulkPrice: number | null; // null if no bulk discount
  bulkMinQty: number; // default 2
  unitCost: number; // Costo unitario de compra de la taza/mate/jarro independiente del packaging
  isCustomPrice: boolean; // True para Tazas 3D con precio a consultar
  isAddon: boolean; // True para Adicional golosinas
  variants: string[]; // Ej: Darth Vader, Groot, Chip...
  active: boolean;
  priceHistory: PriceHistoryItem[];
}

export interface SaleAddon {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface SalePackagingItemSnapshot {
  componentId: string;
  name: string;
  unitCost: number;
}

export type PackagingMode = 'con_presentacion' | 'sin_presentacion' | 'personalizada';

export type SaleModality =
  | 'Minorista con presentación'
  | 'Mayorista con presentación'
  | 'Mayorista sin presentación'
  | 'Venta personalizada';

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Mercado Pago' | 'Otro' | string;
export type PaymentStatus = 'Pendiente' | 'Seña' | 'Pagado';
export type OrderStatus =
  | 'Pendiente de diseño'
  | 'Esperando aprobación'
  | 'En producción'
  | 'Listo para retirar'
  | 'Enviado'
  | 'Entregado'
  | 'Cancelado'
  | string;

export type SaleChannel = 'Instagram' | 'WhatsApp' | 'Recomendación' | 'Venta directa' | 'Otro' | string;

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD (America/Argentina/Buenos_Aires)
  createdAt: string; // ISO string
  clientId?: string;
  clientName: string; // opcional
  productId: string;
  productName: string;
  category: string;
  variant: string; // opcional (ej. Stitch, frase personalizada, etc.)
  quantity: number;
  // Modalidad y presentación (Snapshot histórico inmutable al momento de la venta):
  saleModality?: SaleModality;
  packagingMode?: PackagingMode;
  packagingItemsSnapshot?: SalePackagingItemSnapshot[];
  unitPackagingCost?: number; // Costo unitario de packaging vigente al vender (ej. $950 o $0 sin presentación)
  totalPackagingCost?: number; // quantity * unitPackagingCost
  // Precios y costos históricos guardados en la venta:
  unitPrice: number;
  discount: number; // monto total de descuento aplicado en ARS
  unitCost: number; // costo unitario del producto base (sin packaging)
  totalProductCost?: number; // (quantity * unitCost) + sum(addons cost)
  unitTotalCost?: number; // unitCost + unitPackagingCost (Costo total de la unidad)
  addons: SaleAddon[]; // ej. Adicional golosinas
  otherCosts: number; // otros costos registrados opcionales (flete, comisión, etc.)
  totalRevenue: number; // Importe total de la venta = (quantity * unitPrice) + sum(addons) - discount
  totalCost: number; // Costo total = totalProductCost + totalPackagingCost + otherCosts
  grossProfit: number; // Ganancia bruta = totalRevenue - totalProductCost - totalPackagingCost
  netProfit?: number; // Ganancia neta estimada = totalRevenue - totalCost (descontando también otherCosts)
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  depositAmount: number; // Monto abonado / seña (si Pagado = totalRevenue, si Pendiente = 0, si Seña = parcial)
  pendingBalance: number; // Saldo pendiente de cobro = totalRevenue - depositAmount
  orderStatus: OrderStatus;
  saleChannel: SaleChannel;
  notes: string;
  isDemo?: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  instagram: string;
  email?: string;
  city?: string;
  notes: string;
  createdAt: string;
  isDemo?: boolean;
}

export type EphemerisCategory =
  | 'Comercial Clave'
  | 'Feriado / Nacional'
  | 'Profesiones y Oficios'
  | 'Especial / Estacional'
  | 'Personalizada';

export interface EphemerisRule {
  id: string;
  name: string;
  category: EphemerisCategory;
  description: string;
  anticipationDays: number; // Ej. 30, 20, 15 días antes para empezar a promocionar
  isCommercialOpportunity: boolean;
  suggestions: string[]; // Ej. ["Tazas personalizadas", "Mates personalizados", "Packs de regalo"]
  isCustom?: boolean;
  // Regla de fecha:
  ruleType: 'fixed' | 'nth_weekday' | 'easter_offset' | 'custom_date';
  month?: number; // 1-12
  day?: number; // 1-31
  nth?: number; // 1-5 (ej. 3er domingo)
  weekday?: number; // 0 (Dom) - 6 (Sáb)
  easterOffsetDays?: number; // 0 para Domingo de Pascua
  customDateStr?: string; // YYYY-MM-DD si es fecha única personalizada
}

export interface ResolvedEphemeris extends EphemerisRule {
  resolvedDate: string; // YYYY-MM-DD para el año consultado
  daysUntil: number; // Días desde hoy hasta la próxima ocurrencia
  nextOccurrenceDate: string; // YYYY-MM-DD de la próxima ocurrencia desde hoy
}

export interface BusinessGoals {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyProfitGoal: number;
  monthlyUnitsGoal: number;
}

export interface AppSettings {
  businessName: string;
  slogan: string;
  instagram: string;
  whatsapp: string;
  email: string;
  address: string;
  categories: string[];
  paymentMethods: string[];
  orderStatuses: string[];
  saleChannels: string[];
  includeCancelledInStats: boolean;
  defaultAnticipationAlertDays: number;
}
