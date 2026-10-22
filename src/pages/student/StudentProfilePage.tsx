import React, { useState } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { User, Lock, CheckCircle2, Shield } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!oldPassword) {
      setError('Masukkan kata sandi saat ini.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Profil & Keamanan Akun</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola informasi akun dan pengaturan keamanan kata sandi Anda.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400">Nama Pengguna</span>
            <div className="font-bold text-slate-800 text-sm">{user?.full_name}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400">Alamat Email</span>
            <div className="font-bold text-slate-800 text-sm">{user?.email}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400">Nomor WhatsApp</span>
            <div className="font-bold text-slate-800 text-sm">{user?.phone || '-'}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-400">Nomor Registrasi PPDB</span>
            <div className="font-bold font-mono text-[#5E35B1] text-sm">
              {studentProfile?.registration_number || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[#5E35B1]" />
          Ubah Kata Sandi
        </h3>

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Kata sandi Anda berhasil diperbarui.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-lg transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
          </button>
        </form>
      </div>
    </div>
  );
};
