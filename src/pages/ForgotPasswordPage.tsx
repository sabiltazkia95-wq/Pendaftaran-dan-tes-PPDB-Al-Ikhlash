import React, { useState } from 'react';
import { api } from '../lib/api.ts';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordPageProps {
  navigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      // Show success anyway for security
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Login</span>
          </button>

          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Lupa Kata Sandi?
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Masukkan alamat email yang Anda gunakan saat mendaftar. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
          </p>

          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Email Pemulihan Terkirim</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Silakan periksa kotak masuk atau folder spam email Anda untuk instruksi penggantian kata sandi baru.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full mt-4 py-2 px-4 text-xs font-bold text-white bg-[#5E35B1] rounded-lg hover:bg-[#512DA8]"
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email Akun
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
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-lg shadow-xs transition-colors"
              >
                {loading ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
