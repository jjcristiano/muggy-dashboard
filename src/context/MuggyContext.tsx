import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { User } from '@supabase/supabase-js';
import {
  AppSettings,
  BusinessGoals,
  Client,
  EphemerisRule,
  PackagingComponent,
  Product,
  Sale,
} from '../types';
import {
  generateDemoData,
  INITIAL_GOALS,
  INITIAL_PACKAGING_COMPONENTS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import { DEFAULT_EPHEMERIS_RULES } from '../utils/ephemerides';
import { getTodayAR } from '../utils/formatters';
import {
  clearLocalSupabaseConfig,
  getSupabaseClient,
  getSupabaseConfig,
  saveLocalSupabaseConfig,
} from '../lib/supabase';

const STORAGE_KEY = 'muggy_dashboard_v2_store';
const LEGACY_STORAGE_KEY = 'muggy_dashboard_v1_store';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

interface PersistedState {
  products: Product[];
  packagingComponents: PackagingComponent[];
  sales: Sale[];
  clients: Client[];
  ephemerides: EphemerisRule[];
  goals: BusinessGoals;
  settings: AppSettings;
  showDemoData: boolean;
}

interface MuggyContextType extends PersistedState {
  visibleSales: Sale[];
  visibleClients: Client[];
  hasDemoItems: boolean;
  standardPackagingCost: number;
  standardPackagingComponents: PackagingComponent[];
  // Estado de Nube y Autenticación Supabase
  isSupabaseConfigured: boolean;
  supabaseConfigSource: 'env' | 'local' | 'none';
  user: User | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  connectSupabase: (url: string, anonKey: string) => void;
  disconnectSupabase: () => Promise<void>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  pushAllLocalToCloud: () => Promise<{ ok: boolean; message: string }>;
  // Acciones Ventas
  addSale: (saleData: Omit<Sale, 'id' | 'createdAt'>) => void;
  updateSale: (id: string, saleData: Omit<Sale, 'id' | 'createdAt'>) => void;
  deleteSale: (id: string) => void;
  updateOrderStatus: (id: string, orderStatus: string) => void;
  updatePaymentStatus: (
    id: string,
    paymentStatus: Sale['paymentStatus'],
    depositAmount?: number
  ) => void;
  // Acciones Productos
  addProduct: (prod: Omit<Product, 'id' | 'priceHistory'>) => void;
  updateProduct: (
    id: string,
    prod: Partial<Product>,
    priceNote?: string
  ) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  // Acciones Componentes de Packaging
  addPackagingComponent: (
    comp: Omit<PackagingComponent, 'id' | 'costHistory'>
  ) => void;
  updatePackagingComponent: (
    id: string,
    comp: Partial<PackagingComponent>,
    costNote?: string
  ) => void;
  deletePackagingComponent: (id: string) => void;
  togglePackagingComponentActive: (id: string) => void;
  togglePackagingComponentDefault: (id: string) => void;
  resetPackagingToDefaults: () => void;
  // Acciones Clientes
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  // Acciones Efemérides
  addEphemeris: (rule: Omit<EphemerisRule, 'id'>) => void;
  updateEphemeris: (id: string, rule: Partial<EphemerisRule>) => void;
  deleteEphemeris: (id: string) => void;
  // Acciones Objetivos y Configuración
  updateGoals: (goals: Partial<BusinessGoals>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  // Gestión Demo y Backups
  setShowDemoData: (show: boolean) => void;
  purgeDemoData: () => void;
  loadDemoData: () => void;
  exportBackupJson: () => void;
  importBackupJson: (jsonString: string) => { ok: boolean; message: string };
  resetCatalogToDefaults: () => void;
}

const MuggyContext = createContext<MuggyContextType | undefined>(undefined);

function getInitialState(): PersistedState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        products: parsed.products ?? INITIAL_PRODUCTS,
        packagingComponents:
          parsed.packagingComponents ?? INITIAL_PACKAGING_COMPONENTS,
        sales: parsed.sales ?? [],
        clients: parsed.clients ?? [],
        ephemerides: parsed.ephemerides ?? DEFAULT_EPHEMERIS_RULES,
        goals: { ...INITIAL_GOALS, ...(parsed.goals ?? {}) },
        settings: { ...INITIAL_SETTINGS, ...(parsed.settings ?? {}) },
        showDemoData: parsed.showDemoData ?? true,
      };
    }
  } catch (e) {
    console.error('Error loading Muggy store from localStorage:', e);
  }

  const today = getTodayAR();
  const demo = generateDemoData(today);

  return {
    products: INITIAL_PRODUCTS,
    packagingComponents: INITIAL_PACKAGING_COMPONENTS,
    sales: demo.sales,
    clients: demo.clients,
    ephemerides: DEFAULT_EPHEMERIS_RULES,
    goals: INITIAL_GOALS,
    settings: INITIAL_SETTINGS,
    showDemoData: true,
  };
}

export const MuggyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PersistedState>(getInitialState);
  const stateRef = useRef<PersistedState>(state);
  stateRef.current = state;

  // Configuración y sesión de Supabase
  const [configVersion, setConfigVersion] = useState(0);
  const supabaseConfig = useMemo(() => getSupabaseConfig(), [configVersion]);
  const supabase = useMemo(() => getSupabaseClient(), [configVersion]);
  const isSupabaseConfigured = Boolean(supabase);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? 'syncing' : 'local'
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Persistir caché local siempre
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving Muggy store to localStorage:', e);
    }
  }, [state]);

  // Helpers para mapear registros a filas de Supabase
  const mapProductRow = (p: Product, userId: string) => ({
    user_id: userId,
    id: p.id,
    name: p.name,
    category: p.category,
    unit_price: p.unitPrice,
    unit_cost: p.unitCost,
    active: p.active,
    payload: p,
    updated_at: new Date().toISOString(),
  });

  const mapPackagingRow = (c: PackagingComponent, userId: string) => ({
    user_id: userId,
    id: c.id,
    name: c.name,
    unit_cost: c.unitCost,
    active: c.active,
    payload: c,
    updated_at: new Date().toISOString(),
  });

  const mapSaleRow = (s: Sale, userId: string) => ({
    user_id: userId,
    id: s.id,
    sale_date: s.date,
    client_name: s.clientName || '',
    product_name: s.productName,
    quantity: s.quantity,
    total_revenue: s.totalRevenue,
    net_profit: s.netProfit !== undefined ? s.netProfit : s.grossProfit,
    order_status: s.orderStatus,
    payload: s,
    updated_at: new Date().toISOString(),
  });

  const mapClientRow = (c: Client, userId: string) => ({
    user_id: userId,
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    instagram: c.instagram || '',
    payload: c,
    updated_at: new Date().toISOString(),
  });

  const mapEphemerisRow = (ef: EphemerisRule, userId: string) => ({
    user_id: userId,
    id: ef.id,
    name: ef.name,
    category: ef.category,
    payload: ef,
    updated_at: new Date().toISOString(),
  });

  // Subir todo el estado local a la nube (útil al iniciar proyecto vacío o migrar datos)
  const pushSnapshotToCloud = useCallback(
    async (
      targetState: PersistedState,
      targetUserId: string
    ): Promise<{ ok: boolean; message: string }> => {
      if (!supabase) {
        return { ok: false, message: 'Supabase no está configurado.' };
      }

      setSyncStatus('syncing');
      setSyncError(null);

      try {
        const ops = [];

        if (targetState.products.length > 0) {
          ops.push(
            supabase
              .from('muggy_products')
              .upsert(
                targetState.products.map((p) => mapProductRow(p, targetUserId))
              )
          );
        }

        if (targetState.packagingComponents.length > 0) {
          ops.push(
            supabase
              .from('muggy_packaging')
              .upsert(
                targetState.packagingComponents.map((c) =>
                  mapPackagingRow(c, targetUserId)
                )
              )
          );
        }

        if (targetState.sales.length > 0) {
          ops.push(
            supabase
              .from('muggy_sales')
              .upsert(
                targetState.sales.map((s) => mapSaleRow(s, targetUserId))
              )
          );
        }

        if (targetState.clients.length > 0) {
          ops.push(
            supabase
              .from('muggy_clients')
              .upsert(
                targetState.clients.map((c) => mapClientRow(c, targetUserId))
              )
          );
        }

        if (targetState.ephemerides.length > 0) {
          ops.push(
            supabase
              .from('muggy_ephemerides')
              .upsert(
                targetState.ephemerides.map((ef) =>
                  mapEphemerisRow(ef, targetUserId)
                )
              )
          );
        }

        ops.push(
          supabase.from('muggy_workspace_config').upsert({
            user_id: targetUserId,
            goals: targetState.goals,
            settings: targetState.settings,
            show_demo_data: targetState.showDemoData,
            updated_at: new Date().toISOString(),
          })
        );

        const results = await Promise.all(ops);
        const firstErr = results.find((r) => r.error)?.error;
        if (firstErr) {
          throw firstErr;
        }

        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString('es-AR'));
        return {
          ok: true,
          message: 'Todos los datos se subieron y sincronizaron con Supabase.',
        };
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Error al subir datos a Supabase.';
        setSyncStatus('error');
        setSyncError(msg);
        return { ok: false, message: msg };
      }
    },
    [supabase]
  );

  // Descargar estado completo desde Supabase
  const fetchCloudState = useCallback(
    async (targetUserId: string) => {
      if (!supabase) return;
      setSyncStatus('syncing');
      setSyncError(null);

      try {
        const [
          prodRes,
          pkgRes,
          salesRes,
          clientsRes,
          efRes,
          cfgRes,
        ] = await Promise.all([
          supabase.from('muggy_products').select('payload'),
          supabase.from('muggy_packaging').select('payload'),
          supabase.from('muggy_sales').select('payload'),
          supabase.from('muggy_clients').select('payload'),
          supabase.from('muggy_ephemerides').select('payload'),
          supabase
            .from('muggy_workspace_config')
            .select('goals, settings, show_demo_data')
            .eq('user_id', targetUserId)
            .maybeSingle(),
        ]);

        const anyErr =
          prodRes.error ||
          pkgRes.error ||
          salesRes.error ||
          clientsRes.error ||
          efRes.error ||
          cfgRes.error;

        if (anyErr) {
          throw anyErr;
        }

        const cloudProducts = (prodRes.data || []).map(
          (r) => r.payload as Product
        );
        const cloudPkg = (pkgRes.data || []).map(
          (r) => r.payload as PackagingComponent
        );
        const cloudSales = (salesRes.data || []).map((r) => r.payload as Sale);
        const cloudClients = (clientsRes.data || []).map(
          (r) => r.payload as Client
        );
        const cloudEphemerides = (efRes.data || []).map(
          (r) => r.payload as EphemerisRule
        );
        const cloudConfig = cfgRes.data;

        // Si la nube está completamente virgen, sembrar automáticamente con el estado actual
        if (!cloudConfig && cloudProducts.length === 0) {
          await pushSnapshotToCloud(stateRef.current, targetUserId);
          return;
        }

        setState((prev) => ({
          products: cloudProducts.length > 0 ? cloudProducts : prev.products,
          packagingComponents:
            cloudPkg.length > 0 ? cloudPkg : prev.packagingComponents,
          sales: cloudSales,
          clients: cloudClients,
          ephemerides:
            cloudEphemerides.length > 0 ? cloudEphemerides : prev.ephemerides,
          goals: cloudConfig?.goals
            ? { ...INITIAL_GOALS, ...cloudConfig.goals }
            : prev.goals,
          settings: cloudConfig?.settings
            ? { ...INITIAL_SETTINGS, ...cloudConfig.settings }
            : prev.settings,
          showDemoData:
            cloudConfig?.show_demo_data !== undefined
              ? Boolean(cloudConfig.show_demo_data)
              : prev.showDemoData,
        }));

        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString('es-AR'));
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudo leer la base de datos en Supabase. Verificá haber ejecutado el Script SQL.';
        setSyncStatus('error');
        setSyncError(msg);
      }
    },
    [supabase, pushSnapshotToCloud]
  );

  // Escuchar sesión de autenticación en Supabase
  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setAuthLoading(false);
      setSyncStatus('local');
      return;
    }

    setAuthLoading(true);
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Cargar datos y suscribirse a Realtime cuando haya usuario autenticado
  useEffect(() => {
    if (!supabase || !user) return;

    fetchCloudState(user.id);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchCloudState(user.id);
      }, 350);
    };

    const channel = supabase
      .channel(`muggy-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'muggy_sales' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'muggy_products' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'muggy_packaging' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'muggy_clients' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'muggy_ephemerides' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'muggy_workspace_config' },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [supabase, user, fetchCloudState]);

  // Helper seguro para ejecutar mutaciones en la nube en segundo plano
  const runCloudOp = async (op: () => PromiseLike<{ error: unknown }>) => {
    if (!supabase || !user) return;
    setSyncStatus('syncing');
    try {
      const { error } = await op();
      if (error) throw error;
      setSyncStatus('synced');
      setSyncError(null);
      setLastSyncedAt(new Date().toLocaleTimeString('es-AR'));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error sincronizando cambio';
      setSyncStatus('error');
      setSyncError(msg);
    }
  };

  // Acciones de Conexión / Autenticación
  const connectSupabase = (url: string, anonKey: string) => {
    saveLocalSupabaseConfig(url, anonKey);
    setConfigVersion((v) => v + 1);
  };

  const disconnectSupabase = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    clearLocalSupabaseConfig();
    setUser(null);
    setSyncStatus('local');
    setSyncError(null);
    setConfigVersion((v) => v + 1);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { ok: false, message: 'Supabase no configurado.' };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Sesión iniciada.' };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) return { ok: false, message: 'Supabase no configurado.' };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { ok: false, message: error.message };
    }
    if (data.session) {
      return { ok: true, message: 'Cuenta creada e iniciada.' };
    }
    return {
      ok: true,
      message:
        'Cuenta creada. Revisá tu email para confirmar (o desactivá Confirm Email en Supabase Auth si querés entrar directo).',
    };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  const syncNow = async () => {
    if (supabase && user) {
      await fetchCloudState(user.id);
    }
  };

  const pushAllLocalToCloud = async () => {
    if (!supabase || !user) {
      return {
        ok: false,
        message: 'Primero conectá tu cuenta de Supabase e iniciá sesión.',
      };
    }
    return pushSnapshotToCloud(stateRef.current, user.id);
  };

  // Calculados derivados
  const standardPackagingComponents = useMemo(
    () => state.packagingComponents.filter((c) => c.active && c.defaultIncluded),
    [state.packagingComponents]
  );

  const standardPackagingCost = useMemo(
    () =>
      standardPackagingComponents.reduce(
        (sum, c) => sum + (Number(c.unitCost) || 0),
        0
      ),
    [standardPackagingComponents]
  );

  const hasDemoItems =
    state.sales.some((s) => s.isDemo) || state.clients.some((c) => c.isDemo);

  const visibleSales = state.showDemoData
    ? state.sales
    : state.sales.filter((s) => !s.isDemo);

  const visibleClients = state.showDemoData
    ? state.clients
    : state.clients.filter((c) => !c.isDemo);

  // ======================== MUTACIONES VENTAS ========================
  const addSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, sales: [newSale, ...prev.sales] }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase.from('muggy_sales').upsert(mapSaleRow(newSale, user.id))
      );
    }
  };

  const updateSale = (id: string, saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    let updatedSale: Sale | null = null;
    setState((prev) => ({
      ...prev,
      sales: prev.sales.map((s) => {
        if (s.id !== id) return s;
        updatedSale = { ...saleData, id, createdAt: s.createdAt };
        return updatedSale;
      }),
    }));
    if (supabase && user && updatedSale) {
      const row = mapSaleRow(updatedSale, user.id);
      runCloudOp(() => supabase.from('muggy_sales').upsert(row));
    }
  };

  const deleteSale = (id: string) => {
    setState((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== id),
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_sales')
          .delete()
          .eq('user_id', user.id)
          .eq('id', id)
      );
    }
  };

  const updateOrderStatus = (id: string, orderStatus: string) => {
    let updatedSale: Sale | null = null;
    setState((prev) => ({
      ...prev,
      sales: prev.sales.map((s) => {
        if (s.id !== id) return s;
        updatedSale = { ...s, orderStatus };
        return updatedSale;
      }),
    }));
    if (supabase && user && updatedSale) {
      const row = mapSaleRow(updatedSale, user.id);
      runCloudOp(() => supabase.from('muggy_sales').upsert(row));
    }
  };

  const updatePaymentStatus = (
    id: string,
    paymentStatus: Sale['paymentStatus'],
    depositAmount?: number
  ) => {
    let updatedSale: Sale | null = null;
    setState((prev) => ({
      ...prev,
      sales: prev.sales.map((s) => {
        if (s.id !== id) return s;
        const dep =
          paymentStatus === 'Pagado'
            ? s.totalRevenue
            : paymentStatus === 'Pendiente'
            ? 0
            : depositAmount ?? s.depositAmount;
        updatedSale = {
          ...s,
          paymentStatus,
          depositAmount: dep,
          pendingBalance: Math.max(0, s.totalRevenue - dep),
        };
        return updatedSale;
      }),
    }));
    if (supabase && user && updatedSale) {
      const row = mapSaleRow(updatedSale, user.id);
      runCloudOp(() => supabase.from('muggy_sales').upsert(row));
    }
  };

  // ======================== MUTACIONES PRODUCTOS ========================
  const addProduct = (prod: Omit<Product, 'id' | 'priceHistory'>) => {
    const today = getTodayAR();
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      priceHistory: [
        {
          id: `ph-${Date.now()}`,
          date: today,
          unitPrice: prod.unitPrice,
          bulkPrice: prod.bulkPrice,
          unitCost: prod.unitCost,
          note: 'Creación de producto',
        },
      ],
    };
    setState((prev) => ({ ...prev, products: [...prev.products, newProd] }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase.from('muggy_products').upsert(mapProductRow(newProd, user.id))
      );
    }
  };

  const updateProduct = (
    id: string,
    prod: Partial<Product>,
    priceNote?: string
  ) => {
    const today = getTodayAR();
    let updatedProd: Product | null = null;
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== id) return p;
        const priceChanged =
          (prod.unitPrice !== undefined && prod.unitPrice !== p.unitPrice) ||
          (prod.bulkPrice !== undefined && prod.bulkPrice !== p.bulkPrice) ||
          (prod.unitCost !== undefined && prod.unitCost !== p.unitCost);

        const nextHistory = priceChanged
          ? [
              {
                id: `ph-${Date.now()}`,
                date: today,
                unitPrice: prod.unitPrice ?? p.unitPrice,
                bulkPrice:
                  prod.bulkPrice !== undefined ? prod.bulkPrice : p.bulkPrice,
                unitCost: prod.unitCost ?? p.unitCost,
                note: priceNote || 'Actualización de precio/costo de compra',
              },
              ...(p.priceHistory || []),
            ]
          : p.priceHistory || [];

        updatedProd = { ...p, ...prod, priceHistory: nextHistory };
        return updatedProd;
      }),
    }));
    if (supabase && user && updatedProd) {
      const row = mapProductRow(updatedProd, user.id);
      runCloudOp(() => supabase.from('muggy_products').upsert(row));
    }
  };

  const deleteProduct = (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_products')
          .delete()
          .eq('user_id', user.id)
          .eq('id', id)
      );
    }
  };

  const toggleProductActive = (id: string) => {
    let updatedProd: Product | null = null;
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== id) return p;
        updatedProd = { ...p, active: !p.active };
        return updatedProd;
      }),
    }));
    if (supabase && user && updatedProd) {
      const row = mapProductRow(updatedProd, user.id);
      runCloudOp(() => supabase.from('muggy_products').upsert(row));
    }
  };

  // ======================== MUTACIONES PACKAGING ========================
  const addPackagingComponent = (
    comp: Omit<PackagingComponent, 'id' | 'costHistory'>
  ) => {
    const today = getTodayAR();
    const newComp: PackagingComponent = {
      ...comp,
      id: `pkg-${Date.now()}`,
      costHistory: [
        {
          id: `pkh-${Date.now()}`,
          date: today,
          unitCost: comp.unitCost,
          note: 'Alta de componente de packaging',
        },
      ],
    };
    setState((prev) => ({
      ...prev,
      packagingComponents: [...prev.packagingComponents, newComp],
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_packaging')
          .upsert(mapPackagingRow(newComp, user.id))
      );
    }
  };

  const updatePackagingComponent = (
    id: string,
    comp: Partial<PackagingComponent>,
    costNote?: string
  ) => {
    const today = getTodayAR();
    let updatedComp: PackagingComponent | null = null;
    setState((prev) => ({
      ...prev,
      packagingComponents: prev.packagingComponents.map((c) => {
        if (c.id !== id) return c;
        const costChanged =
          comp.unitCost !== undefined && comp.unitCost !== c.unitCost;
        const nextHistory = costChanged
          ? [
              {
                id: `pkh-${Date.now()}`,
                date: today,
                unitCost: comp.unitCost ?? c.unitCost,
                note:
                  costNote || 'Actualización de costo de insumo de packaging',
              },
              ...(c.costHistory || []),
            ]
          : c.costHistory || [];

        updatedComp = { ...c, ...comp, costHistory: nextHistory };
        return updatedComp;
      }),
    }));
    if (supabase && user && updatedComp) {
      const row = mapPackagingRow(updatedComp, user.id);
      runCloudOp(() => supabase.from('muggy_packaging').upsert(row));
    }
  };

  const deletePackagingComponent = (id: string) => {
    setState((prev) => ({
      ...prev,
      packagingComponents: prev.packagingComponents.filter((c) => c.id !== id),
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_packaging')
          .delete()
          .eq('user_id', user.id)
          .eq('id', id)
      );
    }
  };

  const togglePackagingComponentActive = (id: string) => {
    let updatedComp: PackagingComponent | null = null;
    setState((prev) => ({
      ...prev,
      packagingComponents: prev.packagingComponents.map((c) => {
        if (c.id !== id) return c;
        updatedComp = { ...c, active: !c.active };
        return updatedComp;
      }),
    }));
    if (supabase && user && updatedComp) {
      const row = mapPackagingRow(updatedComp, user.id);
      runCloudOp(() => supabase.from('muggy_packaging').upsert(row));
    }
  };

  const togglePackagingComponentDefault = (id: string) => {
    let updatedComp: PackagingComponent | null = null;
    setState((prev) => ({
      ...prev,
      packagingComponents: prev.packagingComponents.map((c) => {
        if (c.id !== id) return c;
        updatedComp = { ...c, defaultIncluded: !c.defaultIncluded };
        return updatedComp;
      }),
    }));
    if (supabase && user && updatedComp) {
      const row = mapPackagingRow(updatedComp, user.id);
      runCloudOp(() => supabase.from('muggy_packaging').upsert(row));
    }
  };

  const resetPackagingToDefaults = () => {
    setState((prev) => ({
      ...prev,
      packagingComponents: INITIAL_PACKAGING_COMPONENTS,
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_packaging')
          .upsert(
            INITIAL_PACKAGING_COMPONENTS.map((c) => mapPackagingRow(c, user.id))
          )
      );
    }
  };

  // ======================== MUTACIONES CLIENTES ========================
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: getTodayAR(),
    };
    setState((prev) => ({
      ...prev,
      clients: [newClient, ...prev.clients],
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_clients')
          .upsert(mapClientRow(newClient, user.id))
      );
    }
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    let updatedCli: Client | null = null;
    setState((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => {
        if (c.id !== id) return c;
        updatedCli = { ...c, ...clientData };
        return updatedCli;
      }),
    }));
    if (supabase && user && updatedCli) {
      const row = mapClientRow(updatedCli, user.id);
      runCloudOp(() => supabase.from('muggy_clients').upsert(row));
    }
  };

  const deleteClient = (id: string) => {
    setState((prev) => ({
      ...prev,
      clients: prev.clients.filter((c) => c.id !== id),
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_clients')
          .delete()
          .eq('user_id', user.id)
          .eq('id', id)
      );
    }
  };

  // ======================== MUTACIONES EFEMÉRIDES ========================
  const addEphemeris = (rule: Omit<EphemerisRule, 'id'>) => {
    const newRule: EphemerisRule = {
      ...rule,
      id: `ef-custom-${Date.now()}`,
      isCustom: true,
    };
    setState((prev) => ({
      ...prev,
      ephemerides: [...prev.ephemerides, newRule],
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_ephemerides')
          .upsert(mapEphemerisRow(newRule, user.id))
      );
    }
  };

  const updateEphemeris = (id: string, rule: Partial<EphemerisRule>) => {
    let updatedEf: EphemerisRule | null = null;
    setState((prev) => ({
      ...prev,
      ephemerides: prev.ephemerides.map((ef) => {
        if (ef.id !== id) return ef;
        updatedEf = { ...ef, ...rule };
        return updatedEf;
      }),
    }));
    if (supabase && user && updatedEf) {
      const row = mapEphemerisRow(updatedEf, user.id);
      runCloudOp(() => supabase.from('muggy_ephemerides').upsert(row));
    }
  };

  const deleteEphemeris = (id: string) => {
    setState((prev) => ({
      ...prev,
      ephemerides: prev.ephemerides.filter((ef) => ef.id !== id),
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_ephemerides')
          .delete()
          .eq('user_id', user.id)
          .eq('id', id)
      );
    }
  };

  // ======================== CONFIGURACIÓN Y OBJETIVOS ========================
  const syncWorkspaceConfig = (
    nextGoals: BusinessGoals,
    nextSettings: AppSettings,
    nextShowDemo: boolean
  ) => {
    if (!supabase || !user) return;
    runCloudOp(() =>
      supabase.from('muggy_workspace_config').upsert({
        user_id: user.id,
        goals: nextGoals,
        settings: nextSettings,
        show_demo_data: nextShowDemo,
        updated_at: new Date().toISOString(),
      })
    );
  };

  const updateGoals = (goals: Partial<BusinessGoals>) => {
    const nextGoals = { ...stateRef.current.goals, ...goals };
    setState((prev) => ({ ...prev, goals: nextGoals }));
    syncWorkspaceConfig(
      nextGoals,
      stateRef.current.settings,
      stateRef.current.showDemoData
    );
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    const nextSettings = { ...stateRef.current.settings, ...settings };
    setState((prev) => ({ ...prev, settings: nextSettings }));
    syncWorkspaceConfig(
      stateRef.current.goals,
      nextSettings,
      stateRef.current.showDemoData
    );
  };

  const setShowDemoData = (show: boolean) => {
    setState((prev) => ({ ...prev, showDemoData: show }));
    syncWorkspaceConfig(
      stateRef.current.goals,
      stateRef.current.settings,
      show
    );
  };

  const purgeDemoData = () => {
    const demoSaleIds = stateRef.current.sales
      .filter((s) => s.isDemo)
      .map((s) => s.id);
    const demoClientIds = stateRef.current.clients
      .filter((c) => c.isDemo)
      .map((c) => c.id);

    setState((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => !s.isDemo),
      clients: prev.clients.filter((c) => !c.isDemo),
      showDemoData: false,
    }));

    if (supabase && user) {
      if (demoSaleIds.length > 0) {
        runCloudOp(() =>
          supabase
            .from('muggy_sales')
            .delete()
            .eq('user_id', user.id)
            .in('id', demoSaleIds)
        );
      }
      if (demoClientIds.length > 0) {
        runCloudOp(() =>
          supabase
            .from('muggy_clients')
            .delete()
            .eq('user_id', user.id)
            .in('id', demoClientIds)
        );
      }
      syncWorkspaceConfig(
        stateRef.current.goals,
        stateRef.current.settings,
        false
      );
    }
  };

  const loadDemoData = () => {
    const today = getTodayAR();
    const demo = generateDemoData(today);
    const nonDemoSales = stateRef.current.sales.filter((s) => !s.isDemo);
    const nonDemoClients = stateRef.current.clients.filter((c) => !c.isDemo);

    setState((prev) => ({
      ...prev,
      sales: [...demo.sales, ...nonDemoSales],
      clients: [...demo.clients, ...nonDemoClients],
      showDemoData: true,
    }));

    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_sales')
          .upsert(demo.sales.map((s) => mapSaleRow(s, user.id)))
      );
      runCloudOp(() =>
        supabase
          .from('muggy_clients')
          .upsert(demo.clients.map((c) => mapClientRow(c, user.id)))
      );
      syncWorkspaceConfig(
        stateRef.current.goals,
        stateRef.current.settings,
        true
      );
    }
  };

  const exportBackupJson = () => {
    const today = getTodayAR();
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muggy_backup_${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackupJson = (
    jsonString: string
  ): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.products || !Array.isArray(parsed.sales)) {
        return {
          ok: false,
          message:
            'El archivo no tiene el formato válido de copia de seguridad de Muggy.',
        };
      }
      const nextState: PersistedState = {
        products: parsed.products,
        packagingComponents:
          parsed.packagingComponents || INITIAL_PACKAGING_COMPONENTS,
        sales: parsed.sales,
        clients: parsed.clients || [],
        ephemerides: parsed.ephemerides || DEFAULT_EPHEMERIS_RULES,
        goals: { ...INITIAL_GOALS, ...(parsed.goals || {}) },
        settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
        showDemoData: parsed.showDemoData ?? true,
      };
      setState(nextState);
      if (supabase && user) {
        pushSnapshotToCloud(nextState, user.id);
      }
      return {
        ok: true,
        message: 'Copia de seguridad restaurada con éxito.',
      };
    } catch {
      return { ok: false, message: 'Error al leer el archivo JSON.' };
    }
  };

  const resetCatalogToDefaults = () => {
    setState((prev) => ({
      ...prev,
      products: INITIAL_PRODUCTS,
      packagingComponents: INITIAL_PACKAGING_COMPONENTS,
    }));
    if (supabase && user) {
      runCloudOp(() =>
        supabase
          .from('muggy_products')
          .upsert(INITIAL_PRODUCTS.map((p) => mapProductRow(p, user.id)))
      );
      runCloudOp(() =>
        supabase
          .from('muggy_packaging')
          .upsert(
            INITIAL_PACKAGING_COMPONENTS.map((c) => mapPackagingRow(c, user.id))
          )
      );
    }
  };

  return (
    <MuggyContext.Provider
      value={{
        ...state,
        visibleSales,
        visibleClients,
        hasDemoItems,
        standardPackagingCost,
        standardPackagingComponents,
        isSupabaseConfigured,
        supabaseConfigSource: supabaseConfig.source,
        user,
        authLoading,
        syncStatus,
        syncError,
        lastSyncedAt,
        connectSupabase,
        disconnectSupabase,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        syncNow,
        pushAllLocalToCloud,
        addSale,
        updateSale,
        deleteSale,
        updateOrderStatus,
        updatePaymentStatus,
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
        addClient,
        updateClient,
        deleteClient,
        addEphemeris,
        updateEphemeris,
        deleteEphemeris,
        updateGoals,
        updateSettings,
        setShowDemoData,
        purgeDemoData,
        loadDemoData,
        exportBackupJson,
        importBackupJson,
        resetCatalogToDefaults,
      }}
    >
      {children}
    </MuggyContext.Provider>
  );
};

export function useMuggy() {
  const ctx = useContext(MuggyContext);
  if (!ctx) {
    throw new Error('useMuggy must be used within a MuggyProvider');
  }
  return ctx;
}
