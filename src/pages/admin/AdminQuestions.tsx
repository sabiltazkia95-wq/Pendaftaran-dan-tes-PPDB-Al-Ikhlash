import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { BookOpen, Plus, Trash2, CheckCircle2, ToggleLeft, ToggleRight, X, AlertCircle } from 'lucide-react';

export const AdminQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'essay'>('multiple_choice');
  const [points, setPoints] = useState(10);
  const [difficulty, setDifficulty] = useState('sedang');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  const loadData = async () => {
    try {
      const data = await api.getQuestions();
      setQuestions(data.questions);
      setCategories(data.categories);
      if (data.categories.length > 0 && !categoryId) {
        setCategoryId(data.categories[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createQuestion({
        category_id: categoryId,
        question_text: questionText,
        question_type: questionType,
        points,
        difficulty,
        options: questionType === 'multiple_choice' ? options : [],
        correct_option_index: correctOptionIdx
      });
      setSuccess('Soal baru berhasil ditambahkan ke bank soal.');
      setShowAddModal(false);
      setQuestionText('');
      setOptions(['', '', '', '']);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat soal.');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleQuestion(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status soal.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus soal ini dari bank soal?')) return;
    try {
      await api.deleteQuestion(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus soal.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bank Soal Ujian Seleksi CBT</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola soal pilihan ganda & esai terpadu beserta kunci jawaban terlindungi.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setError(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Soal Baru</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const count = questions.filter((q) => q.category_id === c.id).length;
          return (
            <div
              key={c.id}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-700 flex items-center gap-2"
            >
              <span>{c.name}</span>
              <span className="font-mono text-[10px] text-[#5E35B1] bg-[#F3EEFF] px-1.5 py-0.5 rounded">
                {count} Soal · {c.weight}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Memuat bank soal...</div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            Bank soal masih kosong. Silakan tambahkan soal pertama.
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-5 border transition-all ${
                q.is_active ? 'border-slate-200 shadow-xs' : 'border-slate-200/60 opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs bg-[#F3EEFF] text-[#5E35B1] px-2 py-0.5 rounded">
                    No. {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{q.category_name}</span>
                  <span className="text-[11px] text-slate-400 capitalize">· {q.question_type.replace('_', ' ')}</span>
                  <span className="text-[11px] text-slate-400">· {q.points} Poin</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(q.id)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title={q.is_active ? 'Nonaktifkan Soal' : 'Aktifkan Soal'}
                  >
                    {q.is_active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm font-medium text-slate-900 mb-3 leading-relaxed">
                {q.question_text}
              </div>

              {q.question_type === 'multiple_choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options?.map((opt: any, optIdx: number) => {
                    const isCorrect = opt.id === q.correct_option_id;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-semibold'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="w-5 h-5 rounded text-[11px] font-bold bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <span className="truncate">{opt.option_text}</span>
                        {isCorrect && (
                          <span className="ml-auto text-[10px] text-emerald-700 font-bold">KUNCI JAWABAN</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Buat Butir Soal Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Ujian</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Soal</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="multiple_choice">Pilihan Ganda (Objektif)</option>
                    <option value="essay">Uraian / Esai (Subjektif)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pertanyaan Soal</label>
                <textarea
                  rows={3}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Tuliskan teks pertanyaan soal secara lengkap..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
                />
              </div>

              {questionType === 'multiple_choice' && (
                <div className="space-y-2.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilihan Jawaban & Tentukan Kunci Jawaban Benar:
                  </label>
                  {options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-slate-100 text-xs font-bold flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[i] = e.target.value;
                            setOptions(newOpts);
                          }}
                          placeholder={`Pilihan ${letter}`}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer shrink-0">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={correctOptionIdx === i}
                            onChange={() => setCorrectOptionIdx(i)}
                            className="text-[#5E35B1]"
                          />
                          <span className="text-[11px] font-semibold text-emerald-700">Kunci Benar</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bobot Poin</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs"
                >
                  Simpan ke Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
