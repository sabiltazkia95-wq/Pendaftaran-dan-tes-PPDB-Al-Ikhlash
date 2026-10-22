import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { MonitorCheck, Clock, BookOpen, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StudentExamListProps {
  navigate: (path: string) => void;
  onSelectExam: (examId: string) => void;
}

export const StudentExamList: React.FC<StudentExamListProps> = ({ navigate, onSelectExam }) => {
  const { studentProfile } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [regStatus, setRegStatus] = useState<string>('draft');
  const [loading, setLoading] = useState(true);
  const [selectedForModal, setSelectedForModal] = useState<any | null>(null);
  const [agreedToRules, setAgreedToRules] = useState(false);

  useEffect(() => {
    api.getStudentExams()
      .then((res) => {
        setExams(res.exams || []);
        setIsEligible(res.is_eligible);
        setRegStatus(res.registration_status);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Memuat jadwal ujian CBT...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ujian Computer Based Test (CBT)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tes seleksi penerimaan santri baru berbasis daring dengan pengawasan sistem terpusat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status Kelayakan:</span>
          {isEligible ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Memenuhi Syarat
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Belum Terverifikasi
            </span>
          )}
        </div>
      </div>

      {!isEligible && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Pemberitahuan Kelayakan:</strong> Anda baru dapat mengikuti ujian CBT setelah formulir pendaftaran dan berkas persyaratan disetujui (status: <strong>Terverifikasi</strong>). Saat ini status Anda adalah <strong>{regStatus}</strong>.
          </div>
        </div>
      )}

      {/* Exam Cards */}
      <div className="space-y-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-[#B39DDB] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center shrink-0">
                  <MonitorCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{exam.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#5E35B1]" /> {exam.duration_minutes} Menit
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#5E35B1]" /> {exam.question_count} Butir Soal
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                {exam.description}
              </p>

              {/* Categories */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {exam.categories?.map((cat: any, i: number) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200"
                  >
                    {cat.name} ({cat.weight}%)
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sm:text-right shrink-0">
              {exam.is_completed ? (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Ujian Selesai Dikerjakan
                  </span>
                  <div>
                    <button
                      onClick={() => navigate('/student/results')}
                      className="text-xs text-[#5E35B1] font-semibold hover:underline block sm:text-right"
                    >
                      Lihat Hasil Seleksi →
                    </button>
                  </div>
                </div>
              ) : exam.has_active_attempt ? (
                <button
                  onClick={() => onSelectExam(exam.id)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  <MonitorCheck className="w-4 h-4 animate-pulse" />
                  <span>Lanjutkan Ujian (Sedang Berjalan)</span>
                </button>
              ) : isEligible ? (
                <button
                  onClick={() => {
                    setSelectedForModal(exam);
                    setAgreedToRules(false);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors"
                >
                  <span>Mulai Ujian CBT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed"
                >
                  Menunggu Verifikasi
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions & Agreement Modal */}
      {selectedForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tata Tertib & Petunjuk Pengerjaan Ujian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedForModal.title} · Durasi {selectedForModal.duration_minutes} Menit
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p><strong>Nama Peserta:</strong> {studentProfile?.full_name}</p>
              <p><strong>Nomor Peserta:</strong> {studentProfile?.registration_number}</p>
              <div className="border-t border-slate-200/60 pt-2 space-y-1.5">
                <p>1. Waktu pengerjaan akan dimulai saat Anda menekan tombol <strong>Mulai Ujian Sekarang</strong>.</p>
                <p>2. Timer hitung mundur terikat dengan waktu server dan tidak dapat dijeda (pause).</p>
                <p>3. Jawaban tersimpan secara otomatis setiap kali Anda memilih opsi atau mengetik esai.</p>
                <p>4. Gunakan tombol <strong>Ragu-ragu</strong> untuk menandai nomor yang ingin Anda tinjau kembali.</p>
                <p>5. Jika waktu habis, sistem akan otomatis mengumpulkan jawaban yang telah tersimpan di server.</p>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#5E35B1] rounded"
                />
                <span className="leading-snug">
                  Saya telah membaca, memahami, dan siap mematuhi tata tertib ujian secara jujur dan mandiri.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedForModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!agreedToRules}
                onClick={() => {
                  const examId = selectedForModal.id;
                  setSelectedForModal(null);
                  onSelectExam(examId);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs disabled:opacity-50 transition-colors"
              >
                Mulai Ujian Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
