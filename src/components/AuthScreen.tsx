import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Lock,
  LogIn,
  Mail,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useMuggy } from '../context/MuggyContext';

export const AuthScreen: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, disconnectSupabase, supabaseConfigSource } =
    useMuggy();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInWithEmail(email.trim(), password);
        if (!res.ok) {
          setErrorMsg(res.message);
        }
      } else {
        const res = await signUpWithEmail(email.trim(), password);
        if (!res.ok) {
          setErrorMsg(res.message);
        } else {
          setInfoMsg(res.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF6EC] via-[#FFEBF5] to-[#E6F9FF] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
        {/* Barra superior de colores Muggy */}
        <div className="h-2 flex">
          <div className="flex-1 bg-[#00C2FF]" />
          <div className="flex-1 bg-[#FFF04D]" />
          <div className="flex-1 bg-[#FF0080]" />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Logo y Mascota */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/assets/muggy-mascot.png"
                alt="Muggy Mascota"
                className="w-16 h-16 object-contain drop-shadow"
              />
              <img
                src="/assets/muggy-logo.png"
                alt="Muggy Logo"
                className="h-12 object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#0088CC] text-xs font-bold border border-sky-200 mt-1">
              <Cloud className="w-3.5 h-3.5" />
              Sincronización en la Nube Activa
            </div>

            <h1 className="font-display text-2xl font-bold text-slate-900 mt-3">
              Acceso Privado Muggy
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Iniciá sesión con la misma cuenta en tu PC y en tu celular para mantener todas tus ventas, costos y reportes sincronizados.
            </p>
          </div>

          {/* Selector Login / Primer Registro */}
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                mode === 'login'
                  ? 'bg-[#FF0080] text-white shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signup'
                  ? 'bg-[#00A8E8] text-white shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Crear Cuenta Dueño
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="muggy.tazas@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#FF0080] outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#FF0080] outline-none text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF0080] to-[#FF3399] hover:from-[#E60073] hover:to-[#FF0080] text-white font-display font-bold text-base shadow-muggy flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              {loading
                ? 'Conectando...'
                : mode === 'login'
                ? 'Entrar a Muggy Dashboard'
                : 'Registrar Cuenta Privada'}
            </button>
          </form>

          {supabaseConfigSource === 'local' && (
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={disconnectSupabase}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 underline"
              >
                Volver al modo local sin nube
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
