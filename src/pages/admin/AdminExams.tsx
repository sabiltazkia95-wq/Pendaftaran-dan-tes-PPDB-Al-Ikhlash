import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Calendar, Clock, Percent, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const AdminExams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      const data = await api.getExamsConfig();
      setExams(data);
      if (data.length > 0) {
        setEditingExam(JSON.parse(JSON.stringify(data[0])));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleCategoryWeightChange = (catId: string, weight: number) => {
    if (!editingExam) return;
    const updatedCats = editingExam.categories.map((c: any) =>
      c.id === catId ? { ...c, weight: Number(weight) } : c
    );
    setEditingExam({
      ...editingExam,
      categories: updatedCats
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;

    setError(null);
    setSuccess(null);

    const sum = editingExam.categories.reduce((acc: number, c: any) => acc + Number(c.weight || 0), 0);
    if (sum !== 100) {
      setError(`Total bobot kategori harus tepat 100%! Saat ini total berjumlah ${sum}%.`);
      return;
    }

    try {
      await api.updateExamConfig(editingExam.id, {
        title: editingExam.title,
        description: editingExam.description,
        duration_minutes: Number(editingExam.duration_minutes),
        status: editingExam.status,
        categories: editingExam.categories
      });
      setSuccess('Pengaturan durasi dan bobot nilai ujian berhasil diperbarui.');
      await loadExams();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengaturan.');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Memuat konfigurasi ujian...</div>;
  }

  const currentSum = editingExam?.categories?.reduce((acc: number, c: any) => acc + Number(c.weight || 0), 0) || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Jadwal & Pembobotan Nilai Ujian CBT</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi durasi pengerjaan, status aktif, dan komposisi bobot kategori (total wajib 100%).
          </p>
        </div>

        <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold ${
          currentSum === 100
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          Total Bobot: {currentSum}% {currentSum === 100 ? '✓ Tepat' : '⚠ Belum 100%'}
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {editingExam && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Umum Ujian
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Ujian Seleksi</label>
              <input
                type="text"
                required
                value={editingExam.title}
                onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Durasi Ujian (Menit)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    required
                    value={editingExam.duration_minutes}
                    onChange={(e) => setEditingExam({ ...editingExam, duration_minutes: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Ujian</label>
                <select
                  value={editingExam.status}
                  onChange={(e) => setEditingExam({ ...editingExam, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="aktif">Aktif (Peserta Dapat Mulai)</option>
                  <option value="draft">Draf (Belum Dapat Diakses)</option>
                  <option value="selesai">Selesai (Ditutup)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categories Weights Configuration */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Komposisi Bobot Kategori Penilaian</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan akumulasi persentase bobot bernilai tepat 100%.
              </p>
            </div>

            <div className="space-y-3">
              {editingExam.categories?.map((cat: any) => (
                <div
                  key={cat.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div className="font-semibold text-xs text-slate-800">{cat.name}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={cat.weight}
                      onChange={(e) => handleCategoryWeightChange(cat.id, Number(e.target.value))}
                      className="w-20 px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-bold text-right"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi Ujian</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
