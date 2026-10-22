import React, { useState, useEffect } from 'react';
import { api, DocumentData } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, Eye, X } from 'lucide-react';

interface StudentDocumentsProps {
  navigate: (path: string) => void;
}

export const StudentDocuments: React.FC<StudentDocumentsProps> = ({ navigate }) => {
  const { registration } = useAuth();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docTypes = [
    { key: 'pas_foto', title: 'Pas Foto Resmi (3x4)', desc: 'Latar biru/merah, pakaian rapi / berpeci / berjilbab.', required: true },
    { key: 'kartu_keluarga', title: 'Kartu Keluarga (KK)', desc: 'Scan asli atau fotokopi legalisir.', required: true },
    { key: 'akta_kelahiran', title: 'Akta Kelahiran', desc: 'Scan dokumen asli Disdukcapil.', required: false },
    { key: 'ijazah', title: 'Ijazah / Surat Keterangan Lulus (SKL)', desc: 'Dapat menyusul jika belum terbit.', required: false },
  ];

  const loadDocuments = async () => {
    try {
      const res = await api.getRegistration();
      setDocuments(res.documents || []);
    } catch (err: any) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Format file harus berupa JPG, PNG, atau PDF.');
      return;
    }

    setError(null);
    setUploadingType(docType);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        await api.uploadDocument({
          document_type: docType,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          data_base64: base64Data
        });
        await loadDocuments();
      } catch (err: any) {
        setError(err.message || 'Gagal mengunggah dokumen.');
      } finally {
        setUploadingType(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berkas ini?')) return;
    try {
      await api.deleteDocument(docId);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus berkas.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Berkas Persyaratan PPDB</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah dokumen asli dalam format JPG, PNG, atau PDF (maks. 5MB per berkas).
          </p>
        </div>
        <button
          onClick={() => navigate('/student/registration')}
          className="text-xs font-semibold text-[#5E35B1] hover:underline"
        >
          Lihat Status Formulir →
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docTypes.map((type) => {
          const uploaded = documents.find((d) => d.document_type === type.key);
          const isUploading = uploadingType === type.key;

          return (
            <div
              key={type.key}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      {type.title}
                      {type.required && <span className="text-rose-500">*</span>}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{type.desc}</p>
                  </div>
                  {uploaded && <StatusBadge status={uploaded.verification_status} />}
                </div>

                {/* Uploaded Info */}
                {uploaded ? (
                  <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-5 h-5 text-[#5E35B1] shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 truncate">{uploaded.file_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(uploaded.file_size / 1024).toFixed(0)} KB · {uploaded.mime_type.split('/')[1]?.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {uploaded.data_base64 && (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(uploaded)}
                          className="p-1.5 text-slate-600 hover:text-[#5E35B1] rounded-lg hover:bg-slate-200/60"
                          title="Pratinjau Berkas"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {uploaded.verification_status !== 'disetujui' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(uploaded.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Hapus Berkas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="my-4 p-5 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                    <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <span className="text-xs text-slate-500">Berkas belum diunggah</span>
                  </div>
                )}

                {/* Panitia Notes */}
                {uploaded?.review_notes && (
                  <div className={`p-2.5 rounded-lg text-xs mb-3 ${
                    uploaded.verification_status === 'ditolak'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <strong>Catatan Panitia:</strong> {uploaded.review_notes}
                  </div>
                )}
              </div>

              {/* Upload Input Button */}
              {uploaded?.verification_status !== 'disetujui' && (
                <div className="pt-2">
                  <label className="block w-full text-center py-2 px-3 text-xs font-semibold text-[#5E35B1] bg-[#F3EEFF] hover:bg-[#EBE2FC] border border-[#B39DDB]/40 rounded-xl cursor-pointer transition-colors">
                    <span>{isUploading ? 'Mengunggah...' : uploaded ? 'Ganti Berkas Dokumen' : 'Pilih & Unggah Berkas'}</span>
                    <input
                      type="file"
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(type.key, e)}
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900 truncate">
                Pratinjau: {previewDoc.file_name}
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/5">
              {previewDoc.mime_type.startsWith('image/') ? (
                <img
                  src={previewDoc.data_base64}
                  alt={previewDoc.file_name}
                  className="max-h-[70vh] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <iframe
                  src={previewDoc.data_base64}
                  title={previewDoc.file_name}
                  className="w-full h-[70vh] rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
