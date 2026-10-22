import React from 'react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center p-1 border border-white/10">
                <img
                  src="/src/assets/images/al_ikhlash_pesantren_logo_1792632707497.jpg"
                  alt="Logo Pondok Pesantren Al-Ikhlash"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Pondok Pesantren Al-Ikhlash
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-md">
              Mendidik generasi Qur’ani yang berilmu amaliyah, beramal ilmiah, dan berakhlakul karimah melalui kurikulum terpadu salafiyah dan modern.
            </p>
            <div className="mt-4 text-xs text-slate-400">
              <p>Sekretariat PPDB: Gedung Pusat Pelayanan Santri Al-Ikhlash</p>
              <p>Kecamatan Ciawi, Kabupaten Tasikmalaya, Jawa Barat, Indonesia</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Tautan Informasi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                  Beranda PPDB
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/announcements')} className="hover:text-white transition-colors">
                  Pengumuman Resmi
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/help')} className="hover:text-white transition-colors">
                  Panduan Pendaftaran
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/privacy-policy')} className="hover:text-white transition-colors">
                  Kebijakan Privasi
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Kontak & Layanan</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>WhatsApp: +62 812-3456-7890</li>
              <li>Email: ppdb@alikhlash.sch.id</li>
              <li>Jam Pelayanan: Senin - Sabtu (08.00 - 15.30 WIB)</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2027 Panitia Penerimaan Santri Baru Pondok Pesantren Al-Ikhlash. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
            <button onClick={() => navigate('/privacy-policy')} className="hover:text-slate-300">
              Kebijakan Privasi
            </button>
            <button onClick={() => navigate('/help')} className="hover:text-slate-300">
              Bantuan & FAQ
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
