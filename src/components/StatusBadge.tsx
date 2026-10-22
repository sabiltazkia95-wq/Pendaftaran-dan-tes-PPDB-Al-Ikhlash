import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'draft':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Draft Formulir
        </span>
      );
    case 'menunggu_verifikasi':
    case 'menunggu':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Menunggu Verifikasi
        </span>
      );
    case 'perlu_perbaikan':
    case 'ditolak':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-800 border border-rose-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Perlu Perbaikan
        </span>
      );
    case 'terverifikasi':
    case 'disetujui':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Terverifikasi
        </span>
      );
    case 'siap_ujian':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-[#F3EEFF] text-[#5E35B1] border border-[#B39DDB]/40 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#5E35B1]"></span>
          Siap Ujian CBT
        </span>
      );
    case 'sedang_ujian':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
          Sedang Ujian
        </span>
      );
    case 'ujian_selesai':
    case 'submitted':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-800 border border-blue-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Ujian Selesai
        </span>
      );
    case 'menunggu_pengumuman':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-800 border border-purple-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Menunggu Pengumuman
        </span>
      );
    case 'lulus':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          LULUS SELEKSI
        </span>
      );
    case 'tidak_lulus':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md bg-rose-100 text-rose-900 border border-rose-300 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
          TIDAK LULUS
        </span>
      );
    case 'cadangan':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          CADANGAN
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs text-slate-600 ${className}`}>
          {status}
        </span>
      );
  }
};
