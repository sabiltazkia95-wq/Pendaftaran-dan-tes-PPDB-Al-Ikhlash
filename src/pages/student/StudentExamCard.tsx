import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Printer, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StudentExamCardProps {
  navigate: (path: string) => void;
}

export const StudentExamCard: React.FC<StudentExamCardProps> = ({ navigate }) => {
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getExamCard()
      .then(setCardData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Memuat kartu peserta...</div>;
  }

  if (!cardData) {
    return <div className="text-center py-12 text-xs text-slate-500">Data kartu tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kartu Peserta Ujian Seleksi CBT</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Wajib dicetak atau disimpan di ponsel dan ditunjukkan saat verifikasi pelaksanaan tes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Ujian</span>
          </button>
        </div>
      </div>

      {!cardData.is_verified && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 print:hidden">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Status pendaftaran Anda saat ini <strong>{cardData.status}</strong>. Kartu ini hanya berlaku resmi setelah seluruh berkas diverifikasi oleh panitia.
          </span>
        </div>
      )}

      {/* The Printable Digital Card */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-8 sm:p-10 shadow-sm print:border-black print:p-6 print:shadow-none relative overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-slate-300 bg-slate-50 p-1 flex items-center justify-center shrink-0">
              <img
                src="/src/assets/images/al_ikhlash_pesantren_logo_1792632707497.jpg"
                alt="Logo Al-Ikhlash"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-slate-500">
                PONDOK PESANTREN AL-IKHLASH
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                KARTU PESERTA UJIAN SELEKSI CBT
              </h1>
              <div className="text-xs font-semibold text-[#5E35B1] print:text-black">
                PENERIMAAN SANTRI BARU (PPDB) TAHUN AJARAN {cardData.academic_year}
              </div>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded border border-emerald-300">
              RESMI
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
          {/* Photo Column */}
          <div className="sm:col-span-4 flex flex-col items-center">
            <div className="w-36 h-48 rounded-xl border-2 border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center shadow-xs">
              {cardData.photo_url ? (
                <img
                  src={cardData.photo_url}
                  alt={cardData.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 text-xs text-slate-400">
                  <div className="text-2xl mb-1">👤</div>
                  Pas Foto Resmi (3x4)
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <span className="text-[11px] font-mono font-bold text-slate-600">
                {cardData.registration_number}
              </span>
            </div>
          </div>

          {/* Details Column */}
          <div className="sm:col-span-8 space-y-3 text-xs sm:text-sm">
            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500">Nomor Peserta:</span>
              <span className="col-span-2 font-mono font-black text-[#5E35B1] print:text-black text-base">
                {cardData.registration_number}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500">Nama Lengkap:</span>
              <span className="col-span-2 font-bold text-slate-900 text-sm sm:text-base">
                {cardData.full_name}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500">Pilihan Jenjang:</span>
              <span className="col-span-2 font-semibold text-slate-800">
                {cardData.education_level} (Pondok Pesantren Al-Ikhlash)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500">Asal Sekolah:</span>
              <span className="col-span-2 text-slate-800">{cardData.school_origin || '-'}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500">Materi Ujian CBT:</span>
              <span className="col-span-2 text-slate-800">
                Agama Islam, P. Umum, B. Indonesia, Matematika, B. Arab
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500">Jadwal Pelaksanaan:</span>
              <span className="col-span-2 font-bold text-slate-900">
                15 Mei 2027 (08.00 - 12.00 WIB) · Durasi 60 Menit
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer with QR Barcode */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-slate-500 max-w-md space-y-1">
            <p><strong>Tata Tertib:</strong></p>
            <p>1. Peserta wajib login menggunakan akun resmi sebelum ujian dimulai.</p>
            <p>2. Dilarang membuka catatan atau berkomunikasi dengan orang lain selama ujian berlangsung.</p>
            <p>3. Kartu ini merupakan bukti sah pendaftaran seleksi Pondok Pesantren Al-Ikhlash.</p>
          </div>

          {/* Clean SVG QR code simulation */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-24 h-24 p-1.5 border border-slate-300 rounded-lg bg-white flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-slate-900">
                {/* Visual authentic QR code pattern */}
                <rect x="0" y="0" width="30" height="30" rx="3" fill="#000" />
                <rect x="5" y="5" width="20" height="20" rx="2" fill="#fff" />
                <rect x="10" y="10" width="10" height="10" fill="#000" />

                <rect x="70" y="0" width="30" height="30" rx="3" fill="#000" />
                <rect x="75" y="5" width="20" height="20" rx="2" fill="#fff" />
                <rect x="80" y="10" width="10" height="10" fill="#000" />

                <rect x="0" y="70" width="30" height="30" rx="3" fill="#000" />
                <rect x="5" y="75" width="20" height="20" rx="2" fill="#fff" />
                <rect x="10" y="80" width="10" height="10" fill="#000" />

                <rect x="36" y="12" width="6" height="6" fill="#000" />
                <rect x="48" y="12" width="6" height="6" fill="#000" />
                <rect x="40" y="24" width="8" height="8" fill="#000" />
                <rect x="12" y="42" width="8" height="8" fill="#000" />
                <rect x="26" y="46" width="6" height="6" fill="#000" />
                <rect x="42" y="42" width="16" height="16" fill="#000" />
                <rect x="68" y="42" width="8" height="8" fill="#000" />
                <rect x="82" y="42" width="8" height="8" fill="#000" />
                <rect x="42" y="68" width="8" height="8" fill="#000" />
                <rect x="68" y="68" width="12" height="6" fill="#000" />
                <rect x="68" y="82" width="8" height="8" fill="#000" />
                <rect x="82" y="78" width="8" height="12" fill="#000" />
              </svg>
            </div>
            <span className="text-[9px] font-mono text-slate-400 mt-1">VERIFIED QR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
