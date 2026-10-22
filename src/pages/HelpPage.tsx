import React from 'react';
import { HelpCircle, Phone, Mail, MapPin, Clock, MessageSquare, AlertCircle } from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <span className="text-xs font-semibold text-[#5E35B1] uppercase tracking-wider">Pusat Layanan</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Bantuan & Panduan PPDB 2027/2028
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Informasi kontak resmi panitia, petunjuk teknis aplikasi, dan solusi kendala pendaftaran.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center mb-3">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Hotline WhatsApp Panitia</h3>
          <p className="text-xs text-slate-500 mt-1">Layanan cepat tanya jawab pendaftaran dan verifikasi.</p>
          <div className="mt-3 text-sm font-extrabold text-[#5E35B1] font-mono">
            +62 812-3456-7890
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Senin – Sabtu, 08.00 – 16.00 WIB</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center mb-3">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Layanan Email Resmi</h3>
          <p className="text-xs text-slate-500 mt-1">Pengajuan kendala akun, reset sesi, atau konfirmasi resmi.</p>
          <div className="mt-3 text-sm font-extrabold text-[#5E35B1] font-mono">
            ppdb@alikhlash.sch.id
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Balasan maksimal 1x24 jam kerja</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Panduan Teknis Pelaksanaan Ujian CBT
        </h3>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>1. Perangkat yang Didukung:</strong> Ujian Computer Based Test (CBT) dapat dikerjakan menggunakan Laptop, Komputer Desktop, maupun Smartphone dengan peramban modern (Google Chrome, Mozilla Firefox, Safari, Edge). Pastikan koneksi internet stabil selama pengerjaan.
          </p>
          <p>
            <strong>2. Sinkronisasi Jawaban Otomatis:</strong> Jawaban yang Anda pilih pada soal pilihan ganda maupun esai langsung tersimpan ke server secara otomatis. Tanda hijau pada nomor soal menunjukkan jawaban telah aman tersimpan di pangkalan data.
          </p>
          <p>
            <strong>3. Waktu Pengerjaan Terpusat:</strong> Timer hitung mundur dihitung berdasarkan jam server pesantren (WIB). Apabila waktu habis, sistem secara otomatis mengumpulkan jawaban terakhir yang berhasil diterima server.
          </p>
          <p>
            <strong>4. Jika Koneksi Terputus:</strong> Anda tidak perlu panik. Segera muat ulang (refresh) halaman setelah koneksi internet kembali normal. Sesi ujian dan sisa waktu Anda akan dipulihkan secara otomatis.
          </p>
        </div>
      </div>
    </div>
  );
};
