import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CheckCircle,
  FileText,
  Calendar,
  Clock,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  BookOpen,
  Award,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  School
} from 'lucide-react';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    api.getAnnouncements(true).then(setAnnouncements).catch(() => {});
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const faqs = [
    {
      q: 'Bagaimana alur pendaftaran santri baru secara online?',
      a: 'Pendaftaran dilakukan melalui 5 langkah: (1) Membuat akun calon santri dengan nomor WhatsApp dan email aktif; (2) Mengisi formulir data pribadi & orang tua; (3) Mengunggah berkas persyaratan (Pas foto, KK, Akta Kelahiran); (4) Menunggu verifikasi berkas oleh panitia; (5) Mengunduh kartu peserta dan mengikuti ujian CBT online.'
    },
    {
      q: 'Apakah pelaksanaan ujian seleksi CBT dilakukan secara daring?',
      a: 'Ya, seluruh ujian seleksi akademik dan diniyah berbasis Computer Based Test (CBT) diselenggarakan secara terpusat melalui portal PPDB ini dengan durasi 60 menit dan sistem penilaian objektif terintegrasi.'
    },
    {
      q: 'Dokumen apa saja yang wajib diunggah saat pendaftaran?',
      a: 'Dokumen wajib meliputi: Pas foto resmi terbaru (latar biru/merah), Kartu Keluarga (KK), Akta Kelahiran, dan Ijazah atau Surat Keterangan Lulus (SKL) bagi yang telah memiliki. Maksimal ukuran per berkas adalah 5MB dalam format JPG, PNG, atau PDF.'
    },
    {
      q: 'Kapan pengumuman hasil seleksi kelulusan dapat diakses?',
      a: 'Hasil seleksi kelulusan akan dipublikasikan secara serentak di dashboard calon santri dan halaman pengumuman resmi sesuai tanggal yang ditetapkan panitia (25 Mei 2027).'
    },
    {
      q: 'Apakah santri yang lulus wajib tinggal di asrama pondok?',
      a: 'Pondok Pesantren Al-Ikhlash mewajibkan seluruh santri jenjang SMP dan SMA/KMI untuk mukim (tinggal) di asrama pesantren demi pembinaan akhlak, disiplin ibadah 24 jam, dan penguasaan bahasa Arab serta bahasa Inggris.'
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F3EEFF]/60 via-white to-transparent pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#5E35B1] bg-[#F3EEFF] px-3 py-1.5 rounded-md border border-[#B39DDB]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#5E35B1]" />
                <span>Penerimaan Santri Baru Tahun Ajaran 2027/2028</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#29243A] tracking-tight leading-tight">
                Pondok Pesantren <br className="hidden sm:inline" />
                <span className="text-[#5E35B1]">Al-Ikhlash</span> Ciawi
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Menempa kader umat yang berakhlak mulia, hafal Al-Qur'an, unggul dalam sains dan bahasa internasional, serta berpegang teguh pada manhaj Ahlussunnah wal Jama'ah.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {user ? (
                  <button
                    onClick={() => {
                      if (user.role === 'admin') navigate('/admin/dashboard');
                      else if (user.role === 'committee') navigate('/committee/dashboard');
                      else navigate('/student/dashboard');
                    }}
                    className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <span>Masuk ke Dashboard ({user.role})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/register')}
                      className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      <span>Daftar Santri Baru</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-xs"
                    >
                      Login Calon Santri
                    </button>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">100%</div>
                  <div className="text-xs text-slate-500 font-medium">Sistem CBT Daring</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">A</div>
                  <div className="text-xs text-slate-500 font-medium">Akreditasi Unggul</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">30 Juz</div>
                  <div className="text-xs text-slate-500 font-medium">Program Tahfidz</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                <img
                  src="/src/assets/images/al_ikhlash_hero_campus_1792632707932.jpg"
                  alt="Kampus Pondok Pesantren Al-Ikhlash"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="text-xs uppercase tracking-wider text-amber-300 font-semibold mb-1">
                    Kampus Putra & Putri
                  </div>
                  <h3 className="text-lg font-bold">Lingkungan Asri & Kondusif</h3>
                  <p className="text-xs text-slate-200 mt-1">
                    Fasilitas masjid jami', laboratorium sains, perpustakaan digital, dan asrama representatif.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alur Pendaftaran Section */}
      <section id="alur-pendaftaran" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-[#5E35B1] uppercase tracking-wider">Tahapan Seleksi</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Alur Pendaftaran PPDB 2027/2028
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Proses seleksi penerimaan santri baru berlangsung transparan dan terintegrasi melalui portal digital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Buat Akun',
              desc: 'Registrasi mandiri dengan mengisi nama, email, nomor WhatsApp dan kata sandi.',
              icon: FileText
            },
            {
              step: '02',
              title: 'Lengkapi Data',
              desc: 'Isi biodata calon santri, data orang tua/wali, serta asal sekolah.',
              icon: GraduationCap
            },
            {
              step: '03',
              title: 'Unggah Berkas',
              desc: 'Unggah pas foto, Kartu Keluarga, dan Akta Kelahiran berformat digital.',
              icon: ShieldCheck
            },
            {
              step: '04',
              title: 'Ujian CBT',
              desc: 'Mengikuti ujian seleksi akademik dan diniyah berbasis komputer secara online.',
              icon: Award
            },
            {
              step: '05',
              title: 'Pengumuman',
              desc: 'Cek status kelulusan resmi dan unduh Surat Keputusan Kelulusan.',
              icon: CheckCircle
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#B39DDB] transition-all hover:shadow-md relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold font-mono text-[#5E35B1] bg-[#F3EEFF] px-2 py-1 rounded">
                      Langkah {item.step}
                    </span>
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-[#5E35B1] transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Program Pendidikan / Jenjang */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-[#5E35B1] uppercase tracking-wider">Jenjang Pendidikan</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Pilihan Tingkat Studi
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Tersedia kurikulum berkesinambungan dengan ijazah ganda (Kemenag/Kemendikbud & Pondok).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center mb-4">
                <School className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">SMP Al-Ikhlash</h3>
              <p className="text-xs font-medium text-[#5E35B1] mt-0.5">Masa Belajar 3 Tahun</p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Pendidikan tingkat menengah pertama yang memadukan kurikulum nasional merdeka dan pondok salafiyah. Target tahfidz minimal 5 juz mutqin.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">✓ Lulusan SD / MI Sederajat</div>
                <div className="flex items-center gap-2">✓ Asrama Putra & Putri Terpisah</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">SMA Unggulan Al-Ikhlash</h3>
              <p className="text-xs font-medium text-[#5E35B1] mt-0.5">Masa Belajar 3 Tahun</p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Fokus pada penguasaan sains, teknologi, riset, serta bimbingan intensif persiapan masuk perguruan tinggi negeri (PTN) dan universitas Timur Tengah.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">✓ Lulusan SMP / MTs Sederajat</div>
                <div className="flex items-center gap-2">✓ Jurusan MIPA & Keagamaan</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#F3EEFF] text-[#5E35B1] flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">KMI (Kulliyatul Mu'allimin)</h3>
              <p className="text-xs font-medium text-[#5E35B1] mt-0.5">Program 4 atau 6 Tahun</p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Pendidikan kader guru dan dai dengan penekanan bahasa Arab dan Inggris secara aktif serta penguasaan kitab-kitab turats (kitab kuning).
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">✓ Khusus Peminatan Tarbiyah & Da'wah</div>
                <div className="flex items-center gap-2">✓ Ijazah Muadalah Diakui Global</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Persyaratan & Jadwal */}
      <section id="persyaratan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Persyaratan Berkas */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-[#5E35B1]" />
              Persyaratan Berkas Pendaftaran
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-[#5E35B1]/10 text-[#5E35B1] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Pas Foto Resmi</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Pas foto berwarna ukuran 3x4 dengan latar belakang biru (putra berpeci, putri berjilbab putih).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-[#5E35B1]/10 text-[#5E35B1] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Kartu Keluarga (KK)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Scan dokumen asli atau fotokopi legalisir Kartu Keluarga yang masih berlaku.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-[#5E35B1]/10 text-[#5E35B1] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Akta Kelahiran</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Scan dokumen asli Akta Kelahiran calon santri dari Disdukcapil.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-[#5E35B1]/10 text-[#5E35B1] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Ijazah / SKL (Menyusul diperbolehkan)</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Ijazah jenjang sebelumnya atau Surat Keterangan Lulus dari sekolah asal.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Jadwal Pelaksanaan */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-[#5E35B1]" />
              Jadwal PPDB 2027/2028 (Gelombang 1)
            </h3>

            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#5E35B1] ring-4 ring-[#F3EEFF]" />
                <span className="text-xs font-mono font-semibold text-[#5E35B1]">1 Jan – 30 Apr 2027</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Pendaftaran & Unggah Berkas Online</h4>
                <p className="text-xs text-slate-600 mt-0.5">Pengisian formulir mandiri dan pengunggahan dokumen oleh calon santri.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-slate-100" />
                <span className="text-xs font-mono font-semibold text-slate-600">1 – 10 Mei 2027</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Verifikasi Berkas & Cetak Kartu CBT</h4>
                <p className="text-xs text-slate-600 mt-0.5">Pengecekan keabsahan dokumen oleh panitia dan penerbitan kartu peserta.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-slate-100" />
                <span className="text-xs font-mono font-semibold text-slate-600">15 Mei 2027</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Pelaksanaan Ujian CBT Online</h4>
                <p className="text-xs text-slate-600 mt-0.5">Tes akademik dan diniyah terintegrasi durasi 60 menit.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                <span className="text-xs font-mono font-semibold text-emerald-700">25 Mei 2027</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Pengumuman Kelulusan Resmi</h4>
                <p className="text-xs text-slate-600 mt-0.5">Publikasi hasil seleksi dan pengunduhan SKL.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Santri Activities Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#29243A] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Kehidupan Santri</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Pendidikan Karakter & Kedisiplinan 24 Jam
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Santri dibimbing untuk mandiri, mencintai Al-Qur'an dan Sunnah, serta dibekali penguasaan teknologi digital dan wawasan global.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">Kajian Kitab Kuning</span>
                <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">Bilingual Arabic & English</span>
                <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">Ekstrakurikuler Robotik & Panahan</span>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                <img
                  src="/src/assets/images/santri_learning_classroom_1792632708104.jpg"
                  alt="Kegiatan Belajar Santri"
                  referrerPolicy="no-referrer"
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-[#5E35B1] uppercase tracking-wider">Tanya Jawab</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm hover:text-[#5E35B1] focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F3EEFF] rounded-3xl p-8 sm:p-12 border border-[#B39DDB]/40 text-center max-w-3xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#29243A]">
            Siap Menjadi Bagian dari Keluarga Besar Al-Ikhlash?
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Pendaftaran Gelombang 1 Tahun Ajaran 2027/2028 kini telah dibuka. Segera daftarkan putra-putri tercinta Anda sebelum kuota terpenuhi.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 text-sm font-semibold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl transition-all shadow-md"
            >
              Daftar Santri Baru Sekarang
            </button>
            <button
              onClick={() => navigate('/announcements')}
              className="px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
            >
              Lihat Pengumuman Terkini
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
