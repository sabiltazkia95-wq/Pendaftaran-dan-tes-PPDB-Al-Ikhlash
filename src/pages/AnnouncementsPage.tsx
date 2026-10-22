import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { Bell, Calendar, ChevronRight } from 'lucide-react';

interface AnnouncementsPageProps {
  navigate: (path: string) => void;
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ navigate }) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnnouncements(true)
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <span className="text-xs font-semibold text-[#5E35B1] uppercase tracking-wider">Informasi Terpadu</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Pengumuman Resmi PPDB 2027/2028
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Pemberitahuan terkini terkait alur penerimaan, jadwal verifikasi berkas, tes CBT, dan hasil seleksi.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Memuat pengumuman...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
          Belum ada pengumuman yang diterbitkan saat ini.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <article
              key={ann.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-[#B39DDB] transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Calendar className="w-3.5 h-3.5 text-[#5E35B1]" />
                <span>
                  {new Date(ann.published_at || ann.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span>·</span>
                <span className="bg-[#F3EEFF] text-[#5E35B1] font-semibold px-2 py-0.5 rounded text-[11px]">
                  Publik
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2">{ann.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
