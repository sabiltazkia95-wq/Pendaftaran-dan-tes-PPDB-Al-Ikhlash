import React, { useState } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, GraduationCap, UserCheck } from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login, switchAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      login(res.token, res.user);

      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.user.role === 'committee') {
        navigate('/committee/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'student' | 'committee' | 'admin') => {
    setLoading(true);
    setError(null);
    try {
      await switchAccount(role);
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'committee') navigate('/committee/dashboard');
      else navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal login demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mx-auto w-12 h-12 rounded-2xl overflow-hidden border border-[#B39DDB]/40 bg-[#F3EEFF] p-1 flex items-center justify-center shadow-xs focus:outline-none"
        >
          <img
            src="/src/assets/images/al_ikhlash_pesantren_logo_1792632707497.jpg"
            alt="Logo Al-Ikhlash"
            className="w-full h-full object-contain"
          />
        </button>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-[#29243A]">
          Masuk ke Portal PPDB
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Pondok Pesantren Al-Ikhlash Tahun Ajaran 2027/2028
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: santri@alikhlash.sch.id"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#5E35B1] border-slate-300 rounded focus:ring-[#5E35B1]"
                />
                <span className="ml-2">Ingat sesi saya</span>
              </label>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="font-medium text-[#5E35B1] hover:text-[#512DA8]"
              >
                Lupa kata sandi?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E35B1] disabled:opacity-60 transition-colors"
            >
              {loading ? 'Memproses...' : 'Masuk ke Portal'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Logins Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2.5 text-center">
              Akses Cepat Pengujian (1-Klik Masuk):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="p-2 text-center rounded-lg border border-slate-200 hover:border-[#5E35B1] hover:bg-[#F3EEFF]/40 text-slate-700 transition-colors"
              >
                <GraduationCap className="w-4 h-4 mx-auto text-[#5E35B1] mb-1" />
                <div className="text-[11px] font-bold">Santri</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('committee')}
                className="p-2 text-center rounded-lg border border-slate-200 hover:border-[#5E35B1] hover:bg-[#F3EEFF]/40 text-slate-700 transition-colors"
              >
                <UserCheck className="w-4 h-4 mx-auto text-[#5E35B1] mb-1" />
                <div className="text-[11px] font-bold">Panitia</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2 text-center rounded-lg border border-slate-200 hover:border-[#5E35B1] hover:bg-[#F3EEFF]/40 text-slate-700 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 mx-auto text-[#5E35B1] mb-1" />
                <div className="text-[11px] font-bold">Admin</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Belum memiliki akun calon santri?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-[#5E35B1] hover:text-[#512DA8]"
            >
              Daftar Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
