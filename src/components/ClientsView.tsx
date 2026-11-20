import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  Instagram,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';
import { Client } from '../types';
import { formatARS, formatShortDate } from '../utils/formatters';

export const ClientsView: React.FC = () => {
  const { visibleClients, visibleSales, addClient, updateClient, deleteClient } =
    useMuggy();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  // Enriquecer clientes con su historial de compras reales en Muggy
  const enrichedClients = useMemo(() => {
    return visibleClients
      .map((client) => {
        const clientSales = visibleSales.filter(
          (s) =>
            s.orderStatus !== 'Cancelado' &&
            (s.clientId === client.id ||
              s.clientName.toLowerCase() === client.name.toLowerCase())
        );
        const totalSpent = clientSales.reduce((acc, s) => acc + s.totalRevenue, 0);
        const totalProfit = clientSales.reduce((acc, s) => acc + s.grossProfit, 0);
        const totalUnits = clientSales.reduce((acc, s) => acc + s.quantity, 0);
        const lastSaleDate =
          clientSales.length > 0
            ? [...clientSales].sort((a, b) => b.date.localeCompare(a.date))[0].date
            : null;

        return {
          ...client,
          ordersCount: clientSales.length,
          totalSpent,
          totalProfit,
          totalUnits,
          lastSaleDate,
        };
      })
      .filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.instagram || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.notes || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [visibleClients, visibleSales, searchQuery]);

  const openCreateModal = () => {
    setEditingClient(null);
    setName('');
    setPhone('');
    setInstagram('');
    setCity('José C. Paz');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setInstagram(c.instagram);
    setCity(c.city || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        name: name.trim(),
        phone: phone.trim(),
        instagram: instagram.trim(),
        city: city.trim(),
        notes: notes.trim(),
      });
    } else {
      addClient({
        name: name.trim(),
        phone: phone.trim(),
        instagram: instagram.trim(),
        city: city.trim(),
        notes: notes.trim(),
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Agenda de Clientes Muggy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Consultá quiénes compran más, sus datos de contacto por WhatsApp/Instagram y sus preferencias de diseño.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#FF3399] hover:from-[#E60073] hover:to-[#FF0080] text-white font-bold text-sm shadow-muggy transition-all shrink-0"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, WhatsApp, Instagram o localidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#FF0080] outline-none text-sm"
          />
        </div>
      </div>

      {/* Grilla de Clientes */}
      {enrichedClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 text-slate-400 text-sm">
          No hay clientes registrados con ese criterio.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enrichedClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card hover:shadow-muggy transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-1.5">
                      {client.name}
                      {client.isDemo && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-800 font-bold">
                          DEMO
                        </span>
                      )}
                    </h3>
                    {client.city && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        {client.city}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(client)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-[#FF0080] hover:bg-pink-50"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteClient(client.id)}
                      className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {client.phone && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-semibold">
                      <Phone className="w-3.5 h-3.5" />
                      {client.phone}
                    </span>
                  )}
                  {client.instagram && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-50 text-[#FF0080] font-semibold">
                      <Instagram className="w-3.5 h-3.5" />
                      {client.instagram}
                    </span>
                  )}
                </div>

                {client.notes && (
                  <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    "{client.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[#FDF9F5]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Pedidos
                  </span>
                  <span className="font-display font-bold text-sm text-slate-800 flex items-center justify-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#FF0080]" />
                    {client.ordersCount} ({client.totalUnits} u.)
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-pink-50/50">
                  <span className="text-[10px] font-bold uppercase text-[#FF0080] block">
                    Facturado
                  </span>
                  <span className="font-display font-bold text-sm text-slate-900">
                    {formatARS(client.totalSpent)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-sky-50/50">
                  <span className="text-[10px] font-bold uppercase text-sky-700 block">
                    Última Compra
                  </span>
                  <span className="font-bold text-xs text-slate-700">
                    {client.lastSaleDate ? formatShortDate(client.lastSaleDate) : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-pink-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF0080] to-[#00C2FF] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-display font-bold text-lg">
                {editingClient ? 'Editar Cliente' : 'Agregar Cliente a la Agenda'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Nombre y Apellido / Institución *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Valentina Gómez / Jardín..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    WhatsApp / Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 11 6707-2851"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Usuario Instagram
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Ej: @usuario"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Localidad / Zona
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: José C. Paz / San Miguel"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Notas / Preferencias de regalo
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Pide siempre tazas con fotos Polaroid, retira por Gaspar Campos..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF0080] text-white text-xs font-bold shadow-muggy"
                >
                  <Check className="w-4 h-4" />
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
