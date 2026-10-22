import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { ClipboardList, CheckCircle2, Clock, Check, Save } from 'lucide-react';

export const CommitteeEssays: React.FC = () => {
  const [essays, setEssays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEssay, setSelectedEssay] = useState<any | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(0);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadEssays = async () => {
    try {
      const data = await api.getEssaysForGrading();
      setEssays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEssays();
  }, []);

  const openGrading = (essay: any) => {
    setSelectedEssay(essay);
    setScoreInput(essay.score !== null ? essay.score : 15);
    setFeedbackInput(essay.feedback || 'Jawaban cukup baik dan mencerminkan motivasi positif.');
    setSuccessMsg(null);
  };

  const handleSaveGrade = async () => {
    if (!selectedEssay) return;
    setSaving(true);
    try {
      await api.gradeEssay({
        attempt_id: selectedEssay.attempt_id,
        question_id: selectedEssay.question_id,
        score: Number(scoreInput),
        feedback: feedbackInput
      });
      setSuccessMsg('Penilaian esai berhasil disimpan dan nilai komposit diperbarui.');
      await loadEssays();
      setTimeout(() => setSelectedEssay(null), 1500);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan nilai.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Penilaian Soal Esai CBT</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi jawaban uraian subjektif, motivasi santri, dan pemahaman diniyah.
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-[#5E35B1] bg-[#F3EEFF] px-3 py-1.5 rounded-lg border border-[#B39DDB]/30">
          {essays.filter((e) => !e.is_graded).length} Menunggu Penilaian
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Memuat jawaban esai...</div>
      ) : essays.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
          Belum ada jawaban esai yang dikumpulkan oleh calon santri.
        </div>
      ) : (
        <div className="space-y-4">
          {essays.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-[#B39DDB] transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-[#5E35B1] bg-[#F3EEFF] px-2.5 py-1 rounded">
                    {item.registration_number}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{item.student_name}</span>
                  {item.is_graded ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Dinilai: {item.score} / {item.max_points} Poin
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Belum Dinilai
                    </span>
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-800">
                  Pertanyaan: <span className="font-normal text-slate-600">{item.question_text}</span>
                </div>

                {/* Student's written answer */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Jawaban Santri:
                  </span>
                  {item.essay_answer || '— (Tidak ada jawaban tertulis)'}
                </div>

                {item.is_graded && item.feedback && (
                  <div className="text-xs text-slate-500 italic">
                    Catatan Penilai: "{item.feedback}"
                  </div>
                )}
              </div>

              <div className="shrink-0 pt-2">
                <button
                  onClick={() => openGrading(item)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors"
                >
                  {item.is_graded ? 'Ubah Penilaian' : 'Beri Nilai Esai'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grading Modal */}
      {selectedEssay && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Formulir Penilaian Esai</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedEssay.student_name} ({selectedEssay.registration_number})
              </p>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-2">
              <div className="font-bold text-slate-900">{selectedEssay.question_text}</div>
              <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                "{selectedEssay.essay_answer}"
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skor yang Diberikan (Maksimal {selectedEssay.max_points} Poin):
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedEssay.max_points}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan & Umpan Balik Penguji:
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Berikan catatan penilaian..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEssay(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveGrade}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan Nilai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
