import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  Database,
  Download,
  LogOut,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import { getSupabaseConfig, SUPABASE_SQL_SCHEMA } from '../lib/supabase';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    hasDemoItems,
    showDemoData,
    setShowDemoData,
    purgeDemoData,
    loadDemoData,
    exportBackupJson,
    importBackupJson,
    resetCatalogToDefaults,
    isSupabaseConfigured,
    supabaseConfigSource,
    user,
    syncStatus,
    syncError,
    lastSyncedAt,
    connectSupabase,
    disconnectSupabase,
    signOut,
    syncNow,
    pushAllLocalToCloud,
  } = useMuggy();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialSupa = getSupabaseConfig();
  const [supaUrl, setSupaUrl] = useState(initialSupa.url);
  const [supaKey, setSupaKey] = useState(initialSupa.anonKey);
  const [showSqlScript, setShowSqlScript] = useState(false);

  const [newCategory, setNewCategory] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const notify = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleAddListItem = (
    field: 'categories' | 'paymentMethods' | 'orderStatuses' | 'saleChannels',
    val: string,
    clearFn: () => void
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (settings[field].includes(trimmed)) return;
    updateSettings({
      [field]: [...settings[field], trimmed],
    });
    clearFn();
    notify(`Se agregó "${trimmed}" correctamente.`);
  };

  const handleRemoveListItem = (
    field: 'categories' | 'paymentMethods' | 'orderStatuses' | 'saleChannels',
    itemToRemove: string
  ) => {
    updateSettings({
      [field]: settings[field].filter((i) => i !== itemToRemove),
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const res = importBackupJson(content);
      notify(res.message);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-1">
          <Settings className="w-3.5 h-3.5 text-[#FF0080]" />
          Administración del Sistema
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Configuración General y Copias de Seguridad
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Personalizá categorías, métodos de pago, estados de pedido, datos de Muggy y copias de seguridad locales sin tocar código.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* SINCRONIZACIÓN EN LA NUBE CON SUPABASE (PC + CELULAR) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-sky-200 shadow-muggy space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-100 text-emerald-700'
                  : syncStatus === 'error'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-sky-100 text-[#0088CC]'
              }`}
            >
              {isSupabaseConfigured ? (
                <Cloud className="w-6 h-6" />
              ) : (
                <CloudOff className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Sincronización en la Nube (Supabase — PC y Celular)
              </h2>
              <p className="text-xs text-slate-600">
                {user
                  ? `Conectado como ${user.email} • Última sincro: ${
                      lastSyncedAt || 'Activa en tiempo real'
                    }`
                  : 'Conectá tu proyecto gratuito de Supabase para sincronizar automáticamente ventas, costos y productos entre tu PC y celular (4G/Wi-Fi).'}
              </p>
            </div>
          </div>

          {user && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await syncNow();
                  notify('Sincronización actualizada desde la nube.');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0088CC] text-xs font-bold border border-sky-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar ahora
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await pushAllLocalToCloud();
                  notify(res.message);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Upload className="w-3.5 h-3.5" />
                Subir mis datos locales a la Nube
              </button>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {syncError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong>Atención de sincronización:</strong> {syncError}
              <span className="block text-rose-700/80 mt-0.5">
                Asegurate de haber pegado y ejecutado el Script SQL en el SQL Editor de Supabase.
              </span>
            </div>
          </div>
        )}

        {/* Configuración de Credenciales Supabase */}
        {supabaseConfigSource === 'env' ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-semibold">
            ✓ Credenciales de Supabase configuradas por variables de entorno (.env). Cualquier dispositivo que abra la app se conectará automáticamente a tu nube.
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Project URL (Supabase)
                </label>
                <input
                  type="url"
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  placeholder="https://abcdefghijk.supabase.co"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Publishable Key / Anon Key (Supabase)
                </label>
                <input
                  type="password"
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  placeholder="sb_publishable_... o eyJhbGci..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!supaUrl.trim() || !supaKey.trim()) {
                      notify('Completá la URL y la Anon Key de Supabase.');
                      return;
                    }
                    connectSupabase(supaUrl, supaKey);
                    notify(
                      'Supabase conectado. Ahora iniciá sesión o creá tu cuenta de dueño.'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF0080] hover:bg-[#E60073] text-white text-xs font-bold shadow-sm"
                >
                  <Cloud className="w-4 h-4" />
                  {isSupabaseConfigured
                    ? 'Actualizar Conexión Supabase'
                    : 'Conectar con Supabase'}
                </button>

                {isSupabaseConfigured && (
                  <button
                    type="button"
                    onClick={async () => {
                      await disconnectSupabase();
                      setSupaUrl('');
                      setSupaKey('');
                      notify('Desconectado de la nube. Volviste al modo local.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 text-xs font-bold"
                  >
                    <CloudOff className="w-3.5 h-3.5" />
                    Desconectar nube
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowSqlScript(!showSqlScript)}
                className="text-xs font-bold text-[#0088CC] hover:underline"
              >
                {showSqlScript
                  ? 'Ocultar Script SQL'
                  : 'Ver / Copiar Script SQL para Supabase'}
              </button>
            </div>
          </div>
        )}

        {/* Guía rápida + Script SQL copiable */}
        {(showSqlScript || !isSupabaseConfigured) && (
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3 text-xs text-slate-700">
            <div className="font-bold text-slate-900">
              Pasos rápidos para activar tu nube privada gratuita en Supabase:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>
                Creá un proyecto gratuito en <strong>supabase.com</strong>.
              </li>
              <li>
                Entrá a <strong>SQL Editor → New Query</strong>, pegá el script SQL de abajo y presioná <strong>Run</strong>.
              </li>
              <li>
                Copiá tu <strong>Project URL</strong> y <strong>anon public key</strong> desde <em>Project Settings → API</em> y pegalos arriba (o en tu archivo <code>.env.local</code> / Vercel).
              </li>
              <li>
                Iniciá sesión con tu email y contraseña tanto en la PC como en el celular. ¡Listo, todo sincronizado en tiempo real!
              </li>
            </ol>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                  notify(
                    'Script SQL copiado al portapapeles. Pegalo en el SQL Editor de Supabase.'
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5 text-sky-300" />
                Copiar Script SQL Completo
              </button>
              <button
                type="button"
                onClick={() => setShowSqlScript(!showSqlScript)}
                className="text-xs font-bold text-slate-600 hover:underline"
              >
                {showSqlScript ? 'Ocultar código SQL' : 'Mostrar código SQL'}
              </button>
            </div>

            {showSqlScript && (
              <pre className="p-3 rounded-xl bg-slate-900 text-sky-200 text-[10px] overflow-x-auto max-h-56 font-mono">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Gestión de Datos DEMO y Copias de Seguridad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-amber-800">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Control de Datos de Demostración (DEMO)
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Los datos de prueba están claramente etiquetados con la insignia{' '}
            <strong className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              DEMO
            </strong>
            . Podés ocultarlos temporalmente o eliminarlos de forma definitiva para trabajar 100% con tus ventas reales.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 cursor-pointer">
              <input
                type="checkbox"
                checked={showDemoData}
                onChange={(e) => setShowDemoData(e.target.checked)}
                className="rounded text-[#FF0080]"
              />
              Mostrar registros DEMO en pantallas y gráficos
            </label>

            {hasDemoItems ? (
              <button
                type="button"
                onClick={() => {
                  purgeDemoData();
                  notify('Todos los registros DEMO fueron eliminados.');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Datos DEMO Definitivamente
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  loadDemoData();
                  notify('Se cargaron nuevamente los registros DEMO de muestra.');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar Datos DEMO de Muestra
              </button>
            )}
          </div>
        </div>

        {/* Copias de Seguridad / Persistencia */}
        <div className="bg-white rounded-3xl p-6 border border-sky-200 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-sky-700">
            <Database className="w-5 h-5" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Respaldo y Restauración de Datos (Backup)
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Toda tu información se guarda automáticamente en tu navegador. Además, podés descargar una copia completa en archivo JSON para respaldarla o pasarla a otra computadora.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                exportBackupJson();
                notify('Copia de seguridad descargada.');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A8E8] hover:bg-[#0091C9] text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Backup Completo (.json)
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar / Restaurar Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => {
                resetCatalogToDefaults();
                notify('Catálogo oficial de productos Muggy restaurado.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-[#FF0080] text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar precios iniciales del catálogo
            </button>
          </div>
        </div>
      </div>

      {/* Datos del Emprendimiento Muggy */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Identidad y Contacto de Muggy
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Nombre del Emprendimiento
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => updateSettings({ businessName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Instagram Oficial
            </label>
            <input
              type="text"
              value={settings.instagram}
              onChange={(e) => updateSettings({ instagram: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              WhatsApp Comercial
            </label>
            <input
              type="text"
              value={settings.whatsapp}
              onChange={(e) => updateSettings({ whatsapp: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Correo Electrónico
            </label>
            <input
              type="text"
              value={settings.email}
              onChange={(e) => updateSettings({ email: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Dirección / Punto de Retiro
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => updateSettings({ address: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Listas Personalizables: Categorías, Métodos de Pago, Estados de Pedido, Medios de Venta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categorías */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900">
            Categorías de Productos
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nueva categoría..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                handleAddListItem('categories', newCategory, () =>
                  setNewCategory('')
                )
              }
              className="px-3.5 py-2 rounded-xl bg-[#FF0080] text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {settings.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-900 text-xs font-semibold border border-pink-200"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveListItem('categories', cat)}
                  className="text-pink-400 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900">
            Métodos de Pago Habilitados
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              placeholder="Ej: Tarjeta de crédito / Cuenta DNI..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                handleAddListItem('paymentMethods', newPaymentMethod, () =>
                  setNewPaymentMethod('')
                )
              }
              className="px-3.5 py-2 rounded-xl bg-[#FF0080] text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {settings.paymentMethods.map((pm) => (
              <span
                key={pm}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-900 text-xs font-semibold border border-sky-200"
              >
                {pm}
                <button
                  type="button"
                  onClick={() => handleRemoveListItem('paymentMethods', pm)}
                  className="text-sky-400 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Estados del Pedido */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900">
            Estados de los Pedidos
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOrderStatus}
              onChange={(e) => setNewOrderStatus(e.target.value)}
              placeholder="Nuevo estado de pedido..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                handleAddListItem('orderStatuses', newOrderStatus, () =>
                  setNewOrderStatus('')
                )
              }
              className="px-3.5 py-2 rounded-xl bg-[#FF0080] text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {settings.orderStatuses.map((st) => (
              <span
                key={st}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200"
              >
                {st}
                <button
                  type="button"
                  onClick={() => handleRemoveListItem('orderStatuses', st)}
                  className="text-amber-400 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Medios de Venta */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900">
            Medios / Canales de Venta
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="Ej: Feria / TikTok / Catálogo..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                handleAddListItem('saleChannels', newChannel, () =>
                  setNewChannel('')
                )
              }
              className="px-3.5 py-2 rounded-xl bg-[#FF0080] text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {settings.saleChannels.map((ch) => (
              <span
                key={ch}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 text-xs font-semibold border border-purple-200"
              >
                {ch}
                <button
                  type="button"
                  onClick={() => handleRemoveListItem('saleChannels', ch)}
                  className="text-purple-400 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
