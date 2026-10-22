import React from 'react';
import { Shield, Lock, FileCheck, UserCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <span className="text-xs font-semibold text-[#5E35B1] uppercase tracking-wider">Keamanan & Privasi</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Kebijakan Privasi Data Calon Santri
        </h1>
        <p className="text-xs text-slate-500 mt-1">Terakhir diperbarui: 1 Januari 2027</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#5E35B1]" />
            1. Komitmen Perlindungan Data
          </h2>
          <p>
            Pondok Pesantren Al-Ikhlash berkomitmen penuh untuk melindungi privasi seluruh data pribadi calon santri dan orang tua/wali yang dihimpun melalui sistem PPDB Online Tahun Ajaran 2027/2028 sesuai peraturan perundang-undangan perlindungan data pribadi yang berlaku di Indonesia.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#5E35B1]" />
            2. Data yang Dikumpulkan
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Identitas diri: Nama lengkap, Nomor Induk Kependudukan (NIK), tempat & tanggal lahir, jenis kelamin.</li>
            <li>Identitas orang tua/wali: Nama ayah/ibu, nomor telepon/WhatsApp, alamat tempat tinggal.</li>
            <li>Dokumen pendukung: Pas foto digital, scan Kartu Keluarga, Akta Kelahiran, dan dokumen pendidikan.</li>
            <li>Data pelaksanaan ujian: Jawaban tes CBT online, riwayat pengerjaan, dan catatan penilaian panitia.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#5E35B1]" />
            3. Penggunaan dan Keamanan Informasi
          </h2>
          <p>
            Seluruh data yang Anda berikan hanya digunakan secara internal untuk verifikasi berkas, penerbitan kartu peserta, pelaksanaan ujian Computer Based Test (CBT), dan penentuan kelulusan seleksi. Dokumen yang diunggah disimpan di penyimpanan privat (private storage) dan tidak pernah dipublikasikan secara umum.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#5E35B1]" />
            4. Hak Akses Pemilik Data
          </h2>
          <p>
            Calon santri dan wali santri berhak memeriksa, memperbarui data biodata, dan mengajukan perbaikan dokumen selama tahapan pendaftaran masih berstatus draft atau dalam periode perbaikan yang ditentukan oleh panitia seleksi.
          </p>
        </section>
      </div>
    </div>
  );
};
