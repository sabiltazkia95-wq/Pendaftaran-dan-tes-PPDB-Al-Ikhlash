import React, { useState, useEffect } from 'react';
import { api, StudentProfileData } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Save, Send, CheckCircle2, User, Home, ArrowRight, ArrowLeft } from 'lucide-react';

interface StudentRegistrationFormProps {
  navigate: (path: string) => void;
}

export const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ navigate }) => {
  const { studentProfile, registration, refreshUserData } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    birth_place: '',
    birth_date: '',
    gender: 'L',
    nik: '',
    address: '',
    school_origin: '',
    education_level: 'SMP',
    parent_name: '',
    parent_phone: ''
  });

  useEffect(() => {
    if (studentProfile) {
      setFormData({
        birth_place: studentProfile.birth_place || '',
        birth_date: studentProfile.birth_date || '',
        gender: studentProfile.gender || 'L',
        nik: studentProfile.nik || '',
        address: studentProfile.address || '',
        school_origin: studentProfile.school_origin || '',
        education_level: studentProfile.education_level || 'SMP',
        parent_name: studentProfile.parent_name || '',
        parent_phone: studentProfile.parent_phone || ''
      });
    }
  }, [studentProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.updateStudentProfile(formData);
      await refreshUserData();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan draf.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    setLoading(true);
    setError(null);
    try {
      // First save profile
      await api.updateStudentProfile(formData);
      // Then submit registration
      await api.submitRegistration();
      await refreshUserData();
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirimkan formulir.');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = ['terverifikasi', 'siap_ujian', 'sedang_ujian', 'ujian_selesai', 'lulus', 'tidak_lulus'].includes(registration?.status || '');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Formulir Pendaftaran Santri Baru</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lengkapi data diri calon santri dan identitas orang tua/wali dengan teliti.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Draf tersimpan
            </span>
          )}
          {!isLocked && (
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Draf</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {isLocked && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
          <span>Formulir telah dikirim dan diverifikasi. Data terkunci untuk menjaga keabsahan berkas seleksi.</span>
        </div>
      )}

      {/* Step Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs">
        <button
          onClick={() => setActiveStep(1)}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeStep === 1 ? 'bg-[#5E35B1] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>1. Data Pribadi</span>
        </button>
        <button
          onClick={() => setActiveStep(2)}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeStep === 2 ? 'bg-[#5E35B1] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>2. Data Orang Tua / Wali</span>
        </button>
        <button
          onClick={() => setActiveStep(3)}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeStep === 3 ? 'bg-[#5E35B1] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>3. Konfirmasi & Pengajuan</span>
        </button>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Bagian 1: Data Pribadi Calon Santri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK)
                </label>
                <input
                  type="text"
                  name="nik"
                  disabled={isLocked}
                  maxLength={16}
                  value={formData.nik}
                  onChange={handleChange}
                  placeholder="16 digit sesuai Kartu Keluarga"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenjang Pendidikan yang Dipilih
                </label>
                <select
                  name="education_level"
                  disabled={isLocked}
                  value={formData.education_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1] bg-white"
                >
                  <option value="SMP">SMP Al-Ikhlash (3 Tahun)</option>
                  <option value="SMA">SMA Unggulan Al-Ikhlash (3 Tahun)</option>
                  <option value="KMI">KMI Tarbiyatul Mu'allimin (Kader Da'i)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  name="birth_place"
                  disabled={isLocked}
                  value={formData.birth_place}
                  onChange={handleChange}
                  placeholder="Kota / Kabupaten"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  name="birth_date"
                  disabled={isLocked}
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  name="gender"
                  disabled={isLocked}
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1] bg-white"
                >
                  <option value="L">Laki-laki (Putra)</option>
                  <option value="P">Perempuan (Putri)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asal Sekolah (SD/MI/SMP/MTs)
              </label>
              <input
                type="text"
                name="school_origin"
                disabled={isLocked}
                value={formData.school_origin}
                onChange={handleChange}
                placeholder="Nama sekolah asal sebelumnya"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Tempat Tinggal Lengkap
              </label>
              <textarea
                name="address"
                disabled={isLocked}
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-lg transition-colors"
              >
                <span>Lanjut ke Data Orang Tua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Bagian 2: Data Orang Tua / Wali Santri
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Orang Tua / Wali
              </label>
              <input
                type="text"
                name="parent_name"
                disabled={isLocked}
                value={formData.parent_name}
                onChange={handleChange}
                placeholder="Nama Ayah / Ibu / Wali yang bertanggung jawab"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp Orang Tua / Wali (Aktif)
              </label>
              <input
                type="tel"
                name="parent_phone"
                disabled={isLocked}
                value={formData.parent_phone}
                onChange={handleChange}
                placeholder="contoh: 081233445566"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5E35B1]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nomor ini akan digunakan panitia untuk pengiriman informasi resmi kelulusan santri.
              </span>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-lg transition-colors"
              >
                <span>Lanjut ke Konfirmasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Bagian 3: Ringkasan & Konfirmasi Pengajuan
            </h3>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">Nomor Pendaftaran:</span>
                <span className="font-bold font-mono text-[#5E35B1]">{studentProfile?.registration_number}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">Jenjang Pilihan:</span>
                <span className="font-bold text-slate-900">{formData.education_level}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">NIK:</span>
                <span className="font-mono text-slate-900">{formData.nik || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">TTL:</span>
                <span className="text-slate-900">{formData.birth_place || '-'}, {formData.birth_date || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">Sekolah Asal:</span>
                <span className="text-slate-900">{formData.school_origin || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">Orang Tua / Wali:</span>
                <span className="text-slate-900">{formData.parent_name || '-'} ({formData.parent_phone || '-'})</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">Alamat:</span>
                <span className="text-slate-900">{formData.address || '-'}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <strong>Pemberitahuan Penting:</strong> Pastikan Anda telah mengunggah minimal <strong>Pas Foto</strong> dan <strong>Kartu Keluarga (KK)</strong> di menu Berkas Persyaratan sebelum mengajukan verifikasi kepada panitia.
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              {!isLocked ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmitFinal}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Mengirim Formulir...' : 'Kirim Formulir untuk Diverifikasi'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/student/dashboard')}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#5E35B1] rounded-lg"
                >
                  Kembali ke Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
