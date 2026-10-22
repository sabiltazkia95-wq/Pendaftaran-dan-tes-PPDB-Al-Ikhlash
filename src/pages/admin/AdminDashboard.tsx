import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import {
  Users,
  CheckCircle2,
  BookOpen,
  Award,
  Shield,
  FileCheck,
  Calendar,
  Settings,
  ArrowRight
} from 'lucide-react';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats()
      .then(setStats)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Memuat statistik administrator...</div>;
  }

  const cards = [
    { label: 'Total Pengguna Terdaftar', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-slate-900', bg: 'bg-slate-100' },
    { label: 'Calon Santri', value: stats?.studentsCount ?? 0, icon: Users, color: 'text-[#5E35B1]', bg: 'bg-[#F3EEFF]' },
    { label: 'Staf & Panitia', value: (stats?.committeeCount ?? 0) + (stats?.adminCount ?? 0), icon: Shield, color: 'text-indigo-700', bg: 'bg-indigo-100' },
    { label: 'Pendaftar Terverifikasi', value: stats?.verifiedCount ?? 0, icon: FileCheck, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Total Bank Soal CBT', value: stats?.totalQuestions ?? 0, icon: BookOpen, color: 'text-amber-700', bg: 'bg-amber-100' },
    { label: 'Santri Lulus Seleksi', value: stats?.passedCount ?? 0, icon: Award, color: 'text-emerald-700', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 truncate">{c.label}</span>
                <div className={`w-7 h-7 rounded-lg ${c.bg} ${c.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className={`text-xl font-black font-mono ${c.color}`}>{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Manajemen Pengguna & Staf</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Atur wewenang pengguna, buat akun panitia baru, dan pantau seluruh pendaftar.
          </p>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#5E35B1] hover:underline pt-2"
          >
            <span>Kelola Pengguna</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Bank Soal & Bobot Nilai</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kelola soal pilihan ganda, esai diniyah, kunci jawaban terlindungi, dan bobot kategori (100%).
          </p>
          <button
            onClick={() => navigate('/admin/questions')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#5E35B1] hover:underline pt-2"
          >
            <span>Buka Bank Soal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Hasil & Keputusan Kelulusan</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Rekap nilai akhir komposit dan kendalikan status publikasi resmi ke portal calon santri.
          </p>
          <button
            onClick={() => navigate('/admin/results')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#5E35B1] hover:underline pt-2"
          >
            <span>Rekap & Publikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
