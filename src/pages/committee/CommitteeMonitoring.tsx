import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { MonitorCheck, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

export const CommitteeMonitoring: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const data = await api.getExamMonitoring();
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000); // Polling every 5 seconds for live status
    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (sec: number) => {
    if (sec <= 0) return '00:00:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Monitoring Sesi Ujian CBT Real-Time</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau durasi sisa waktu, progres penyimpanan jawaban, dan kelancaran ujian peserta.
          </p>
        </div>

        <button
          onClick={loadSessions}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Memuat sesi ujian...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
          Belum ada sesi ujian yang berjalan saat ini.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">No. Pendaftaran</th>
                  <th className="py-3 px-4 font-semibold">Nama Santri</th>
                  <th className="py-3 px-4 font-semibold">Ujian</th>
                  <th className="py-3 px-4 font-semibold">Status Pengerjaan</th>
                  <th className="py-3 px-4 font-semibold">Sisa Waktu</th>
                  <th className="py-3 px-4 font-semibold">Progres Jawaban</th>
                  <th className="py-3 px-4 font-semibold text-right">Skor Objektif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#5E35B1]">{sess.registration_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{sess.student_name}</td>
                    <td className="py-3 px-4 text-slate-600">{sess.exam_title}</td>
                    <td className="py-3 px-4">
                      {sess.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Sedang Mengerjakan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Selesai Dikumpulkan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {sess.status === 'in_progress' ? (
                        <span className={sess.remaining_seconds < 300 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}>
                          {formatSeconds(sess.remaining_seconds)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {sess.answered_count} Soal Tersimpan
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {sess.objective_score !== null ? `${sess.objective_score} / 100` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
