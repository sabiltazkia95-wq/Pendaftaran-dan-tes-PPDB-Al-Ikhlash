import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import {
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  MonitorCheck,
  FileText,
  ClipboardList,
  ArrowRight
} from 'lucide-react';

interface CommitteeDashboardProps {
  navigate: (path: string) => void;
}

export const CommitteeDashboard: React.FC<CommitteeDashboardProps> = ({ navigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentApplicants, setRecentApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCommitteeStats(),
      api.getApplicants()
    ])
      .then(([statsRes, applicantsRes]) => {
        setStats(statsRes);
        setRecentApplicants(applicantsRes.slice(0, 5));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Memuat data panitia...</div>;
  }

  const kpis = [
    { label: 'Total Pendaftar', value: stats?.totalApplicants ?? 0, icon: Users, color: 'text-slate-900', bg: 'bg-slate-100' },
    { label: 'Menunggu Verifikasi', value: stats?.waitingVerification ?? 0, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100' },
    { label: 'Perlu Perbaikan', value: stats?.needsRevision ?? 0, icon: AlertCircle, color: 'text-rose-700', bg: 'bg-rose-100' },
    { label: 'Siap Ujian CBT', value: stats?.readyForExam ?? 0, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Ujian Selesai', value: stats?.examCompleted ?? 0, icon: MonitorCheck, color: 'text-blue-700', bg: 'bg-blue-100' },
    { label: 'Esai Belum Dinilai', value: stats?.ungradedEssays ?? 0, icon: ClipboardList, color: 'text-[#5E35B1]', bg: 'bg-[#F3EEFF]' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 truncate">{kpi.label}</span>
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className={`text-xl font-black font-mono ${kpi.color}`}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Main Action Banner */}
      <div className="bg-[#F3EEFF] rounded-2xl p-6 border border-[#B39DDB]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-[#5E35B1] tracking-wider">Tugas Prioritas Panitia</span>
          <h3 className="text-base font-extrabold text-[#29243A] mt-0.5">
            Terdapat {stats?.waitingVerification ?? 0} pendaftar menunggu verifikasi dokumen
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Segera periksa kelengkapan Pas Foto, KK, dan Akta Kelahiran agar calon santri dapat mencetak kartu CBT.
          </p>
        </div>

        <button
          onClick={() => navigate('/committee/applicants')}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl whitespace-nowrap shadow-xs transition-colors shrink-0"
        >
          <span>Mulai Verifikasi Berkas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recent Applicants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pendaftar Terbaru</h3>
            <p className="text-xs text-slate-500 mt-0.5">5 calon santri yang mendaftar paling akhir.</p>
          </div>
          <button
            onClick={() => navigate('/committee/applicants')}
            className="text-xs font-semibold text-[#5E35B1] hover:underline"
          >
            Lihat Semua Pendaftar →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold">No. Pendaftaran</th>
                <th className="py-3 px-4 font-semibold">Nama Lengkap</th>
                <th className="py-3 px-4 font-semibold">Jenjang</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Dokumen</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApplicants.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#5E35B1]">{app.registration_number}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{app.full_name}</td>
                  <td className="py-3 px-4 text-slate-600">{app.education_level}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {app.documents_approved} / {app.documents_count} Disetujui
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate('/committee/applicants')}
                      className="px-3 py-1 bg-slate-100 hover:bg-[#5E35B1] hover:text-white rounded text-xs font-medium transition-colors"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
