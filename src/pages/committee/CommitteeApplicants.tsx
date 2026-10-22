import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { Search, Filter, Eye, CheckCircle2, AlertCircle, X, Check, FileText } from 'lucide-react';

export const CommitteeApplicants: React.FC = () => {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Verification Form State
  const [verifyStatus, setVerifyStatus] = useState<string>('terverifikasi');
  const [verifyNotes, setVerifyNotes] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const data = await api.getApplicants({
        search,
        status: statusFilter,
        education_level: levelFilter
      });
      setApplicants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [statusFilter, levelFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplicants();
  };

  const openDetails = async (id: string) => {
    setDetailsLoading(true);
    setActionSuccess(null);
    try {
      const data = await api.getApplicantDetails(id);
      setSelectedApp(data);
      setVerifyStatus(data.registration.status === 'perlu_perbaikan' ? 'perlu_perbaikan' : 'terverifikasi');
      setVerifyNotes(data.registration.review_notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'disetujui' | 'ditolak', notes: string = '') => {
    try {
      await api.verifyDocument({
        document_id: docId,
        verification_status: status,
        review_notes: notes
      });
      // reload detail
      if (selectedApp) {
        openDetails(selectedApp.registration.id);
      }
      loadApplicants();
    } catch (err: any) {
      alert(err.message || 'Gagal memverifikasi dokumen.');
    }
  };

  const handleSaveRegistrationDecision = async () => {
    if (!selectedApp) return;
    try {
      await api.verifyRegistration({
        registration_id: selectedApp.registration.id,
        status: verifyStatus,
        review_notes: verifyNotes
      });
      setActionSuccess(`Keputusan pendaftaran berhasil disimpan sebagai '${verifyStatus}'.`);
      openDetails(selectedApp.registration.id);
      loadApplicants();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan keputusan.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Pendaftar Calon Santri</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan data biodata, verifikasi berkas, dan persetujuan hak mengikuti tes CBT.
          </p>
        </div>

        <div className="text-xs font-mono font-bold text-[#5E35B1] bg-[#F3EEFF] px-3 py-1.5 rounded-lg border border-[#B39DDB]/30">
          Total: {applicants.length} Santri
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, no. pendaftaran, email, sekolah asal..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E35B1]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
              <option value="perlu_perbaikan">Perlu Perbaikan</option>
              <option value="terverifikasi">Terverifikasi</option>
              <option value="sedang_ujian">Sedang Ujian</option>
              <option value="ujian_selesai">Ujian Selesai</option>
              <option value="lulus">Lulus</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Jenjang:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">Semua Jenjang</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="KMI">KMI</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Memuat data pendaftar...</div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">Tidak ada pendaftar yang sesuai filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">No. Pendaftaran</th>
                  <th className="py-3 px-4 font-semibold">Nama Lengkap</th>
                  <th className="py-3 px-4 font-semibold">Jenjang</th>
                  <th className="py-3 px-4 font-semibold">Sekolah Asal</th>
                  <th className="py-3 px-4 font-semibold">Status Pendaftaran</th>
                  <th className="py-3 px-4 font-semibold">Dokumen</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#5E35B1]">{app.registration_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{app.full_name}</td>
                    <td className="py-3 px-4 text-slate-600">{app.education_level}</td>
                    <td className="py-3 px-4 text-slate-600">{app.school_origin || '-'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-medium text-emerald-700">{app.documents_approved}</span> / {app.documents_count} Dokumen
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openDetails(app.id)}
                        className="px-3 py-1.5 bg-[#F3EEFF] text-[#5E35B1] hover:bg-[#5E35B1] hover:text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Periksa & Verifikasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Applicant Detail & Document Verification Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono text-[#5E35B1] font-bold">
                  {selectedApp.student?.registration_number}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedApp.user?.full_name} ({selectedApp.student?.education_level})
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Biodata Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">NIK:</span>
                <div className="font-mono font-medium text-slate-800">{selectedApp.student?.nik || '-'}</div>
              </div>
              <div>
                <span className="text-slate-400">TTL:</span>
                <div className="text-slate-800">{selectedApp.student?.birth_place}, {selectedApp.student?.birth_date}</div>
              </div>
              <div>
                <span className="text-slate-400">Jenis Kelamin:</span>
                <div className="text-slate-800">{selectedApp.student?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
              </div>
              <div>
                <span className="text-slate-400">Asal Sekolah:</span>
                <div className="text-slate-800">{selectedApp.student?.school_origin || '-'}</div>
              </div>
              <div>
                <span className="text-slate-400">Orang Tua / Wali:</span>
                <div className="text-slate-800">{selectedApp.student?.parent_name}</div>
              </div>
              <div>
                <span className="text-slate-400">WhatsApp Orang Tua:</span>
                <div className="text-slate-800 font-mono">{selectedApp.student?.parent_phone}</div>
              </div>
            </div>

            {/* Uploaded Documents List with One-Click Verify */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pemeriksaan Dokumen Persyaratan ({selectedApp.documents.length} Berkas)
              </h4>

              {selectedApp.documents.length === 0 ? (
                <div className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl text-center">
                  Calon santri belum mengunggah dokumen persyaratan.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedApp.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-[#5E35B1] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 capitalize">
                            {doc.document_type.replace('_', ' ')}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                            {doc.file_name} · {(doc.file_size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={doc.verification_status} />

                        {doc.data_base64 && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-xs text-slate-700 hover:text-[#5E35B1] bg-slate-100 hover:bg-slate-200 rounded"
                            title="Pratinjau"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(doc.id, 'disetujui', 'Dokumen sah dan valid.')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white rounded border border-emerald-200 transition-colors"
                        >
                          Setujui
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const notes = prompt('Masukkan alasan penolakan berkas:', 'Foto / dokumen buram, mohon unggah ulang yang jelas.');
                            if (notes) {
                              handleVerifyDocument(doc.id, 'ditolak', notes);
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-800 hover:bg-rose-600 hover:text-white rounded border border-rose-200 transition-colors"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decision Panel */}
            <div className="bg-[#F3EEFF]/50 p-5 rounded-2xl border border-[#B39DDB]/40 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Keputusan Status Pendaftaran Santri
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ubah Status Menjadi:
                  </label>
                  <select
                    value={verifyStatus}
                    onChange={(e) => setVerifyStatus(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="terverifikasi">Terverifikasi (Diberi Hak Ujian CBT)</option>
                    <option value="perlu_perbaikan">Perlu Perbaikan (Kembalikan ke Santri)</option>
                    <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Verifikator untuk Santri:
                  </label>
                  <input
                    type="text"
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    placeholder="contoh: Berkas lengkap dan sah."
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveRegistrationDecision}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#512DA8] rounded-xl shadow-xs transition-colors"
                >
                  Simpan Keputusan Verifikasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview in Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">{previewDoc.file_name}</span>
              <button onClick={() => setPreviewDoc(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 rounded-xl my-2">
              {previewDoc.mime_type.startsWith('image/') ? (
                <img src={previewDoc.data_base64} alt="Doc preview" className="max-h-[65vh] object-contain rounded" />
              ) : (
                <iframe src={previewDoc.data_base64} title="PDF preview" className="w-full h-[65vh] rounded" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
