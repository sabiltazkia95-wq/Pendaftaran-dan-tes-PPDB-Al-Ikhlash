import React, { useState } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Eye, EyeOff, Lock, Mail, Phone, User, CheckCircle2, ArrowRight } from 'lucide-react';

interface RegisterPageProps {
  navigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ regNumber: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!termsAccepted) {
      setError('Anda wajib menyetujui ketentuan dan kebijakan privasi PPDB.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        full_name: fullName,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
        terms_accepted: termsAccepted
      });

      setSuccessData({
        regNumber: res.registration_number,
        name: res.user.full_name
      });

      // Auto login
      login(res.token, res.user);

      // Auto redirect after short delay
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal. Silakan coba kembali.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
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
          Pendaftaran Santri Baru
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Tahun Ajaran 2027/2028 — Pondok Pesantren Al-Ikhlash
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {successData ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Registrasi Berhasil!</h3>
              <p className="text-xs text-slate-600">
                Selamat, akun calon santri atas nama <strong>{successData.name}</strong> telah berhasil dibuat.
              </p>
              <div className="bg-[#F3EEFF] p-3 rounded-xl border border-[#B39DDB]/40 inline-block">
                <div className="text-[11px] text-slate-500">Nomor Pendaftaran Resmi:</div>
                <div className="text-base font-extrabold font-mono text-[#5E35B1]">
                  {successData.regNumber}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Mengarahkan Anda ke Dashboard Calon Santri...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Calon Santri
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Sesuai akta kelahiran / ijazah"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Email Aktif
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
                        placeholder="email@domain.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor WhatsApp (Aktif)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="contoh: 08123456789"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-[#5E35B1] border-slate-300 rounded focus:ring-[#5E35B1]"
                    />
                    <span className="ml-2.5 leading-relaxed">
                      Saya menyatakan bahwa data yang diisi adalah benar dan menyetujui seluruh{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/privacy-policy')}
                        className="text-[#5E35B1] underline font-medium"
                      >
                        Ketentuan & Kebijakan Privasi PPDB
                      </button>{' '}
                      Pondok Pesantren Al-Ikhlash.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E35B1] disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Mendaftarkan Akun...' : 'Daftar Calon Santri Sekarang'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-500">
                Sudah memiliki akun?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-bold text-[#5E35B1] hover:text-[#512DA8]"
                >
                  Masuk di sini
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
