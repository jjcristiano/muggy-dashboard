import React, { useMemo, useState } from 'react';
import {
  Box,
  Check,
  Coins,
  Edit3,
  Eye,
  EyeOff,
  History,
  PackageCheck,
  PackagePlus,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import { PackagingComponent, Product } from '../types';
import { formatARS, formatShortDate } from '../utils/formatters';

export const CatalogView: React.FC = () => {
  const {
    products,
    packagingComponents,
    standardPackagingCost,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    addPackagingComponent,
    updatePackagingComponent,
    deletePackagingComponent,
    togglePackagingComponentActive,
    togglePackagingComponentDefault,
    resetPackagingToDefaults,
  } = useMuggy();

  const [activeSubTab, setActiveSubTab] = useState<'productos' | 'packaging'>(
    'productos'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showInactive, setShowInactive] = useState(true);

  // Modal de crear/editar producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  // Modal de historial de precios y costos del producto
  const [historyProd, setHistoryProd] = useState<Product | null>(null);

  // Modal de historial de costos de un componente de packaging
  const [historyPkg, setHistoryPkg] = useState<PackagingComponent | null>(null);

  // Campos formulario producto
  const [name, setName] = useState('');
  const [category, setCategory] = useState(
    settings.categories[0] || 'Tazas Cerámica'
  );
  const [isCustomPrice, setIsCustomPrice] = useState(false);
  const [isAddon, setIsAddon] = useState(false);
  const [unitPrice, setUnitPrice] = useState(0);
  const [hasBulkDiscount, setHasBulkDiscount] = useState(true);
  const [bulkPrice, setBulkPrice] = useState(0);
  const [bulkMinQty, setBulkMinQty] = useState(2);
  const [unitCost, setUnitCost] = useState(0);
  const [variantsText, setVariantsText] = useState('');
  const [priceNote, setPriceNote] = useState('');

  // Campos formulario nuevo/editar componente de packaging
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackagingComponent | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgCost, setPkgCost] = useState(100);
  const [pkgDefaultIncluded, setPkgDefaultIncluded] = useState(true);
  const [pkgNote, setPkgNote] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!showInactive && !p.active) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchVar = p.variants.some((v) => v.toLowerCase().includes(q));
        if (!matchName && !matchCat && !matchVar) return false;
      }
      return true;
    });
  }, [products, showInactive, selectedCategory, searchQuery]);

  const openCreateModal = () => {
    setEditingProd(null);
    setName('');
    setCategory(settings.categories[0] || 'Tazas Cerámica');
    setIsCustomPrice(false);
    setIsAddon(false);
    setUnitPrice(9900);
    setHasBulkDiscount(true);
    setBulkPrice(9200);
    setBulkMinQty(2);
    setUnitCost(3800);
    setVariantsText('');
    setPriceNote('Nuevo producto en catálogo');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProd(prod);
    setName(prod.name);
    setCategory(prod.category);
    setIsCustomPrice(prod.isCustomPrice);
    setIsAddon(prod.isAddon);
    setUnitPrice(prod.unitPrice);
    setHasBulkDiscount(prod.bulkPrice !== null);
    setBulkPrice(prod.bulkPrice ?? prod.unitPrice);
    setBulkMinQty(prod.bulkMinQty || 2);
    setUnitCost(prod.unitCost);
    setVariantsText(prod.variants.join(', '));
    setPriceNote('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const variants = variantsText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      category,
      isCustomPrice,
      isAddon,
      unitPrice: isCustomPrice ? 0 : Number(unitPrice) || 0,
      bulkPrice:
        isCustomPrice || !hasBulkDiscount ? null : Number(bulkPrice) || null,
      bulkMinQty: Number(bulkMinQty) || 2,
      unitCost: Number(unitCost) || 0,
      variants,
      active: editingProd ? editingProd.active : true,
    };

    if (editingProd) {
      updateProduct(editingProd.id, payload, priceNote.trim() || undefined);
    } else {
      addProduct(payload);
    }
    setIsModalOpen(false);
  };

  const openCreatePkgModal = () => {
    setEditingPkg(null);
    setPkgName('');
    setPkgCost(100);
    setPkgDefaultIncluded(true);
    setPkgNote('');
    setPkgModalOpen(true);
  };

  const openEditPkgModal = (comp: PackagingComponent) => {
    setEditingPkg(comp);
    setPkgName(comp.name);
    setPkgCost(comp.unitCost);
    setPkgDefaultIncluded(comp.defaultIncluded);
    setPkgNote('');
    setPkgModalOpen(true);
  };

  const handleSavePkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;

    if (editingPkg) {
      updatePackagingComponent(
        editingPkg.id,
        {
          name: pkgName.trim(),
          unitCost: Number(pkgCost) || 0,
          defaultIncluded: pkgDefaultIncluded,
        },
        pkgNote.trim() || undefined
      );
    } else {
      addPackagingComponent({
        name: pkgName.trim(),
        unitCost: Number(pkgCost) || 0,
        active: true,
        defaultIncluded: pkgDefaultIncluded,
      });
    }
    setPkgModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Encabezado y Selector Productos vs Estructura de Packaging */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            Catálogo, Costos de Compra y Packaging
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visualizá la rentabilidad automática con y sin presentación ({formatARS(standardPackagingCost)}) y administrá cada insumo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('productos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'productos'
                  ? 'bg-[#FF0080] text-white shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Catálogo ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('packaging')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'packaging'
                  ? 'bg-[#00A8E8] text-white shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              Packaging ({formatARS(standardPackagingCost)})
            </button>
          </div>

          {activeSubTab === 'productos' ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#FF3399] text-white font-bold text-xs sm:text-sm shadow-muggy"
            >
              <PackagePlus className="w-4 h-4" />
              Nuevo Producto
            </button>
          ) : (
            <button
              type="button"
              onClick={openCreatePkgModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#00A8E8] text-white font-bold text-xs sm:text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar Insumo Packaging
            </button>
          )}
        </div>
      </div>

      {/* SUB-VISTA 2: ADMINISTRACIÓN DE COMPONENTES DE PRESENTACIÓN (PACKAGING $950) */}
      {activeSubTab === 'packaging' && (
        <div className="space-y-5">
          {/* Resumen del Packaging Habitual */}
          <div className="rounded-3xl bg-gradient-to-r from-sky-50 via-white to-pink-50 border border-sky-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                <Box className="w-3.5 h-3.5" />
                Estructura de Costo de Presentación Habitual Muggy
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                Total Presentación Completa:{' '}
                <span className="text-[#00A8E8]">
                  {formatARS(standardPackagingCost)}
                </span>{' '}
                por unidad
              </h2>
              <p className="text-xs text-slate-600">
                Cuando modificás estos costos por cambios de proveedor, las nuevas ventas usan el valor actualizado y las ventas pasadas conservan su costo histórico.
              </p>
            </div>

            <button
              type="button"
              onClick={resetPackagingToDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#FF0080] text-xs font-bold self-start sm:self-center shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar valores iniciales ($950)
            </button>
          </div>

          {/* Lista de componentes de packaging */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packagingComponents.map((comp) => (
              <div
                key={comp.id}
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  !comp.active
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : comp.defaultIncluded
                    ? 'bg-white border-sky-200 shadow-card'
                    : 'bg-white border-slate-200 shadow-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        comp.defaultIncluded && comp.active
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {comp.defaultIncluded && comp.active
                        ? 'Incluido en presentación habitual'
                        : 'Opcional / No incluido por defecto'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setHistoryPkg(comp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                        title="Ver historial de costos"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePackagingComponentActive(comp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title={
                          comp.active
                            ? 'Desactivar componente'
                            : 'Activar componente'
                        }
                      >
                        {comp.active ? (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {comp.name}
                  </h3>
                  <div className="font-display text-2xl font-bold text-[#00A8E8] mt-1">
                    {formatARS(comp.unitCost)}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      costo unitario
                    </span>
                  </div>

                  <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={comp.defaultIncluded}
                      onChange={() => togglePackagingComponentDefault(comp.id)}
                      className="rounded text-[#00A8E8]"
                    />
                    Incluir en "Con presentación" habitual
                  </label>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openEditPkgModal(comp)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF0080] hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modificar costo
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePackagingComponent(comp.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                    title="Eliminar componente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VISTA 1: CATÁLOGO DE PRODUCTOS CON RENTABILIDAD AUTOMÁTICA CON Y SIN PRESENTACIÓN */}
      {activeSubTab === 'productos' && (
        <>
          {/* Filtros de Catálogo */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[220px] flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar producto o modelo 3D..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#FF0080] outline-none text-sm"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="ALL">
                  Todas las categorías ({products.length})
                </option>
                {settings.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded text-[#FF0080]"
              />
              Mostrar desactivados
            </label>
          </div>

          {/* Grilla de Productos con desglose completo de costos y ganancias */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => {
              const pkgCost = prod.isAddon ? 0 : standardPackagingCost;
              const costWithPkg = prod.unitCost + pkgCost;
              const costWithoutPkg = prod.unitCost;

              const profitWithPkg = prod.isCustomPrice
                ? null
                : prod.unitPrice - costWithPkg;
              const profitWithoutPkg = prod.isCustomPrice
                ? null
                : prod.unitPrice - costWithoutPkg;

              const marginWithPkgPct =
                !prod.isCustomPrice && prod.unitPrice > 0 && profitWithPkg !== null
                  ? Math.round((profitWithPkg / prod.unitPrice) * 100)
                  : null;
              const marginWithoutPkgPct =
                !prod.isCustomPrice &&
                prod.unitPrice > 0 &&
                profitWithoutPkg !== null
                  ? Math.round((profitWithoutPkg / prod.unitPrice) * 100)
                  : null;

              return (
                <div
                  key={prod.id}
                  className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                    !prod.active
                      ? 'bg-slate-50 border-slate-200 opacity-65'
                      : prod.isCustomPrice
                      ? 'bg-gradient-to-br from-white to-pink-50/40 border-pink-200/80 shadow-card'
                      : 'bg-white border-slate-200/80 shadow-card'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/60">
                        {prod.category}
                      </span>

                      <div className="flex items-center gap-1">
                        {prod.isAddon && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Adicional
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setHistoryProd(prod)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                          title="Consultar historial de precios y costos"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleProductActive(prod.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title={
                            prod.active
                              ? 'Desactivar producto'
                              : 'Activar producto'
                          }
                        >
                          {prod.active ? (
                            <Eye className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {prod.name}
                    </h3>

                    {/* Precios de venta */}
                    {prod.isCustomPrice ? (
                      <div className="mt-3 p-3 rounded-2xl bg-pink-50/90 border border-pink-200/80">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF0080]">
                          <Sparkles className="w-4 h-4" />
                          Precio a consultar (Manual al vender)
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-700">
                          <div>
                            Costo producto:{' '}
                            <strong>{formatARS(prod.unitCost)}</strong>
                          </div>
                          <div>
                            Con packaging:{' '}
                            <strong>{formatARS(costWithPkg)}</strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-2xl bg-[#FDF9F5] border border-amber-200/60">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Precio Venta Unit.
                            </span>
                            <span className="font-display text-xl font-bold text-slate-900">
                              {formatARS(prod.unitPrice)}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-2xl bg-sky-50/60 border border-sky-200/60">
                            <span className="text-[10px] font-bold uppercase text-sky-700 block">
                              {prod.bulkPrice !== null
                                ? `Mayor (${prod.bulkMinQty || 2}+ u.)`
                                : 'Por Mayor'}
                            </span>
                            {prod.bulkPrice !== null ? (
                              <span className="font-display text-xl font-bold text-[#0088CC]">
                                {formatARS(prod.bulkPrice)}{' '}
                                <small className="text-xs font-normal">c/u</small>
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400 block mt-1">
                                Sin desc. definido
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Estructura de Costos A (Producto) + B (Packaging) */}
                        <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                          <span>
                            Costo compra:{' '}
                            <strong className="text-slate-800">
                              {formatARS(prod.unitCost)}
                            </strong>
                          </span>
                          {!prod.isAddon && (
                            <span>
                              Packaging:{' '}
                              <strong className="text-[#00A8E8]">
                                {formatARS(pkgCost)}
                              </strong>
                            </span>
                          )}
                        </div>

                        {/* Comparativa de Rentabilidad Con Presentación vs Sin Presentación */}
                        {!prod.isAddon && (
                          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                            {/* Con presentación */}
                            <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-0.5">
                              <div className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Con Presentación
                              </div>
                              <div className="text-[11px] text-slate-600">
                                Costo total:{' '}
                                <strong>{formatARS(costWithPkg)}</strong>
                              </div>
                              <div className="font-display font-bold text-sm text-emerald-700">
                                Ganancia: {formatARS(profitWithPkg || 0)}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-800/80">
                                Margen: {marginWithPkgPct}%
                              </div>
                            </div>

                            {/* Sin presentación */}
                            <div className="p-2.5 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-0.5">
                              <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                                <PackageX className="w-3.5 h-3.5 text-slate-500" />
                                Sin Presentación
                              </div>
                              <div className="text-[11px] text-slate-600">
                                Costo total:{' '}
                                <strong>{formatARS(costWithoutPkg)}</strong>
                              </div>
                              <div className="font-display font-bold text-sm text-slate-900">
                                Ganancia: {formatARS(profitWithoutPkg || 0)}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500">
                                Margen: {marginWithoutPkgPct}%
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {prod.variants.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {prod.variants.slice(0, 6).map((v) => (
                          <span
                            key={v}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF0080] hover:underline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Precio / Costo Compra
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProduct(prod.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar producto del catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Crear / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-pink-100 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-[#FF0080] to-[#00C2FF] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-display text-lg font-bold">
                {editingProd ? `Editar: ${editingProd.name}` : 'Crear Nuevo Producto'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                  >
                    {settings.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCustomPrice}
                    onChange={(e) => setIsCustomPrice(e.target.checked)}
                    className="rounded text-[#FF0080]"
                  />
                  Precio a consultar (Ej: Tazas 3D)
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAddon}
                    onChange={(e) => setIsAddon(e.target.checked)}
                    className="rounded text-[#FF0080]"
                  />
                  Es un Adicional (Ej: Golosinas)
                </label>
              </div>

              {!isCustomPrice && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Precio Unitario de Venta (ARS)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasBulkDiscount}
                        onChange={(e) => setHasBulkDiscount(e.target.checked)}
                        className="rounded text-[#FF0080]"
                      />
                      Precio por cantidad ({bulkMinQty} o más u.)
                    </label>
                    {hasBulkDiscount ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-sky-300 bg-sky-50/40 text-sm font-bold text-sky-900"
                        />
                        <input
                          type="number"
                          min={2}
                          value={bulkMinQty}
                          onChange={(e) => setBulkMinQty(Number(e.target.value))}
                          className="w-16 px-2 py-2.5 rounded-xl border border-slate-200 text-center text-xs font-bold"
                        />
                      </div>
                    ) : (
                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 text-xs text-slate-400">
                        Sin descuento por cantidad
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  A. Costo de Compra del Producto (Sin packaging) (ARS) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30 text-sm font-bold text-emerald-950"
                />
                {!isCustomPrice && !isAddon && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex flex-wrap justify-between gap-2">
                    <span>
                      Con packaging ({formatARS(standardPackagingCost)}): Costo{' '}
                      <strong>
                        {formatARS((Number(unitCost) || 0) + standardPackagingCost)}
                      </strong>{' '}
                      → Ganancia:{' '}
                      <strong className="text-emerald-700">
                        {formatARS(
                          (Number(unitPrice) || 0) -
                            ((Number(unitCost) || 0) + standardPackagingCost)
                        )}
                      </strong>
                    </span>
                    <span>
                      Sin packaging: Ganancia{' '}
                      <strong>
                        {formatARS(
                          (Number(unitPrice) || 0) - (Number(unitCost) || 0)
                        )}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Variantes o Modelos (separados por coma)
                </label>
                <input
                  type="text"
                  value={variantsText}
                  onChange={(e) => setVariantsText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              {editingProd && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Motivo / Nota para el historial de costos (Opcional)
                  </label>
                  <input
                    type="text"
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    placeholder="Ej: Aumento proveedor tazas cerámica"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF0080] text-white text-xs font-bold shadow-muggy"
                >
                  <Check className="w-4 h-4" />
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Componente de Packaging */}
      {pkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-sky-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#00A8E8] to-[#FF0080] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-display font-bold text-lg">
                {editingPkg
                  ? `Editar Insumo: ${editingPkg.name}`
                  : 'Nuevo Componente de Packaging'}
              </h3>
              <button
                type="button"
                onClick={() => setPkgModalOpen(false)}
                className="p-1 rounded-full bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePkg} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Nombre del elemento *
                </label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  placeholder="Ej: Caja estuche / Moño / Papel seda..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Costo Unitario (ARS) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={pkgCost}
                  onChange={(e) => setPkgCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sky-300 bg-sky-50/40 text-base font-bold text-sky-950"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pkgDefaultIncluded}
                  onChange={(e) => setPkgDefaultIncluded(e.target.checked)}
                  className="rounded text-[#00A8E8]"
                />
                Incluir automáticamente en la presentación habitual de Muggy
              </label>

              {editingPkg && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Nota de cambio de costo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={pkgNote}
                    onChange={(e) => setPkgNote(e.target.value)}
                    placeholder="Ej: Nueva compra papelera..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPkgModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00A8E8] text-white text-xs font-bold shadow-sm"
                >
                  Guardar Componente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Precios y Costos de Producto */}
      {historyProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-pink-400" />
                <h3 className="font-display font-bold text-base">
                  Historial — {historyProd.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryProd(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {!historyProd.priceHistory ||
              historyProd.priceHistory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Este producto aún no registra cambios históricos.
                </p>
              ) : (
                <div className="space-y-3">
                  {historyProd.priceHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {formatShortDate(item.date)}
                        </span>
                        <span className="text-slate-500">
                          {item.note || 'Actualización'}
                        </span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-bold text-[#FF0080]">
                          Venta: {formatARS(item.unitPrice)}
                        </div>
                        {item.bulkPrice !== null && (
                          <div className="font-semibold text-sky-700">
                            Mayor: {formatARS(item.bulkPrice)}
                          </div>
                        )}
                        <div className="font-bold text-emerald-700">
                          Costo compra: {formatARS(item.unitCost)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Costos de Packaging */}
      {historyPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-sky-400" />
                <h3 className="font-display font-bold text-base">
                  Historial de Costo — {historyPkg.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryPkg(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-80 overflow-y-auto space-y-2.5">
              {(historyPkg.costHistory || []).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {formatShortDate(item.date)}
                    </span>
                    <span className="text-slate-500">
                      {item.note || 'Actualización'}
                    </span>
                  </div>
                  <span className="font-display font-bold text-base text-[#00A8E8]">
                    {formatARS(item.unitCost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
