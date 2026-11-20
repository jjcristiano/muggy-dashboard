import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Box,
  Candy,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  PackageCheck,
  PackageX,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import {
  PackagingMode,
  PaymentStatus,
  Sale,
  SaleAddon,
  SaleModality,
  SalePackagingItemSnapshot,
} from '../types';
import { formatARS, getTodayAR } from '../utils/formatters';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSale?: Sale | null;
}

const MODALITIES: SaleModality[] = [
  'Minorista con presentación',
  'Mayorista con presentación',
  'Mayorista sin presentación',
  'Venta personalizada',
];

export const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  editingSale,
}) => {
  const {
    products,
    packagingComponents,
    standardPackagingCost,
    visibleClients,
    settings,
    addSale,
    updateSale,
    addClient,
  } = useMuggy();

  const activeProducts = products.filter((p) => p.active && !p.isAddon);
  const addonCatalogProducts = products.filter((p) => p.active && p.isAddon);
  const activePackagingComponents = packagingComponents.filter((c) => c.active);

  // Pasos rápidos Mobile-First (visibles siempre arriba)
  const [productId, setProductId] = useState<string>(activeProducts[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [saleModality, setSaleModality] = useState<SaleModality>(
    'Minorista con presentación'
  );
  const [packagingMode, setPackagingMode] =
    useState<PackagingMode>('con_presentacion');
  const [customSelectedPkgIds, setCustomSelectedPkgIds] = useState<string[]>([]);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    settings.paymentMethods[0] || 'Transferencia'
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pagado');
  const [depositAmount, setDepositAmount] = useState<number>(0);

  // Detalles adicionales opcionales (acordeón desplegable para rapidez en el celular)
  const [showExtraDetails, setShowExtraDetails] = useState<boolean>(false);
  const [date, setDate] = useState(getTodayAR());
  const [clientId, setClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [variant, setVariant] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [otherCosts, setOtherCosts] = useState<number>(0);
  const [addons, setAddons] = useState<SaleAddon[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>(
    settings.orderStatuses[2] || 'En producción'
  );
  const [saleChannel, setSaleChannel] = useState<string>(
    settings.saleChannels[0] || 'Instagram'
  );
  const [notes, setNotes] = useState<string>('');
  const [saveAsNewClient, setSaveAsNewClient] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // En modo edición, si queremos conservar exactamente el snapshot histórico de packaging
  const [historicalPkgSnapshot, setHistoricalPkgSnapshot] = useState<
    SalePackagingItemSnapshot[] | null
  >(null);

  const selectedProduct = products.find((p) => p.id === productId);

  // Inicializar estado al abrir el modal
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);

    if (editingSale) {
      setDate(editingSale.date);
      setClientId(editingSale.clientId || '');
      setClientName(editingSale.clientName || '');
      setProductId(editingSale.productId);
      setVariant(editingSale.variant || '');
      setQuantity(editingSale.quantity);
      setSaleModality(
        editingSale.saleModality || 'Minorista con presentación'
      );
      const mode: PackagingMode =
        editingSale.packagingMode || 'con_presentacion';
      setPackagingMode(mode);

      if (
        editingSale.packagingItemsSnapshot &&
        editingSale.packagingItemsSnapshot.length > 0
      ) {
        setHistoricalPkgSnapshot(editingSale.packagingItemsSnapshot);
        setCustomSelectedPkgIds(
          editingSale.packagingItemsSnapshot.map((i) => i.componentId)
        );
      } else {
        setHistoricalPkgSnapshot(null);
        setCustomSelectedPkgIds(
          activePackagingComponents
            .filter((c) => c.defaultIncluded)
            .map((c) => c.id)
        );
      }

      setUnitPrice(editingSale.unitPrice);
      setUnitCost(editingSale.unitCost);
      setDiscount(editingSale.discount || 0);
      setOtherCosts(editingSale.otherCosts || 0);
      setAddons(editingSale.addons || []);
      setPaymentMethod(editingSale.paymentMethod);
      setPaymentStatus(editingSale.paymentStatus);
      setDepositAmount(editingSale.depositAmount);
      setOrderStatus(editingSale.orderStatus);
      setSaleChannel(editingSale.saleChannel);
      setNotes(editingSale.notes || '');
      setSaveAsNewClient(false);
      // Si tiene cliente, variante, descuento o notas, mostrar detalles abiertos
      setShowExtraDetails(
        Boolean(
          editingSale.clientName ||
            editingSale.variant ||
            editingSale.discount > 0 ||
            (editingSale.addons && editingSale.addons.length > 0) ||
            editingSale.notes
        )
      );
    } else {
      const firstProd = activeProducts[0];
      setDate(getTodayAR());
      setClientId('');
      setClientName('');
      setProductId(firstProd?.id || '');
      setVariant(firstProd?.variants[0] || '');
      setQuantity(1);
      setSaleModality('Minorista con presentación');
      setPackagingMode('con_presentacion');
      setHistoricalPkgSnapshot(null);
      setCustomSelectedPkgIds(
        activePackagingComponents
          .filter((c) => c.defaultIncluded)
          .map((c) => c.id)
      );
      setUnitPrice(firstProd ? firstProd.unitPrice : 0);
      setUnitCost(firstProd ? firstProd.unitCost : 0);
      setDiscount(0);
      setOtherCosts(0);
      setAddons([]);
      setPaymentMethod('Transferencia');
      setPaymentStatus('Pagado');
      setDepositAmount(0);
      setOrderStatus('En producción');
      setSaleChannel('Instagram');
      setNotes('');
      setSaveAsNewClient(false);
      setNewClientPhone('');
      setShowExtraDetails(false);
    }
  }, [isOpen, editingSale]);

  // Calcular el precio sugerido según producto, cantidad y modalidad
  const applySuggestedPrice = (
    prodId: string,
    qty: number,
    modality: SaleModality
  ) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod || prod.isCustomPrice) return;

    const isWholesaleModality =
      modality === 'Mayorista con presentación' ||
      modality === 'Mayorista sin presentación';

    if (
      prod.bulkPrice !== null &&
      (isWholesaleModality || qty >= (prod.bulkMinQty || 2))
    ) {
      setUnitPrice(prod.bulkPrice);
    } else {
      setUnitPrice(prod.unitPrice);
    }
  };

  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const prod = products.find((p) => p.id === newProdId);
    if (prod) {
      setVariant(prod.variants[0] || '');
      setUnitCost(prod.unitCost);
      if (prod.isCustomPrice) {
        setUnitPrice(0);
      } else {
        applySuggestedPrice(newProdId, quantity, saleModality);
      }
    }
  };

  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);

    // Si pasa a 2 o más unidades y estaba en Minorista con presentación, sugerir Mayorista con presentación manteniendo el packaging seleccionado
    let nextModality = saleModality;
    if (validQty >= 2 && saleModality === 'Minorista con presentación') {
      nextModality = 'Mayorista con presentación';
      setSaleModality(nextModality);
    } else if (validQty === 1 && saleModality === 'Mayorista con presentación') {
      nextModality = 'Minorista con presentación';
      setSaleModality(nextModality);
    }

    applySuggestedPrice(productId, validQty, nextModality);
  };

  const handleModalityChange = (nextModality: SaleModality) => {
    setSaleModality(nextModality);
    setHistoricalPkgSnapshot(null);

    if (nextModality === 'Minorista con presentación') {
      setPackagingMode('con_presentacion');
      if (selectedProduct && !selectedProduct.isCustomPrice) {
        setUnitPrice(selectedProduct.unitPrice);
      }
    } else if (nextModality === 'Mayorista con presentación') {
      setPackagingMode('con_presentacion');
      if (quantity < 2) setQuantity(2);
      if (selectedProduct && !selectedProduct.isCustomPrice) {
        setUnitPrice(
          selectedProduct.bulkPrice !== null
            ? selectedProduct.bulkPrice
            : selectedProduct.unitPrice
        );
      }
    } else if (nextModality === 'Mayorista sin presentación') {
      setPackagingMode('sin_presentacion');
      if (quantity < 2) setQuantity(2);
      if (selectedProduct && !selectedProduct.isCustomPrice) {
        setUnitPrice(
          selectedProduct.bulkPrice !== null
            ? selectedProduct.bulkPrice
            : selectedProduct.unitPrice
        );
      }
    } else {
      // Venta personalizada
      setPackagingMode('personalizada');
    }
  };

  const handlePackagingModeChange = (mode: PackagingMode) => {
    setPackagingMode(mode);
    setHistoricalPkgSnapshot(null);
    if (mode === 'sin_presentacion' && saleModality === 'Mayorista con presentación') {
      setSaleModality('Mayorista sin presentación');
    } else if (mode === 'con_presentacion' && saleModality === 'Mayorista sin presentación') {
      setSaleModality('Mayorista con presentación');
    } else if (mode === 'personalizada') {
      setSaleModality('Venta personalizada');
    }
  };

  const toggleCustomPkgComponent = (compId: string) => {
    setHistoricalPkgSnapshot(null);
    setCustomSelectedPkgIds((prev) =>
      prev.includes(compId)
        ? prev.filter((id) => id !== compId)
        : [...prev, compId]
    );
  };

  const handleAddGolosinaAddon = () => {
    const golosinaProd =
      addonCatalogProducts[0] ||
      products.find((p) => p.id === 'prod-adicional-golosinas');

    const newAddon: SaleAddon = {
      id: `addon-${Date.now()}`,
      name: golosinaProd ? golosinaProd.name : 'Adicional golosinas',
      quantity: 1,
      unitPrice: golosinaProd ? golosinaProd.unitPrice : 3500,
      unitCost: golosinaProd ? golosinaProd.unitCost : 1500,
    };
    setAddons((prev) => [...prev, newAddon]);
    setShowExtraDetails(true);
  };

  const handleRemoveAddon = (addonId: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== addonId));
  };

  // Cálculo del Snapshot de Packaging para esta venta (NUNCA descuenta packaging dos veces)
  let currentPkgSnapshot: SalePackagingItemSnapshot[] = [];
  if (packagingMode === 'sin_presentacion') {
    currentPkgSnapshot = [];
  } else if (historicalPkgSnapshot !== null) {
    currentPkgSnapshot = historicalPkgSnapshot;
  } else if (packagingMode === 'con_presentacion') {
    currentPkgSnapshot = activePackagingComponents
      .filter((c) => c.defaultIncluded)
      .map((c) => ({
        componentId: c.id,
        name: c.name,
        unitCost: c.unitCost,
      }));
  } else {
    // Presentación personalizada
    currentPkgSnapshot = activePackagingComponents
      .filter((c) => customSelectedPkgIds.includes(c.id))
      .map((c) => ({
        componentId: c.id,
        name: c.name,
        unitCost: c.unitCost,
      }));
  }

  const unitPackagingCost = currentPkgSnapshot.reduce(
    (sum, item) => sum + (Number(item.unitCost) || 0),
    0
  );
  const totalPackagingCost = quantity * unitPackagingCost;

  // Cálculos automáticos de Facturación, Costo de Productos, Packaging y Ganancia
  const baseProductsSubtotal = quantity * (Number(unitPrice) || 0);
  const addonsRevenueTotal = addons.reduce(
    (acc, a) => acc + (Number(a.quantity) || 0) * (Number(a.unitPrice) || 0),
    0
  );
  const addonsCostTotal = addons.reduce(
    (acc, a) => acc + (Number(a.quantity) || 0) * (Number(a.unitCost) || 0),
    0
  );

  const totalRevenue = Math.max(
    0,
    baseProductsSubtotal + addonsRevenueTotal - (Number(discount) || 0)
  );

  const totalProductCost =
    quantity * (Number(unitCost) || 0) + addonsCostTotal;
  const unitTotalCost = (Number(unitCost) || 0) + unitPackagingCost;
  const totalCost =
    totalProductCost + totalPackagingCost + (Number(otherCosts) || 0);

  const grossProfit = totalRevenue - totalProductCost - totalPackagingCost;
  const netProfit = totalRevenue - totalCost;

  // Cuánto representa el packaging dentro del costo total de la operación
  const packagingShareOfCostPct =
    totalCost > 0 ? Math.round((totalPackagingCost / totalCost) * 100) : 0;

  const effectiveDeposit =
    paymentStatus === 'Pagado'
      ? totalRevenue
      : paymentStatus === 'Pendiente'
      ? 0
      : Math.min(totalRevenue, Math.max(0, Number(depositAmount) || 0));

  const pendingBalance = Math.max(0, totalRevenue - effectiveDeposit);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setErrorMsg('Por favor seleccioná un producto del catálogo.');
      return;
    }
    if (quantity < 1) {
      setErrorMsg('La cantidad debe ser al menos 1 unidad.');
      return;
    }
    if (unitPrice <= 0) {
      setErrorMsg(
        selectedProduct.isCustomPrice
          ? 'Este producto tiene precio a consultar: ingresá el precio unitario de venta.'
          : 'El precio unitario debe ser mayor a $0.'
      );
      return;
    }

    let finalClientId = clientId || undefined;
    const trimmedClientName = clientName.trim();

    if (saveAsNewClient && trimmedClientName && !finalClientId) {
      const created = addClient({
        name: trimmedClientName,
        phone: newClientPhone.trim(),
        instagram: '',
        notes: 'Creado desde registro rápido de venta',
      });
      finalClientId = created.id;
    }

    // Guardar copia histórica completa de precios y costos vigentes en este momento
    const payload: Omit<Sale, 'id' | 'createdAt'> = {
      date,
      clientId: finalClientId,
      clientName: trimmedClientName,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      category: selectedProduct.category,
      variant: variant.trim(),
      quantity: Number(quantity),
      saleModality,
      packagingMode,
      packagingItemsSnapshot: currentPkgSnapshot,
      unitPackagingCost,
      totalPackagingCost,
      unitPrice: Number(unitPrice),
      discount: Number(discount) || 0,
      unitCost: Number(unitCost) || 0,
      totalProductCost,
      unitTotalCost,
      addons,
      otherCosts: Number(otherCosts) || 0,
      totalRevenue,
      totalCost,
      grossProfit,
      netProfit,
      paymentMethod,
      paymentStatus,
      depositAmount: effectiveDeposit,
      pendingBalance,
      orderStatus,
      saleChannel,
      notes: notes.trim(),
      isDemo: editingSale?.isDemo || false,
    };

    if (editingSale) {
      updateSale(editingSale.id, payload);
    } else {
      addSale(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-pink-100 overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header Compacto Mobile-First */}
        <div className="bg-gradient-to-r from-[#FF0080] via-[#FF4DA6] to-[#00C2FF] px-5 py-3.5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-200" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold leading-tight">
                {editingSale ? 'Editar Venta' : 'Nueva Venta Rápida'}
              </h2>
              <p className="text-[11px] text-white/90">
                Completá en segundos • Costos históricos protegidos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 hover:bg-white/30 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1"
        >
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2 font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PASO 1 y 2: Producto y Cantidad con botones táctiles grandes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                1. Producto *
              </label>
              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#FF0080] outline-none text-sm font-bold bg-white text-slate-900"
              >
                {settings.categories.map((cat) => {
                  const prodsInCat = activeProducts.filter(
                    (p) => p.category === cat
                  );
                  if (prodsInCat.length === 0) return null;
                  return (
                    <optgroup key={cat} label={`— ${cat} —`}>
                      {prodsInCat.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{' '}
                          {p.isCustomPrice
                            ? '(Precio manual)'
                            : `(${formatARS(p.unitPrice)})`}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                2. Cantidad *
              </label>
              <div className="flex items-center h-[46px]">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="w-12 h-full rounded-l-2xl bg-slate-100 active:bg-slate-200 border-2 border-r-0 border-slate-200 font-bold text-lg text-slate-700 flex items-center justify-center"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  className="w-full h-full text-center border-y-2 border-slate-200 font-display font-bold text-base outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-12 h-full rounded-r-2xl bg-pink-50 active:bg-pink-100 border-2 border-l-0 border-pink-200 font-bold text-lg text-[#FF0080] flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* PASO 3: Modalidad de Venta (Minorista / Mayorista con o sin presentación) y Precio */}
          <div className="p-3.5 rounded-2xl bg-[#FDF8F3] border border-amber-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                3. Modalidad y Precio Unitario
              </span>
              {selectedProduct &&
                !selectedProduct.isCustomPrice &&
                selectedProduct.bulkPrice !== null && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUnitPrice(selectedProduct.unitPrice)}
                      className={`px-2 py-0.5 rounded-lg font-bold border ${
                        unitPrice === selectedProduct.unitPrice
                          ? 'bg-[#FF0080] text-white border-[#FF0080]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Unit: {formatARS(selectedProduct.unitPrice)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitPrice(selectedProduct.bulkPrice!)}
                      className={`px-2 py-0.5 rounded-lg font-bold border ${
                        unitPrice === selectedProduct.bulkPrice
                          ? 'bg-[#00A8E8] text-white border-[#00A8E8]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Mayor ({selectedProduct.bulkMinQty}+ u.):{' '}
                      {formatARS(selectedProduct.bulkPrice)}
                    </button>
                  </div>
                )}
            </div>

            {/* Botones táctiles de Modalidad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {MODALITIES.map((mod) => {
                const active = saleModality === mod;
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => handleModalityChange(mod)}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border text-center leading-tight transition-all ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Precio Unitario Venta (ARS) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-[#FF0080] outline-none text-sm font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Costo Compra Producto (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 outline-none text-sm font-semibold text-slate-700 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PASO 4: Selección de Presentación (Packaging) */}
          <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-[#00A8E8]" />
                4. Presentación (Packaging)
              </span>
              <span className="text-xs font-bold text-sky-900">
                Costo pkg: {formatARS(unitPackagingCost)} c/u (Total:{' '}
                {formatARS(totalPackagingCost)})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePackagingModeChange('con_presentacion')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  packagingMode === 'con_presentacion'
                    ? 'bg-[#00A8E8] text-white border-[#00A8E8] shadow-sm font-bold'
                    : 'bg-white text-slate-700 border-slate-200 font-semibold'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                <span className="text-xs leading-tight">Con presentación</span>
                <span
                  className={`text-[10px] ${
                    packagingMode === 'con_presentacion'
                      ? 'text-sky-100'
                      : 'text-slate-400'
                  }`}
                >
                  +{formatARS(standardPackagingCost)} c/u
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePackagingModeChange('sin_presentacion')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  packagingMode === 'sin_presentacion'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                    : 'bg-white text-slate-700 border-slate-200 font-semibold'
                }`}
              >
                <PackageX className="w-4 h-4" />
                <span className="text-xs leading-tight">Sin presentación</span>
                <span
                  className={`text-[10px] ${
                    packagingMode === 'sin_presentacion'
                      ? 'text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  $0 packaging
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePackagingModeChange('personalizada')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                  packagingMode === 'personalizada'
                    ? 'bg-[#FF0080] text-white border-[#FF0080] shadow-sm font-bold'
                    : 'bg-white text-slate-700 border-slate-200 font-semibold'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-xs leading-tight">Personalizada</span>
                <span
                  className={`text-[10px] ${
                    packagingMode === 'personalizada'
                      ? 'text-pink-100'
                      : 'text-slate-400'
                  }`}
                >
                  Elegir ítems
                </span>
              </button>
            </div>

            {/* Selector de componentes cuando es Presentación Personalizada */}
            {packagingMode === 'personalizada' && (
              <div className="pt-2 border-t border-sky-200/70">
                <span className="block text-[11px] font-bold text-slate-700 mb-2">
                  Seleccioná qué elementos de packaging incluye cada unidad:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activePackagingComponents.map((comp) => {
                    const checked = customSelectedPkgIds.includes(comp.id);
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => toggleCustomPkgComponent(comp.id)}
                        className={`p-2 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                          checked
                            ? 'bg-pink-50 border-[#FF0080] text-slate-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="truncate">{comp.name}</span>
                        <span className="text-[11px] text-[#FF0080] shrink-0 ml-1">
                          {formatARS(comp.unitCost)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PASO 5 y 6: Método de Pago y Estado del Pago con botones táctiles rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                5. Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {settings.paymentMethods.slice(0, 4).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === pm
                        ? 'bg-pink-50 border-[#FF0080] text-[#FF0080] shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                6. Estado del Cobro
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Pagado', 'Seña', 'Pendiente'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setPaymentStatus(st);
                      if (st === 'Seña' && depositAmount === 0) {
                        setDepositAmount(Math.round(totalRevenue / 2));
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentStatus === st
                        ? st === 'Pagado'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st === 'Seña'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {paymentStatus === 'Seña' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800 shrink-0">
                    Seña abonada ($):
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={totalRevenue}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 font-bold text-xs text-amber-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botones rápidos para Golosinas y Acordeón de Detalles Adicionales Opcionales */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddGolosinaAddon}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-[#FF0080] font-bold text-xs transition-colors"
            >
              <Candy className="w-4 h-4" />
              + Sumar Adicional Golosinas ($3.500)
            </button>

            <button
              type="button"
              onClick={() => setShowExtraDetails(!showExtraDetails)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              {showExtraDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Ocultar detalles opcionales
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> Cliente, diseño, fecha, descuentos...
                </>
              )}
            </button>
          </div>

          {/* Sección Desplegable de Detalles Adicionales */}
          {showExtraDetails && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Fecha de Venta
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    list="muggy-clients-list"
                    placeholder="Opcional..."
                    value={clientName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClientName(val);
                      const match = visibleClients.find(
                        (c) => c.name.toLowerCase() === val.toLowerCase()
                      );
                      setClientId(match ? match.id : '');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                  <datalist id="muggy-clients-list">
                    {visibleClients.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                  {clientName.trim().length > 1 && !clientId && (
                    <div className="flex items-center gap-2 mt-1">
                      <label className="inline-flex items-center gap-1 text-[11px] text-pink-700 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAsNewClient}
                          onChange={(e) => setSaveAsNewClient(e.target.checked)}
                          className="rounded text-[#FF0080]"
                        />
                        <UserPlus className="w-3 h-3" /> Agendar
                      </label>
                      {saveAsNewClient && (
                        <input
                          type="text"
                          placeholder="WhatsApp"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="px-2 py-0.5 text-[11px] rounded border border-pink-200 w-24 bg-white"
                        />
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Variante / Modelo / Frase
                  </label>
                  <input
                    type="text"
                    list="product-variants-list"
                    placeholder="Ej: Stitch, Polaroid..."
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                  {selectedProduct && selectedProduct.variants.length > 0 && (
                    <datalist id="product-variants-list">
                      {selectedProduct.variants.map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>

              {/* Adicionales cargados */}
              {addons.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Adicionales incluidos:
                  </span>
                  {addons.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-pink-100 text-xs"
                    >
                      <span className="font-bold text-slate-800">{ad.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={ad.quantity}
                          onChange={(e) =>
                            setAddons((prev) =>
                              prev.map((x) =>
                                x.id === ad.id
                                  ? { ...x, quantity: Number(e.target.value) }
                                  : x
                              )
                            )
                          }
                          className="w-14 px-2 py-1 rounded border text-center font-bold"
                        />
                        <span className="font-semibold text-[#FF0080]">
                          {formatARS(ad.unitPrice * ad.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddon(ad.id)}
                          className="p-1 text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Descuento (ARS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Otros Gastos (ARS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Estado Pedido
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    {settings.orderStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Canal de Venta
                  </label>
                  <select
                    value={saleChannel}
                    onChange={(e) => setSaleChannel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    {settings.saleChannels.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Observaciones del pedido (ej. retira viernes, frase especial)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          )}

          {/* Resumen Automático de Costos y Ganancia Real */}
          <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Importe Venta
                </span>
                <span className="text-lg sm:text-xl font-display font-bold text-white">
                  {formatARS(totalRevenue)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Costo Total ({quantity} u.)
                </span>
                <span className="text-base sm:text-lg font-display font-bold text-amber-300">
                  {formatARS(totalCost)}
                </span>
              </div>

              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-2 text-right">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold flex items-center justify-end gap-1">
                  <Coins className="w-3 h-3" /> Ganancia Real
                </span>
                <span className="text-lg sm:text-xl font-display font-bold text-emerald-300">
                  {formatARS(netProfit)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
              <span>
                Prod: <strong>{formatARS(totalProductCost)}</strong> + Packaging:{' '}
                <strong className="text-sky-300">
                  {formatARS(totalPackagingCost)}
                </strong>{' '}
                ({packagingShareOfCostPct}% del costo)
              </span>
              {pendingBalance > 0 && (
                <span className="text-rose-300 font-bold">
                  Saldo a cobrar: {formatARS(pendingBalance)}
                </span>
              )}
            </div>
          </div>

          {/* PASO 7: Botón Grande Guardar Venta */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#FF3399] hover:from-[#E60073] hover:to-[#FF0080] text-white font-display font-bold text-base shadow-muggy flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <Check className="w-5 h-5" />
              {editingSale ? 'Guardar Cambios' : '7. Guardar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
