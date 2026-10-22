import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Award, CheckCircle2, XCircle, Clock, Printer, AlertCircle } from 'lucide-react';

interface StudentResultPageProps {
  navigate: (path: string) => void;
}

export const StudentResultPage: React.FC<StudentResultPageProps> = ({ navigate }) => {
  const { studentProfile } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStudentResult()
      .then(setResult)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Memuat hasil seleksi...</div>;
  }

  if (!result || !result.has_result) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-purple-100 text-[#5E35B1] mx-auto flex items-center justify-center">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Hasil Seleksi Belum Diumumkan</h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          {result?.message || 'Proses seleksi dan penilaian esai sedang berlangsung. Pengumuman resmi akan dipublikasikan sesuai jadwal PPDB.'}
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-5 py-2 text-xs font-bold text-white bg-[#5E35B1] rounded-xl hover:bg-[#512DA8]"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPassed = result.selection_status === 'lulus';
  const isReserve = result.selection_status === 'cadangan';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pengumuman Kelulusan Seleksi PPDB</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pondok Pesantren Al-Ikhlash Tahun Ajaran 2027/2028
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Surat Kelulusan</span>
        </button>
      </div>

      {/* Official Certificate Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-slate-200 shadow-sm print:border-black print:p-6 print:shadow-none space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 border-slate-900 pb-6 space-y-1">
          <div className="w-16 h-16 rounded-xl mx-auto mb-2 border border-slate-200 p-1 bg-white">
            <img
              src="/src/assets/images/al_ikhlash_pesantren_logo_1792632707497.jpg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xs uppercase tracking-wider font-extrabold text-slate-500">
            PANITIA PENERIMAAN SANTRI BARU (PPDB)
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            PONDOK PESANTREN AL-IKHLASH
          </h1>
          <p className="text-xs text-slate-500">
            SURAT KEPUTUSAN KELULUSAN HASIL SELEKSI AKADEMIK & DINIYAH T.A. 2027/2028
          </p>
        </div>

        {/* Decision Banner */}
        <div className={`p-6 rounded-2xl text-center space-y-2 border ${
          isPassed
            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
            : isReserve
            ? 'bg-amber-50 text-amber-950 border-amber-300'
            : 'bg-rose-50 text-rose-950 border-rose-300'
        }`}>
          <div className="text-xs uppercase tracking-wider font-bold">
            Berdasarkan Rapat Pleno Panitia Seleksi, Peserta Dinyatakan:
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight">
            {isPassed ? 'LULUS SELEKSI' : isReserve ? 'CADANGAN' : 'BELUM MEMENUHI SYARAT'}
          </div>
          <p className="text-xs leading-relaxed max-w-md mx-auto">
            {isPassed
              ? 'Selamat! Calon santri diterima sebagai santri baru di Pondok Pesantren Al-Ikhlash.'
              : isReserve
              ? 'Peserta masuk ke dalam kuota cadangan dan akan dipanggil jika terdapat kuota yang mengundurkan diri.'
              : 'Mohon maaf, perolehan nilai seleksi belum memenuhi batas standar kelulusan minimum.'}
          </p>
        </div>

        {/* Student & Score Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">Identitas Calon Santri</h4>
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor Peserta:</span>
              <span className="font-mono font-bold text-[#5E35B1]">{result.student?.registration_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Lengkap:</span>
              <span className="font-bold text-slate-900">{result.student?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jenjang:</span>
              <span className="font-semibold text-slate-800">{result.student?.education_level}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">Rekapitulasi Nilai Seleksi</h4>
            <div className="flex justify-between">
              <span className="text-slate-500">Nilai CBT Objektif:</span>
              <span className="font-mono font-bold text-slate-800">{result.objective_score} / 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nilai Esai & Diniyah:</span>
              <span className="font-mono font-bold text-slate-800">{result.essay_score}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-700 font-bold">Skor Akhir Komposit:</span>
              <span className="font-mono font-extrabold text-sm text-[#5E35B1]">{result.final_score}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Batas Kelulusan (Passing Grade):</span>
              <span className="font-mono">{result.passing_grade}</span>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
          <div>
            <p>Ditetapkan di: Tasikmalaya</p>
            <p>Tanggal: {new Date(result.published_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="text-center space-y-12">
            <div>Ketua Panitia PPDB 2027/2028,</div>
            <div className="font-bold text-slate-900 underline">Ustadz Abdullah Faqih, M.Pd.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
