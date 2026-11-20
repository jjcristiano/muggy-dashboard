import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarHeart,
  Cloud,
  CloudOff,
  Download,
  EyeOff,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  PlusCircle,
  RefreshCw,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { MuggyProvider, useMuggy } from './context/MuggyContext';
import { Sale, SectionId } from './types';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { ReportsView } from './components/ReportsView';
import { CatalogView } from './components/CatalogView';
import { ClientsView } from './components/ClientsView';
import { CalendarView } from './components/CalendarView';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { SaleModal } from './components/SaleModal';
import { AuthScreen } from './components/AuthScreen';

const NAV_ITEMS: Array<{
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ventas', label: 'Ventas', icon: ShoppingBag },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'calendario', label: 'Calendario', icon: CalendarHeart },
  { id: 'objetivos', label: 'Objetivos', icon: Target },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MainShell: React.FC = () => {
  const {
    settings,
    hasDemoItems,
    showDemoData,
    setShowDemoData,
    purgeDemoData,
    isSupabaseConfigured,
    user,
    authLoading,
    syncStatus,
    syncNow,
  } = useMuggy();

  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estado del Modal de Nueva / Editar Venta
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Soporte PWA: evento de instalación nativa
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPwaGuideModal, setShowPwaGuideModal] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isSupabaseConfigured && authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <img
          src="/assets/muggy-mascot.png"
          alt="Muggy"
          className="w-20 h-20 object-contain animate-bounce mb-3"
        />
        <div className="font-display text-lg font-bold text-slate-800">
          Sincronizando Muggy Dashboard...
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured && !user) {
    return <AuthScreen />;
  }

  const handleInstallPwaClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      setShowPwaGuideModal(true);
    }
  };

  const handleOpenNewSale = () => {
    setEditingSale(null);
    setSaleModalOpen(true);
  };

  const handleOpenEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FDFBF7] text-slate-800 pb-24 lg:pb-0">
      {/* Barra superior decorativa con los 3 colores oficiales del logo Muggy */}
      <div className="fixed top-0 inset-x-0 h-1.5 z-50 flex">
        <div className="flex-1 bg-[#00C2FF]" />
        <div className="flex-1 bg-[#FFF04D]" />
        <div className="flex-1 bg-[#FF0080]" />
      </div>

      {/* Header Mobile-First */}
      <header className="lg:hidden pt-2.5 px-4 py-2.5 bg-white/95 backdrop-blur border-b border-pink-100 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div
          onClick={() => setActiveSection('dashboard')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img
            src="/assets/muggy-mascot.png"
            alt="Muggy Mascota"
            className="w-9 h-9 object-contain"
          />
          <img
            src="/assets/muggy-logo.png"
            alt="Muggy Logo"
            className="h-7 object-contain"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              syncStatus === 'local'
                ? setActiveSection('configuracion')
                : syncNow()
            }
            className={`inline-flex items-center gap-1 px-2 py-2 rounded-xl text-[10px] font-bold border ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : syncStatus === 'syncing'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : syncStatus === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={
              syncStatus === 'local'
                ? 'Modo local: tocá para activar sincronización en la nube'
                : 'Estado de sincronización en la nube'
            }
          >
            {syncStatus === 'synced' ? (
              <Cloud className="w-3.5 h-3.5" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden xs:inline">
              {syncStatus === 'synced'
                ? 'Nube OK'
                : syncStatus === 'syncing'
                ? 'Sincro...'
                : syncStatus === 'error'
                ? 'Error'
                : 'Local'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleInstallPwaClick}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-sky-50 text-[#0088CC] border border-sky-200 text-[11px] font-bold"
            title="Instalar aplicación Muggy en el celular"
          >
            <Smartphone className="w-3.5 h-3.5" />
            App
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700"
            aria-label="Menú completo"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Sidebar Lateral (Desktop + Drawer Mobile para todas las secciones) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-pink-100/80 flex flex-col justify-between transition-transform duration-300 pt-3 ${
          mobileMenuOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Identidad Visual Muggy */}
          <div
            onClick={() => {
              setActiveSection('dashboard');
              setMobileMenuOpen(false);
            }}
            className="cursor-pointer rounded-3xl bg-gradient-to-br from-[#FDF6EC] via-[#FFEBF5] to-[#E6F9FF] p-4 border border-pink-200/70 flex flex-col items-center text-center shadow-sm group"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <img
                src="/assets/muggy-mascot.png"
                alt="Mascota Muggy"
                className="w-14 h-14 object-contain group-hover:scale-110 transition-transform"
              />
              <img
                src="/assets/muggy-logo.png"
                alt="Muggy Sublimación & Bazar"
                className="h-12 object-contain"
              />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF0080] mt-1">
              Dashboard Comercial Privado
            </span>
          </div>

          {/* Botón Rápido Principal */}
          <button
            type="button"
            onClick={() => {
              handleOpenNewSale();
              setMobileMenuOpen(false);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#FF3399] hover:from-[#E60073] hover:to-[#FF0080] text-white font-display font-bold text-sm shadow-muggy hover:shadow-muggy-hover flex items-center justify-center gap-2 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Nueva Venta Rápida
          </button>

          {/* Navegación por las 8 Secciones */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-50 to-sky-50 text-[#FF0080] border border-pink-200/80 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-[#FF0080]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Botón Instalar App PWA en Sidebar */}
          <button
            type="button"
            onClick={() => {
              handleInstallPwaClick();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-[#0088CC] border border-sky-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Instalar App en Celular / PC
          </button>
        </div>

        {/* Pie del Sidebar */}
        <div className="p-4 m-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              if (syncStatus === 'local') {
                setActiveSection('configuracion');
                setMobileMenuOpen(false);
              } else {
                syncNow();
              }
            }}
            className={`w-full px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-colors ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : syncStatus === 'syncing'
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : syncStatus === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {syncStatus === 'synced' ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              ) : syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
              ) : (
                <CloudOff className="w-3.5 h-3.5" />
              )}
              {syncStatus === 'synced'
                ? 'Nube Sincronizada'
                : syncStatus === 'syncing'
                ? 'Sincronizando...'
                : syncStatus === 'error'
                ? 'Error de Nube (Reintentar)'
                : 'Modo Local (Conectar Nube)'}
            </span>
          </button>

          <div className="p-3.5 rounded-2xl bg-[#FDF8F3] border border-amber-200/70 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF0080]" />
              {settings.businessName} — {settings.instagram}
            </div>
            <div>WhatsApp: {settings.whatsapp}</div>
            <div className="truncate text-[10px] text-slate-500">
              {settings.address}
            </div>
          </div>
        </div>
      </aside>

      {/* Fondo oscuro cuando el menú lateral está abierto en móvil */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
        />
      )}

      {/* Contenedor Principal */}
      <main className="flex-1 min-w-0 pt-3 lg:pt-5 pb-8 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-4">
        {/* Cinta de control de Datos DEMO si están visibles */}
        {hasDemoItems && showDemoData && (
          <div className="rounded-2xl bg-amber-50/90 border border-amber-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <span className="px-2 py-0.5 rounded-md bg-amber-300 text-amber-950 font-extrabold text-[10px]">
                DEMO
              </span>
              <span className="font-medium">
                Viendo pedidos DEMO de muestra (con y sin packaging).
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowDemoData(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold text-[11px]"
              >
                <EyeOff className="w-3 h-3" />
                Ocultar
              </button>
              <button
                type="button"
                onClick={purgeDemoData}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
              >
                <Trash2 className="w-3 h-3" />
                Borrar DEMO
              </button>
            </div>
          </div>
        )}

        {/* Renderizado de la sección activa */}
        {activeSection === 'dashboard' && (
          <DashboardView
            onNewSale={handleOpenNewSale}
            onEditSale={handleOpenEditSale}
            onNavigate={setActiveSection}
          />
        )}
        {activeSection === 'ventas' && (
          <SalesView
            onNewSale={handleOpenNewSale}
            onEditSale={handleOpenEditSale}
          />
        )}
        {activeSection === 'reportes' && <ReportsView />}
        {activeSection === 'productos' && <CatalogView />}
        {activeSection === 'clientes' && <ClientsView />}
        {activeSection === 'calendario' && <CalendarView />}
        {activeSection === 'objetivos' && <GoalsView />}
        {activeSection === 'configuracion' && <SettingsView />}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR MOBILE-FIRST (Fija en celulares con botón central "+ Venta") */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-pink-100 shadow-[0_-8px_25px_-5px_rgba(30,41,59,0.08)] px-2 py-1.5">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl ${
              activeSection === 'dashboard'
                ? 'text-[#FF0080] font-bold'
                : 'text-slate-500 font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Inicio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('ventas')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl ${
              activeSection === 'ventas'
                ? 'text-[#FF0080] font-bold'
                : 'text-slate-500 font-medium'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Ventas</span>
          </button>

          {/* Botón Central Destacado "+ Venta" */}
          <div className="flex justify-center -mt-5">
            <button
              type="button"
              onClick={handleOpenNewSale}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF0080] to-[#FF4DA6] text-white shadow-muggy flex flex-col items-center justify-center border-4 border-white active:scale-95 transition-transform"
              aria-label="Nueva Venta"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
              <span className="text-[9px] font-extrabold uppercase leading-none">
                Venta
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection('productos')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl ${
              activeSection === 'productos'
                ? 'text-[#FF0080] font-bold'
                : 'text-slate-500 font-medium'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Costos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('reportes')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl ${
              activeSection === 'reportes'
                ? 'text-[#FF0080] font-bold'
                : 'text-slate-500 font-medium'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Reportes</span>
          </button>
        </div>
      </nav>

      {/* Modal Guía de Instalación PWA en Celular / PC */}
      {showPwaGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-pink-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF0080] to-[#00C2FF] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-display font-bold text-lg">
                  Instalar Muggy en tu Celular
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPwaGuideModal(false)}
                className="p-1 rounded-full bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-pink-50/70 border border-pink-200">
                <img
                  src="/assets/muggy-mascot.png"
                  alt="Muggy Icono"
                  className="w-12 h-12 object-contain shrink-0"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    Muggy Dashboard es una Web App Instalable (PWA)
                  </div>
                  <div className="text-xs text-slate-600">
                    Agregala a tu pantalla de inicio con el logo oficial de Muggy para abrirla a pantalla completa como una app nativa.
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">
                    En Android (Chrome):
                  </strong>
                  Tocá el menú de 3 puntos arriba a la derecha y elegí{' '}
                  <strong className="text-[#FF0080]">
                    "Instalar aplicación"
                  </strong>{' '}
                  o <strong>"Agregar a la pantalla principal"</strong>.
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">
                    En iPhone / iPad (Safari):
                  </strong>
                  Tocá el botón <strong>Compartir</strong> en la barra inferior y
                  seleccioná{' '}
                  <strong className="text-[#FF0080]">
                    "Agregar a Inicio"
                  </strong>
                  .
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPwaGuideModal(false)}
                className="w-full py-3 rounded-2xl bg-[#FF0080] text-white font-bold text-sm"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Global de Registro / Edición de Venta */}
      <SaleModal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        editingSale={editingSale}
      />
    </div>
  );
};

export function App() {
  return (
    <MuggyProvider>
      <MainShell />
    </MuggyProvider>
  );
}

export default App;
