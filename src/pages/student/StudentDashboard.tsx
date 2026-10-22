import React, { useEffect, useState } from 'react';
import { api, RegistrationData, DocumentData, StudentProfileData } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import {
  FileText,
  UploadCloud,
  CreditCard,
  MonitorCheck,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Calendar
} from 'lucide-react';

interface StudentDashboardProps {
  navigate: (path: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ navigate }) => {
  const { user, studentProfile, registration, refreshUserData } = useAuth();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const regRes = await api.getRegistration();
        setDocuments(regRes.documents || []);
        const examRes = await api.getStudentExams();
        setExamData(examRes);
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const regStatus = registration?.status || 'draft';

  // Determine stage progression
  const getStageIndex = () => {
    if (regStatus === 'draft') return 1;
    if (regStatus === 'menunggu_verifikasi' || regStatus === 'perlu_perbaikan') return 2;
    if (regStatus === 'terverifikasi' || regStatus === 'siap_ujian') return 3;
    if (regStatus === 'sedang_ujian' || regStatus === 'ujian_selesai') return 4;
    if (regStatus === 'menunggu_pengumuman' || regStatus === 'lulus' || regStatus === 'tidak_lulus') return 5;
    return 1;
  };

  const currentStage = getStageIndex();

  const stages = [
    { title: 'Pembuatan Akun', desc: 'Akun Terdaftar' },
    { title: 'Formulir & Berkas', desc: 'Isi biodata & upload KK/Foto' },
    { title: 'Verifikasi Panitia', desc: 'Pemeriksaan keabsahan berkas' },
    { title: 'Ujian CBT Online', desc: 'Tes terpadu 60 menit' },
    { title: 'Hasil Seleksi', desc: 'Pengumuman kelulusan resmi' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-[#5E35B1] to-[#7E57C2] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-200 font-semibold">
                Portal Calon Santri Al-Ikhlash 2027/2028
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                Ahlan wa Sahlan, {user?.full_name}!
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-right">
              <div className="text-[10px] text-slate-200">Nomor Pendaftaran</div>
              <div className="text-base font-extrabold font-mono text-white">
                {studentProfile?.registration_number || 'PPDB-2027-....'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="text-xs text-white/90">
              Jenjang: <strong>{studentProfile?.education_level || 'SMP'}</strong>
            </div>
            <span className="text-white/40">·</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/90">Status Pendaftaran:</span>
              <StatusBadge status={regStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Pipeline Tracker */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-6">Tahapan Pendaftaran Anda</h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
          {stages.map((stage, idx) => {
            const stepNum = idx + 1;
            const isDone = currentStage > stepNum || (currentStage === 5 && regStatus === 'lulus');
            const isCurrent = currentStage === stepNum;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : isCurrent
                    ? 'bg-[#F3EEFF] border-[#B39DDB] text-[#5E35B1] ring-2 ring-[#B39DDB]/30'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold">Langkah {stepNum}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-[#5E35B1]" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                </div>
                <div className="text-xs font-bold truncate">{stage.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{stage.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Status Callout Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        {regStatus === 'draft' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Formulir Pendaftaran Masih Berupa Draft</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Silakan lengkapi biodata diri, data orang tua/wali, serta unggah dokumen Pas Foto & Kartu Keluarga untuk mengajukan verifikasi panitia.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/registration')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl whitespace-nowrap shadow-xs transition-colors"
            >
              <span>Lengkapi Formulir</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {regStatus === 'menunggu_verifikasi' && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Berkas Sedang Diverifikasi oleh Panitia</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Formulir pendaftaran dan berkas Anda telah berhasil diterima. Tim verifikator Pondok Pesantren Al-Ikhlash sedang meneliti keabsahan dokumen dalam kurun waktu 1-2 hari kerja. Harap memeriksa halaman ini secara berkala.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/student/documents')}
                  className="text-xs text-[#5E35B1] hover:underline font-semibold"
                >
                  Lihat Dokumen yang Diajukan →
                </button>
              </div>
            </div>
          </div>
        )}

        {regStatus === 'perlu_perbaikan' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-rose-900">Berkas Memerlukan Perbaikan</h4>
                <p className="text-xs text-slate-700 mt-1">
                  Catatan Panitia: <em>"{registration?.review_notes || 'Mohon periksa kembali kesesuaian dokumen Anda.'}"</em>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/documents')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl whitespace-nowrap shadow-xs transition-colors"
            >
              <span>Perbaiki Berkas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {['terverifikasi', 'siap_ujian'].includes(regStatus) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Berkas Terverifikasi — Siap Ujian CBT</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Selamat! Berkas Anda dinyatakan sah. Silakan unduh Kartu Peserta Ujian dan ikuti Ujian Seleksi Online CBT.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/student/exam-card')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl whitespace-nowrap transition-colors"
              >
                Cetak Kartu Ujian
              </button>
              <button
                onClick={() => navigate('/student/exams')}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl whitespace-nowrap shadow-xs transition-colors"
              >
                <MonitorCheck className="w-4 h-4" />
                <span>Mulai Ujian CBT</span>
              </button>
            </div>
          </div>
        )}

        {regStatus === 'sedang_ujian' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <MonitorCheck className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Sesi Ujian CBT Sedang Berlangsung</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Waktu ujian terus berjalan di server. Segera lanjutkan pengerjaan soal dan kumpulkan sebelum deadline berakhir.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/exams')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl whitespace-nowrap shadow-xs transition-colors"
            >
              <span>Lanjutkan Ujian</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {regStatus === 'ujian_selesai' && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Ujian Telah Selesai Dikerjakan</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Alhamdulillah, jawaban tes CBT Anda telah tersimpan dengan aman. Panitia sedang memproses penilaian esai dan rekapitulasi nilai akhir. Pengumuman resmi akan dipublikasikan sesuai jadwal.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/student/results')}
                  className="text-xs text-[#5E35B1] hover:underline font-semibold"
                >
                  Cek Status Pengumuman Hasil Seleksi →
                </button>
              </div>
            </div>
          </div>
        )}

        {regStatus === 'lulus' && (
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Award className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-base font-extrabold text-emerald-900">SELAMAT! ANDA DINYATAKAN LULUS SELEKSI</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Calon santri resmi diterima di Pondok Pesantren Al-Ikhlash Tahun Ajaran 2027/2028.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/results')}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl whitespace-nowrap shadow-xs transition-colors"
            >
              Lihat Surat Keputusan Kelulusan
            </button>
          </div>
        )}
      </div>

      {/* Grid of Shortcut Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/student/registration')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#B39DDB] text-left transition-all hover:shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center mb-3 group-hover:bg-[#5E35B1] group-hover:text-white transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Formulir Pendaftaran</h4>
          <p className="text-xs text-slate-500 mt-1">Biodata diri, alamat domisili, dan data orang tua/wali.</p>
        </button>

        <button
          onClick={() => navigate('/student/documents')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#B39DDB] text-left transition-all hover:shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center mb-3 group-hover:bg-[#5E35B1] group-hover:text-white transition-colors">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Berkas Persyaratan</h4>
          <p className="text-xs text-slate-500 mt-1">
            {documents.length} berkas terunggah ({documents.filter(d => d.verification_status === 'disetujui').length} disetujui).
          </p>
        </button>

        <button
          onClick={() => navigate('/student/exam-card')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#B39DDB] text-left transition-all hover:shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center mb-3 group-hover:bg-[#5E35B1] group-hover:text-white transition-colors">
            <CreditCard className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Kartu Peserta Ujian</h4>
          <p className="text-xs text-slate-500 mt-1">Kartu digital berbarcode resmi syarat mengikuti ujian CBT.</p>
        </button>
      </div>
    </div>
  );
};
