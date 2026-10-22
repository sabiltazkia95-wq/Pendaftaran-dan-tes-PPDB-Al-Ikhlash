import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Award, Globe, CheckCircle2, Lock, Unlock, AlertCircle } from 'lucide-react';

export const AdminResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadResults = async () => {
    try {
      const data = await api.getAdminResults();
      setResults(data);
      const anyPublished = data.some((r: any) => r.is_published);
      setIsPublished(anyPublished);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const handleTogglePublish = async () => {
    const nextState = !isPublished;
    const confirmMsg = nextState
      ? 'Apakah Anda yakin ingin MEMPUBLIKASIKAN hasil seleksi kepada seluruh calon santri?'
      : 'Apakah Anda yakin ingin MENARIK KEMBALI publikasi hasil seleksi?';

    if (!confirm(confirmMsg)) return;

    try {
      const res = await api.publishResults(nextState);
      setIsPublished(nextState);
      setMessage(res.message);
      await loadResults();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status publikasi.');
    }
  };

  const handleStatusChange = async (resultId: string, newStatus: string) => {
    try {
      await api.updateResultStatus(resultId, newStatus);
      await loadResults();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Rekapitulasi Nilai & Penetapan Kelulusan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Komposit nilai objektif CBT & esai diniyah serta kendali publikasi resmi ke calon santri.
          </p>
        </div>

        <button
          onClick={handleTogglePublish}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-colors ${
            isPublished
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isPublished ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          <span>{isPublished ? 'Tarik Publikasi Hasil' : 'Publikasikan Hasil ke Calon Santri'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Publication Status Notice */}
      <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-4 ${
        isPublished
          ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
          : 'bg-amber-50 text-amber-950 border-amber-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 shrink-0" />
          <div>
            <strong>Status Publikasi Saat Ini:</strong>{' '}
            {isPublished ? 'HASIL RESMI DIPUBLIKASIKAN' : 'BELUM DIPUBLIKASIKAN (Draft Internal)'}
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isPublished
                ? 'Calon santri dapat melihat status kelulusan dan mengunduh surat keputusan di dashboard masing-masing.'
                : 'Calon santri melihat status "Menunggu Pengumuman". Nilai masih dapat diubah dan ditinjau panitia.'}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Memuat rekap hasil...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">Belum ada hasil ujian yang terdata.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">No. Pendaftaran</th>
                  <th className="py-3 px-4 font-semibold">Nama Santri</th>
                  <th className="py-3 px-4 font-semibold">Jenjang</th>
                  <th className="py-3 px-4 font-semibold">Skor CBT (70%)</th>
                  <th className="py-3 px-4 font-semibold">Skor Esai (30%)</th>
                  <th className="py-3 px-4 font-semibold">Nilai Akhir</th>
                  <th className="py-3 px-4 font-semibold text-right">Keputusan Kelulusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#5E35B1]">{res.registration_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{res.student_name}</td>
                    <td className="py-3 px-4 text-slate-600">{res.education_level}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">{res.objective_score} / 100</td>
                    <td className="py-3 px-4 font-mono text-slate-800">{res.essay_score}</td>
                    <td className="py-3 px-4 font-mono font-black text-sm text-[#5E35B1]">
                      {res.final_score}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={res.selection_status}
                        onChange={(e) => handleStatusChange(res.id, e.target.value)}
                        className={`py-1 px-2.5 text-xs font-bold rounded-lg border ${
                          res.selection_status === 'lulus'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : res.selection_status === 'cadangan'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="lulus">LULUS</option>
                        <option value="cadangan">CADANGAN</option>
                        <option value="tidak_lulus">TIDAK LULUS</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
